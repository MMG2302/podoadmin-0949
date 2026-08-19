# Reglas de seguridad de datos de pacientes

Estas reglas nacen de un escaneo de Claude Security (2026-07-28, `CLAUDE-SECURITY-20260728-063004/`) que encontró varios endpoints que devolvían datos de pacientes de **otras clínicas** porque nadie comprobaba a quién pertenecía el dato antes de entregarlo (findings F1-F5). Se corrigieron, pero el mismo error puede volver a aparecer en cualquier endpoint nuevo o editado si no se aplica esta regla de forma consistente. Por eso quedan documentadas acá: se cargan automáticamente en cada sesión de Claude Code sobre este proyecto.

## La regla

Cualquier endpoint o función nueva o editada que lea o escriba datos ligados a un paciente (sesiones clínicas, adjuntos de laboratorio, exportaciones, métricas, mensajes, citas, etc.) **debe** comprobar que ese dato pertenece al tenant (clínica/podólogo) del usuario que hace el pedido — nunca confiar solo en un permiso por rol (`requirePermission`).

### Para un solo registro (ej. `GET /:id`, `GET /:id/download`)

Cargar el registro dueño (paciente o sesión) y llamar, antes de devolver nada:

```ts
const accessDenied = await getPatientAccessDeniedReason(user, patientRow);
if (accessDenied) return c.json({ error: accessDenied }, 403);
```

(`getSessionAccessDeniedReason` para sesiones). Ambas viven en `src/api/utils/tenant-isolation.ts`.

Si el registro que se está protegiendo (ej. un adjunto de laboratorio) no tiene su propio `createdBy`/`clinicId` normalizado al podólogo titular, hay que cargar el **paciente dueño** y comprobar contra ese, no contra el registro en sí — el `createdBy` de un adjunto suele ser quien lo subió (podólogo o recepcionista en su nombre), no el titular del paciente. Ver el fix de F2 en `src/api/routes/lab-attachments.ts` como ejemplo de este error y su corrección.

### Para listados (ej. `GET /`)

Nunca hacer un `select()` sin `where` de alcance. Usar:

```ts
const scope = await resolveClinicalListScope(user);
const where = mergeScopeWhere(scope, { createdBy: tabla.createdBy, clinicId: tabla.clinicId });
```

de `src/api/utils/clinical-list-scope.ts`. Si la tabla no tiene sus propias columnas `createdBy`/`clinicId` normalizadas (como los adjuntos de laboratorio), hacer `join` a la tabla que sí las tiene (`patients`) y aplicar el scope contra esas columnas — ver el fix de F3.

### Parámetros opcionales que acotan una consulta (ej. `?podiatristId=`)

Un parámetro que el cliente puede mandar para "filtrar por otro podólogo" solo puede **acotar (AND)** el alcance ya calculado del usuario — nunca **reemplazarlo**. Si el valor pedido queda fuera del alcance del usuario, la consulta debe devolver una lista vacía, nunca los datos de otro tenant. Ver el fix de F5 en `src/api/utils/satisfaction-summary.ts`.

### Claves de almacenamiento (R2, buckets)

Nunca aceptar una `fileKey`/ruta de almacenamiento tal cual la manda el cliente. Generarla en el servidor, o si el cliente debe declararla, validar que esté confinada al namespace del propio paciente (`lab/<patientId>/<archivo>`, sin `..` ni segmentos extra). Ver el fix de F1.

## Antes de dar por terminada cualquier tarea que toque datos de pacientes

1. ¿El endpoint nuevo o editado sigue alguna de las reglas de arriba? Si falta, agregarla — no asumir que el permiso por rol (`requirePermission`) alcanza.
2. Antes de publicar cambios grandes, correr `/claude-security` (nivel `medium` o más) para volver a escanear. Los escaneos no son deterministas: correrlos seguido construye cobertura con el tiempo.
3. Si el escaneo encuentra algo nuevo, seguir el mismo patrón: parche revisado por el panel de agentes, nunca aplicado a ciegas.

---

Las secciones de abajo vienen de los demás documentos de seguridad ya existentes en este repo (`AUDITORIA_VULNERABILIDADES.md`, `ARQUITECTURA_SAAS_SEGURIDAD.md`, `CONFIGURACION_SEGURIDAD.md`, `CHECKLIST_DEPLOY_PRODUCCION.md`, `COMPLIANCE_CONFIANZA.md`, `docs/COMPLIANCE_RUNBOOK.md`, `src/api/CSRF_IMPLEMENTATION.md`, `src/api/INPUT_SECURITY.md`, `src/api/RATE_LIMITING.md`, `src/api/COOKIES_IMPLEMENTATION.md`, `src/api/security/README.md`). Son las reglas que no deben romperse en ningún cambio futuro — no lo que ya está bien, sino lo que hay que seguir cumpliendo.

