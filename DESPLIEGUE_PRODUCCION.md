# Despliegue a producción — PodoAdmin

Guía única de referencia para publicar la aplicación (Cloudflare Workers + D1 + assets). Complementa el checklist accionable en `CHECKLIST_DEPLOY_PRODUCCION.md` y el detalle de variables en `ENV_VARIABLES.md` y `PRODUCCION_CONFIG.md`.

---

## 1. Arquitectura del despliegue

| Componente | Rol |
|------------|-----|
| **Cloudflare Worker** | API bajo `/api/*`, cookies, CSRF, auth, lógica de negocio |
| **Assets (SPA)** | React desde `dist/client`; `run_worker_first: ["/api/*"]` en `wrangler.toml` |
| **D1** | Base SQLite (`binding: DB`); datos persistentes entre despliegues de código |
| **R2** (opcional) | Bucket enlazado en `wrangler.toml` si usas almacenamiento de objetos |

Un despliegue **no borra** la D1 remota: migraciones y backups son tu responsabilidad.

---

## 2. Prerrequisitos

- Cuenta de Cloudflare con Workers y D1 habilitados.
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) autenticado: `npx wrangler login`.
- Node.js LTS y dependencias instaladas: `npm install`.
- **No** subir a git: `.dev.vars`, secretos reales, dumps de BD con datos personales.

---

## 3. Base de datos D1 (remota)

1. **Crear** la base D1 en el dashboard de Cloudflare (Workers → D1).
2. **Alinear** `wrangler.toml` → `[[d1_databases]]`: `binding = "DB"`, `database_name` y `database_id` de **producción**.
3. **Migraciones** (antes o justo después del primer deploy con código que las necesite):

   ```bash
   npm run db:migrate:remote
   ```

4. **Primer super administrador** (solo si no existe ninguno):

   ```bash
   node scripts/create-super-admin.cjs "<EMAIL>" "<CONTRASEÑA_SEGURA>" "<NOMBRE>"
   npx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
   ```

5. **Prohibido en producción**: `npm run db:seed:remote` y datos mock de prueba en la BD remota.

---

## 4. Variables y secretos (Workers)

El Worker **no arranca** si faltan o son inválidos `JWT_SECRET`, `REFRESH_TOKEN_SECRET` y `CSRF_SECRET` (mínimo **32 caracteres**, JWT y refresh **distintos**). Ver `src/api/utils/validate-env.ts`.

### 4.1 Secrets (CLI)

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put REFRESH_TOKEN_SECRET
npx wrangler secret put CSRF_SECRET
```

Generación recomendada: `openssl rand -base64 32` (tres valores distintos).

### 4.2 Variables públicas (`[vars]` en `wrangler.toml` o UI del Worker)

| Variable | Ejemplo | Uso |
|----------|---------|-----|
| `NODE_ENV` | `production` | Comportamiento de cookies, HSTS, etc. |
| `VITE_BASE_URL` | `https://app.tudominio.com` | Enlaces (emails, reset password, etc.) |
| `ALLOWED_ORIGINS` | `https://app.tudominio.com,https://www.tudominio.com` | CORS con credenciales |
| `OFFICIAL_APP_DOMAIN` | `https://app.tudominio.com` | Anti-phishing en login y **URL de monitorización** en *Estado del sistema* (super admin) |

Listado ampliado: `ENV_VARIABLES.md`. Tablas y orden: `PRODUCCION_CONFIG.md`.

### 4.3 Opcionales frecuentes

- Email (Resend / SendGrid / SES): claves y remitente; DNS **SPF, DKIM, DMARC**.
- CAPTCHA (registro público): `CAPTCHA_PROVIDER`, `CAPTCHA_SITE_KEY`, `CAPTCHA_SECRET_KEY` (secret).
- `SUPPORT_EMAIL` / `ADMIN_EMAIL`: textos de contacto y `GET /api/public/config`.
- `GOOGLE_SAFE_BROWSING_API_KEY`: reputación de URLs en mensajes (opcional).

---

## 5. Dominio, HTTPS y CORS