**Aviso sobre documentos desactualizados:** `src/api/SECURITY_CHECKLIST.md` y partes de `SECURITY_IMPLEMENTATION.md`/`SECURITY_SUMMARY.md` tienen una sección "Pendientes" (migrar a base de datos, email real, 2FA, etc.) que **ya está hecha** según documentos más nuevos (`CONFIGURACION_SEGURIDAD.md`, `CHECKLIST_DEPLOY_PRODUCCION.md`) — no confiar en esa lista de pendientes sin verificar el código actual primero.

## Autenticación, sesiones y secretos

- **Nunca** un valor por defecto para `JWT_SECRET`, `REFRESH_TOKEN_SECRET` ni `CSRF_SECRET`. Ya está así en `src/api/utils/jwt.ts` (`encodeSecret`) y `src/api/utils/csrf.ts` (`getCsrfSecret`): si falta el env var o mide menos de 32 caracteres, **debe lanzar un error y no arrancar** — no volver a introducir un fallback tipo `|| 'clave-por-defecto'`.
- Access token: 15 minutos. Refresh token: 7 días. Ambos en cookies `HttpOnly`, `Secure` en producción, `SameSite=Lax` (`src/api/utils/cookies.ts`). No pasar tokens a `localStorage`.
- Logout debe invalidar el token de inmediato vía blacklist (`src/api/utils/token-blacklist.ts`), no solo borrar la cookie del lado del cliente.
- Cuentas baneadas/bloqueadas/deshabilitadas: si se agrega un nuevo middleware de autorización que dependa de `resolveSystemAccess`, debe seguir revisando `isBanned`/`isBlocked`/`disabledAt` (esto ya fue un finding del escaneo — ver F9/F10 en el reporte).
- **2FA** (`src/api/utils/two-factor-auth.ts`): el secreto TOTP y los códigos de respaldo se generan con `crypto.getRandomValues()`, nunca `Math.random()`. Los códigos de respaldo se guardan **hasheados** (SHA-256 del código normalizado), nunca en claro: son credenciales equivalentes a una contraseña. SHA-256 y no bcrypt a propósito — son valores aleatorios de 60 bits, no contraseñas elegidas por una persona, y hay que comparar contra diez de ellos en cada intento. Un fallo de 2FA en el login **debe** contar para `recordFailedAttemptD1` y `recordLoginIPFailedAttemptD1` igual que una contraseña fallida; si no, quien ya tiene la contraseña agota un TOTP de 6 dígitos por fuerza bruta.
  - Pendiente: el secreto TOTP se guarda en claro (existe `encryptSecret`/`decryptSecret` en `field-encryption.ts` para esto) y `/2fa/enable` acepta el secreto desde el cuerpo de la petición en vez de guardarlo en servidor entre `setup` y `enable`.
  - Ya no es cierto que falte la interfaz (verificado el 2026-08-18): la sección de activación vive en `src/web/components/settings/two-factor-settings-section.tsx`, montada en la pestaña de seguridad de `settings-page.tsx`, y `login.tsx` resuelve el desafío `requires2FA`. El pie de la landing anuncia 2FA como garantía pública, así que si alguna vez se desmonta esa interfaz hay que sacar también `footerStatTwoFactor` de `landing-i18n.ts`.
- Login: rate limit progresivo por `email:IP` — 3 fallos → 5s, 5 fallos → 30s, 10 fallos → bloqueo 15 min — más tope de 50 fallos/hora por IP (`rate-limit-d1.ts`). No debilitar ni quitar estos límites al tocar `auth.ts`.

## CSRF

- Todo `POST`/`PUT`/`PATCH`/`DELETE` nuevo debe quedar cubierto por `csrfProtection` (middleware global en `src/api/index.ts`) — si se agrega una excepción nueva a la lista de rutas sin CSRF, tiene que ser porque el usuario todavía no tiene sesión (como `/auth/login`), nunca por comodidad.
- El patrón es double-submit cookie: token en cookie `csrf-token` (no HttpOnly, a propósito) + header `X-CSRF-Token` que el cliente ya maneja solo vía `src/web/lib/api-client.ts`. No mover el token a `localStorage`.

## Validación, sanitización y consultas a la base de datos

- Toda consulta a D1 pasa por Drizzle ORM parametrizado. **Nunca** SQL crudo con valores interpolados (`sql\`...${valorSinEscapar}...\`` sin placeholder, o concatenación de strings).
- Cualquier `orderBy` o filtro cuyo **nombre de columna** (no el valor) pudiera venir del cliente debe mapearse contra una allowlist fija de columnas — el usuario elige valores, nunca claves/nombres de columna.
- Path params (`:id`, `:userId`, `:clinicId`, etc.) pasan por `sanitizePathParam()` antes de usarse en una consulta o loguearse.
- Body/query pasan por el middleware de sanitización global (`sanitizationMiddleware` → `sanitizeInput`/`escapeHtml`).
- **No devolver `error.message` ni el stack de una excepción al cliente en una respuesta 4xx/5xx.** Esto sigue roto hoy en `src/api/routes/users.ts` (líneas ~704 y ~754) y `src/api/routes/clinics.ts` (línea ~236) — no copiar ese patrón en código nuevo, y si se toca alguno de esos archivos, corregirlo: mensaje genérico al cliente, el detalle solo al log/métrica interna.
- Campos que deben ser una URL: pasarlos por `sanitizeUrlField()`/`containsObfuscatedOrSuspiciousUrl()` (`src/api/utils/sanitization.ts`) antes de guardarlos o mostrarlos, por la detección anti-phishing de URLs ofuscadas (`hxxp`, `[.]`, base64, etc.).

## Cabeceras de seguridad (CSP, clickjacking)

- La CSP real (headers HTTP) vive en `src/api/middleware/csp.ts` y solo se aplica a `/api/*` — **no cubre las páginas HTML servidas como assets estáticos** (login, dashboard, etc.). Ver finding F17 del escaneo: el `<meta>` de `index.html` no es un sustituto válido de `X-Frame-Options`/`frame-ancestors` para esas páginas. Si se toca el enrutamiento de `wrangler.json` (`run_worker_first`) o el pipeline de assets, no perder de vista este hueco.
- **Sigue abierto:** `index.html` (y `scripts/html-csp.ts`) declaran `script-src 'self' 'unsafe-inline' 'unsafe-eval'` en la CSP del frontend — esto debilita la protección XSS. No es algo ya resuelto; si se edita esa CSP, el objetivo es sacar `unsafe-inline`/`unsafe-eval` (nonces o hashes), no ampliarla más.

## Cumplimiento y retención de datos clínicos

- Antes de borrar un paciente, sesión clínica o cualquier registro con retención legal, comprobar que no tenga un **legal hold** activo (`src/api/utils/legal-hold.ts`) — un hold activo bloquea el borrado automático, sin excepción.
- La purga automática de datos vencidos corre por cron (`clinical-retention-purge`, 05:00 UTC) y respeta `retainUntil` y los legal holds; no agregar un borrado manual/directo que se salte ese motor de retención (`src/api/utils/retention-policy.ts`).
- Los audit logs (`audit_log`) son de solo escritura por la app — no exponer un endpoint que permita editarlos o borrarlos.
- Cualquier acción sensible nueva (crear/editar/borrar usuario, bloquear, cambiar permisos, 2FA, exportar datos, etc.) debe registrarse con `logAuditEvent`, igual que las existentes.

## Variables de entorno obligatorias antes de producción

No desplegar a producción sin definir (como Secrets de Cloudflare Workers, no en `[vars]` plano):

- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `CSRF_SECRET` — ≥32 caracteres, distintos entre sí.
- `NODE_ENV=production`, `APP_BASE_URL`, `ALLOWED_ORIGINS`, `OFFICIAL_APP_DOMAIN`.
- Si hay registro público habilitado: proveedor de email (Resend/SendGrid/SES) + CAPTCHA configurados — sin esto, no dejar `publicRegistrationEnabled: true` en producción.
- No usar `IP_WHITELIST` con rangos CIDR amplios en producción — además `isIPWhitelisted()` en `src/api/utils/ip-tracking.ts` compara por *prefijo de texto*, no por máscara real, así que un rango CIDR puede matchear IPs que no debería (bug pendiente de arreglar, no solo de configurar con cuidado).
- Rutas de solo-desarrollo (`/api/test/*`, `/api/auth/clear-ip-block`) deben seguir exigiendo `requireNonProductionDev` — nunca quitar ese guard para "probar algo rápido" en un entorno accesible desde internet.

---

# Landing pública (`/landing` y `/faq`)

Esta sección no viene del escaneo de seguridad: son las convenciones de la web pública, para
no tener que redescubrirlas leyendo el JSX cada vez.