1. Asignar **Custom Domain** o ruta al Worker; DNS en Cloudflare apuntando correctamente.
2. Comprobar que la app carga en **`https://`** (certificados gestionados por Cloudflare).
3. `ALLOWED_ORIGINS` debe incluir **exactamente** los orígenes desde los que se sirve el front (sin barra final inconsistente).
4. Tras el despliegue, validar en login el aviso de **dominio oficial** (`OFFICIAL_APP_DOMAIN`).

---

## 6. Build y comando de despliegue

El pipeline habitual es:

```bash
npm run typecheck
npm run lint
npm run build
npm run deploy
```

- `npm run build` genera el cliente y el bundle del Worker (Vite + plugin Cloudflare).
- `npm run deploy` ejecuta `wrangler deploy` (sube Worker + assets según `wrangler.toml`).

Dry-run opcional: `npm run check` (incluye `wrangler deploy --dry-run`).

---

## 7. Tras el despliegue (verificación)

- Login / logout, cambio de contraseña si aplica.
- Dashboard y una operación CRUD representativa (según rol).
- Cabeceras de seguridad y CORS sin errores en consola del navegador.
- **Salud del servicio**: `GET https://<tu-dominio>/api/health` → JSON `{ "status": "ok", "timestamp": "..." }`. Endpoint **público** (sin auth), pensado para monitores de disponibilidad; no consulta D1.
- **Super admin** → menú **Estado del sistema** (`/system`): diagnóstico Worker + latencia D1, URLs de monitorización y guía de incidencias.

---

## 8. Operación, logs y correlación (`requestId`)

- Cada petición a la API recibe cabecera **`X-Request-Id`** en respuestas JSON.
- Las respuestas con **código HTTP ≥ 400** incluyen además **`requestId`** en el cuerpo JSON (salvo que el handler ya lo fijara).
- En **Cloudflare → Workers → Logs**, busca el mismo UUID para enlazar error de UI con el Worker.
- Los errores no capturados generan log `[api] <requestId>` en consola del Worker (`app.onError`).

El cliente web expone `requestId` en `ApiResponse` cuando la petición falla (`src/web/lib/api-client.ts`). CORS expone `X-Request-Id` al navegador.

---

## 9. Nuevas rutas API y lista blanca

El middleware `block-sensitive-paths` solo permite prefijos conocidos bajo `/api`. Si añades rutas nuevas (`/api/mi-modulo/...`), debes registrar el **primer segmento** en `src/api/middleware/block-sensitive-paths.ts` (`ALLOWED_API_FIRST_SEGMENTS`).

---

## 10. R2

Si usas el bucket enlazado en `wrangler.toml`, créalo en el dashboard y mantén el nombre coherente con el binding. No sustituye a D1 para datos relacionales.

---

## 11. Errores habituales

| Síntoma | Causa probable |
|---------|----------------|
| Worker no arranca | Faltan o son cortos `JWT_SECRET` / `REFRESH_TOKEN_SECRET` / `CSRF_SECRET` |
| CORS / credenciales | Origen del front no está en `ALLOWED_ORIGINS` |
| Login raro en producción | `OFFICIAL_APP_DOMAIN` o `VITE_BASE_URL` no coinciden con la URL real |
| 404 en ruta API nueva | Segmento no añadido en `block-sensitive-paths` |
| Migraciones | Ejecutar `npm run db:migrate:remote` tras cambios en `src/api/migrations` |

---

## 12. Documentos relacionados

| Archivo | Contenido |
|---------|-----------|
| `CHECKLIST_DEPLOY_PRODUCCION.md` | Lista de casillas pre-deploy |
| `PRODUCCION_CONFIG.md` | Variables, seguridad, orden de pasos |
| `ENV_VARIABLES.md` | Referencia exhaustiva de entorno |
| `PHISHING_PROTECTION.md` | Dominio oficial y `public/config` |
| `README.md` | Desarrollo local y scripts npm |

---

## 13. Resumen de orden recomendado (primer producción)

1. Crear D1 remota y actualizar `wrangler.toml`.
2. Definir Secrets (JWT, refresh, CSRF) y `[vars]` (`NODE_ENV`, URLs, orígenes, dominio oficial).
3. `npm run db:migrate:remote`.
4. Crear super admin (script + SQL remoto).
5. Dominio y HTTPS en Cloudflare.
6. `npm run build` y `npm run deploy`.
7. Smoke tests + `/api/health` + revisión de logs.