- **Todo el texto vive en `src/web/i18n/landing-i18n.ts`, en cuatro idiomas (es/en/pt/fr).**
  No hay copy suelto en el JSX. Cualquier cambio de texto se hace en los cuatro bloques, o el
  idioma que falte rompe el tipo `LandingI18n`.
- **El orden en pantalla es el orden del código**, a propósito: las secciones van en el orden
  del JSX de `src/web/pages/landing-page.tsx` y los planes en el orden del array
  `pricingPlans` de cada idioma. No invertir ni reordenar al renderizar — lo que se lee en el
  archivo es lo que se ve, y así un plan nuevo cae donde lo pusiste. Hoy: hero (quiénes
  somos) → `#audience` (para quién es) → `#solutions` (qué resuelve) → `#pricing` (cuánto
  cuesta, del más caro al más barato) → `#features` → `#steps` → `#comparison` → `#guide` →
  enlace a FAQ → CTA.
- **`sections` en `src/web/components/landing/landing-chrome.tsx` tiene que seguir ese mismo
  orden.** Es el nav de la cabecera y son anclas por `id`: si se mueve una sección y el nav
  no, los enlaces siguen funcionando pero mandan al visitante hacia atrás.
- **Cabecera y pie son compartidos con `/faq`** y viven en `landing-chrome.tsx`. No
  duplicarlos en `landing-page.tsx`: el día que se agregue un enlace queda en una sola de las
  dos páginas.
- **Los fondos alternan**: banda gris (`bg-brand-surface border-y border-brand-border`) y
  banda clara, una sí y una no. Al cambiar una sección de lugar hay que intercambiar esas
  clases con su nueva vecina o quedan dos bandas iguales pegadas.
- **La cinta de `#audience`** se mueve con `animate-marquee` (definida en
  `src/web/styles.css`). Tres invariantes la sostienen y romper cualquiera se ve como un
  salto: la lista va repetida **cuatro** veces y el keyframe desplaza `-50%` (media pista
  tiene que ser más ancha que la pantalla o aparece el hueco del final del carril); la
  separación entre tarjetas es `mr-4` **en la tarjeta** y no `gap` en el carril (con `gap` el
  patrón que se repite no es exacto y el bucle salta medio hueco); y el ancho de la tarjeta es
  fijo, porque si no el carril mide distinto en cada idioma. Las copias 2-4 van `aria-hidden`,
  y la cinta se detiene con el puntero encima y con `motion-reduce`.
- **Los clips de `#steps`** están grabados con la interfaz en inglés a propósito: un solo
  juego de capturas para los cuatro idiomas en vez de cuatro juegos que mantener. Su
  contenedor lleva fondo blanco fijo, no `bg-brand-canvas`, porque con `object-contain` el
  sobrante quedaba como franja oscura en tema oscuro.
- **El HTML pre-renderizado de `scripts/seo.ts` tiene que ir en el mismo orden que el JSX.**
  Es lo que leen Google y las IAs, y es un archivo aparte: al mover una sección en
  `landing-page.tsx` hay que moverla también en `buildPrerenderedLanding()` y en su `<nav>`,
  o el resumen que se hace del sitio deja de ser el de la página.
- **Las rutas de los clips viven en `src/web/components/landing/step-media.ts`**, no en el
  `.tsx`: las importa también `scripts/seo.ts`, que corre en Node y no puede cargar React.
  Su texto alternativo es copy y va traducido en `stepsMediaAlt` (`landing-i18n.ts`),
  indexado por posición igual que `steps`. Son las únicas imágenes de contenido del sitio:
  sin `alt` no hay nada que indexar en ellas.
- **El bloque `es` está escrito en español de México**, no de España: `consultorio` (no
  `consulta`), `expediente clínico` (no `historia clínica`), `celular` (no `móvil`),
  `citas en línea`. No es estilo: `expediente clínico` es el término de la NOM-004 y es lo
  que se teclea en México. Al agregar copy en `es`, seguir ese vocabulario. `enlace de
  reservas` se queda como está: es el nombre de la función.
- **`faqItems` puede tener distinto largo en cada idioma.** Las preguntas sobre NOM-004,
  CURP, CFDI y "¿me hacen una página web?" existen solo en `es` a propósito: hablan del
  mercado mexicano y no le dicen nada a quien lee en inglés, portugués o francés. Es un
  array, así que no rompe el tipo `LandingI18n`.
- **Sobre la NOM-004 se describe lo que hace el producto, no se afirma cumplimiento.** La
  copy dice qué guarda cada nota de evolución y cuántos años se conserva el expediente;
  no dice "Podoraa cumple la NOM-004". Es una afirmación normativa que necesita respaldo
  legal, no una decisión de redacción.
