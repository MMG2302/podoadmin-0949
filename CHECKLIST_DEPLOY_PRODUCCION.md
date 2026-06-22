# Checklist de Deploy a ProducciÃ³n (PodoAdmin)

Este documento resume, en formato de checklist accionable, lo que hay que revisar/ejecutar antes de desplegar PodoAdmin en producciÃ³n.

**Contexto vibecoding:** revisar cada Ã­tem en dashboard y en cÃ³digo; no asumir que â€œestÃ¡ en el repoâ€ implica que estÃ¡ activo en producciÃ³n.

Para detalles extensos, ver tambiÃ©n `PRODUCCION_CONFIG.md`, `ENV_VARIABLES.md` y `docs/ESTIMACION-COSTOS-Y-UTILIDAD-BRUTA.md`.

**Lista principal (marcar progreso):** **`LISTA_DESPLIEGUE.md`**  
**Roadmap tÃ©cnico / deuda:** **`docs/ROADMAP_TECNICO_AI.md`**  
**Â¿No sabes programar?** `docs/DEPLOY_PASO_A_PASO.md` + `scripts/deploy-asistente.ps1`

---

## 0. LÃ­mites de gasto en APIs y servicios externos (empezar aquÃ­)

Cada llamada externa puede generar costo o agotar cuota. Hay que configurar **lÃ­mites en el proveedor** (obligatorio) y **lÃ­mites en la app** (ya parcialmente implementados).

### 0.1 Inventario de APIs que pueden cobrar

| Servicio | Variable / trigger | QuÃ© dispara costo | LÃ­mite en cÃ³digo | LÃ­mite en dashboard |
|----------|-------------------|-------------------|------------------|---------------------|
| **Email** (Resend / SendGrid / SES) | `RESEND_API_KEY`, `SENDGRID_*`, `AWS_*` | Login fallido (3, 5, 10+ intentos), reset password | Reset: 5/hora por IP (`auth.ts`) | [ ] Tope mensual y alertas |
| **Google Safe Browsing** | `GOOGLE_SAFE_BROWSING_API_KEY` | Cada mensaje `super_admin` con URLs (`messages.ts`) | 20 mensajes/min por usuario; mÃ¡x. 500 URLs/request (`url-reputation.ts`) | [ ] Cuota Google Cloud + alertas |
| **CAPTCHA** (Turnstile / reCAPTCHA / hCaptcha) | `CAPTCHA_*` | VerificaciÃ³n en login tras 3 fallos; registro pÃºblico si se activa | Solo tras intentos fallidos en login | [ ] LÃ­mite de verificaciones en consola del proveedor |
| **Cloudflare Workers + D1 + R2** | Infra (sin API key de terceros) | TrÃ¡fico, escrituras D1, almacenamiento R2 | Rate limits de auth/acciones (D1) | [ ] Billing alerts + presupuesto en cuenta CF |
| **AI Gateway** (`AI_GATEWAY_*`, `AUTUMN_*`) | Plantilla en `worker-configuration.d.ts` | **No usado** en rutas actuales | N/A | [ ] No crear keys si no hay feature IA |

### 0.2 Alertas y topes en dashboards (obligatorio antes de producciÃ³n)

- [ ] **Cloudflare** â†’ Billing â†’ alertas de gasto (email) y revisar plan Workers Paid (~$5 USD/mes mÃ­nimo).
- [ ] **Proveedor de email** elegido:
  - [ ] Tope mensual (ej. Resend: plan + lÃ­mite diario).
  - [ ] Alerta al 80 % de cuota.
  - [ ] Dominio de envÃ­o verificado (SPF/DKIM/DMARC) para no quemar reputaciÃ³n ni reintentos.
- [ ] **Google Cloud** (solo si activas Safe Browsing):
  - [ ] API habilitada con restricciÃ³n por IP/Worker si es posible.
  - [ ] Cuota diaria y alerta de uso.
  - [ ] Confirmar uso no comercial (v4) o migrar a Web Risk si es comercial.
- [ ] **CAPTCHA** (si `CAPTCHA_SECRET_KEY` en producciÃ³n):
  - [ ] Site key de **producciÃ³n** (no la de test).
  - [ ] Revisar lÃ­mites del plan (Turnstile suele ser generoso; reCAPTCHA/hCaptcha pueden facturar).

### 0.3 Verificar lÃ­mites ya implementados en la app

| AcciÃ³n | LÃ­mite actual | Archivo |
|--------|---------------|---------|
| Login fallido | Progresivo 3â†’5s, 5â†’30s, 10â†’bloqueo 15 min (D1) | `rate-limit-d1.ts`, `auth.ts` |
| Mensajes super_admin | 20/min por `userId` | `action-rate-limit.ts`, `messages.ts` |
| Subida de logos | 10/min por `userId` | `clinics.ts`, `professionals.ts` |
| CreaciÃ³n de sesiones clÃ­nicas | 30/min por `userId` | `sessions.ts` |
| Olvido de contraseÃ±a | 5/hora por IP | `auth.ts` |
| Safe Browsing (si hay key) | Timeout 5 s; fallo de API **no bloquea** envÃ­o | `url-reputation.ts` |

- [ ] Probar en staging: superar lÃ­mite de mensajes â†’ respuesta `429` con `Retry-After`.
- [ ] Probar login con 10+ fallos â†’ bloqueo y sin spam de emails (ver Â§ 0.4).
- [ ] Confirmar que **no** hay `IP_WHITELIST` amplia en producciÃ³n (bypass de rate limit).

### 0.4 Riesgos en cÃ³digo â€” estado de reparaciÃ³n

| Riesgo | Estado |
|--------|--------|
| Mock de email en producciÃ³n | **Corregido:** sin `RESEND_*`/`SENDGRID_*` no se usa Mock; `sendEmail` devuelve `false` y log de error |
| Spam de emails tras intento 10+ en login | **Corregido:** solo notifica en intentos 3, 5 y 10 |
| Safe Browsing falla y deja pasar URLs | **Corregido:** en producciÃ³n, error de API â†’ mensaje bloqueado (503) |
| Rate limit de acciones si falla D1 | **Corregido:** fail-closed en producciÃ³n |
| Registro pÃºblico sin rate limit en ruta | **Corregido:** `POST /api/auth/register` con rate limit, CAPTCHA y verificaciÃ³n por email |
| Variables IA de plantilla | **Operativo:** no configurar hasta usar la feature |
| Aviso al arrancar sin email en prod | **Corregido:** `validate-production-safety.ts` |
| Aprobar reset sin email en prod | **Corregido:** respuesta 503 con `resetUrl` para envÃ­o manual |

### 0.5 Checklist rÃ¡pido â€œÂ¿puedo encender esto en prod?â€

- [ ] Email: proveedor + secrets + tope en dashboard.
- [ ] Safe Browsing: solo si necesitas la capa; si no, **no** definir `GOOGLE_SAFE_BROWSING_API_KEY`.
- [ ] CAPTCHA: solo si hay registro/login expuesto con CAPTCHA; keys de prod.
- [ ] Cloudflare: billing alerts + `wrangler.toml` con D1/R2 de **producciÃ³n** (no sandbox).
- [ ] Documentar en `docs/ESTIMACION-COSTOS-Y-UTILIDAD-BRUTA.md` Â§ 1.2 los costos reales del proveedor de email.

---

## 1. Base de datos D1 (Cloudflare)

- [ ] **Crear base de datos D1 remota**
  - **AcciÃ³n**: Crear la BD D1 en el dashboard de Cloudflare (no solo la local).
  - **Verificar**: Nombre y `database_id` correctos.

- [ ] **Configurar `wrangler.toml` con la D1 de producciÃ³n**
  - **AcciÃ³n**: En la secciÃ³n `[[d1_databases]]`, usar:
    - `binding = "DB"`
    - `database_name` y `database_id` de la BD remota de producciÃ³n.

- [ ] **Ejecutar migraciones remotas**
  - **Comando**:
    ```bash
    bun db:migrate:remote
    ```

- [ ] **(Solo primera vez) Crear `super_admin`**
  - **Comandos recomendados** (ejemplo):
    ```bash
    node scripts/create-super-admin.cjs "<EMAIL_SUPER_ADMIN>" "<PASSWORD_SUPER_ADMIN>" "<NOMBRE_SUPER_ADMIN>"
    bunx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
    ```
  - **Verificar**: Que puedes iniciar sesiÃ³n como `super_admin` en producciÃ³n.

- [ ] **No ejecutar seeds de mock en producciÃ³n**
  - **Regla**: No usar `seed-mock-users` ni datos de prueba en la BD remota.

- [ ] **Backup D1 confirmado (3 capas)**
  - **Capa 1 — Time Travel (automático Cloudflare):** Con Workers Paid, D1 guarda historial 30 días. Verificar con `npx wrangler d1 info DB --remote` (`version: production`).
  - **Capa 2 — Export diario a R2 (cron Worker):**
    - [ ] `[vars]` en `wrangler.toml`: `D1_BACKUP_ENABLED = "1"`, `D1_DATABASE_ID` = mismo `database_id` de D1, `CLOUDFLARE_ACCOUNT_ID` = ID de cuenta CF, `D1_BACKUP_RETENTION_DAYS = "30"`
    - [ ] Secret: `npx wrangler secret put D1_BACKUP_API_TOKEN` (token API con permiso **Account → D1 → Edit**)
    - [ ] R2 bucket configurado (`BUCKET` binding)
    - [ ] Cron `0 4 * * *` desplegado (ver `wrangler.json` → `triggers.crons`)
    - [ ] Tras deploy, revisar logs: evento `cron_d1_backup_done` o error al día siguiente
    - [ ] Verificar objeto en R2: prefijo `backups/d1/{database_id}/`
  - **Capa 3 — Backup manual (pre-migración / auditoría):**
    ```bash
    npm run db:backup:remote
    ```
    Guarda SQL en `backups/d1/` (local, ignorado por git).

---

## 2. Variables y secrets en Cloudflare Workers

- [ ] **Variables obligatorias de seguridad**
  - Definir como **Secrets** en Cloudflare:
    - [ ] `JWT_SECRET` (â‰¥ 32 chars, aleatorio)
    - [ ] `REFRESH_TOKEN_SECRET` (distinto de `JWT_SECRET`)
    - [ ] `CSRF_SECRET` (â‰¥ 32 chars)

- [ ] **Variables obligatorias de la app**
  - Definir en `[vars]` de `wrangler.toml` o como Secrets:
    - [ ] `NODE_ENV = "production"`
    - [ ] `APP_BASE_URL = "https://tu-dominio.com"` (URL pÃºblica real de la app)
    - [ ] `ALLOWED_ORIGINS = "https://tu-dominio.com,https://www.tu-dominio.com"`
    - [ ] `OFFICIAL_APP_DOMAIN = "https://tu-dominio.com"` (para aviso antiâ€‘phishing)

- [ ] **Revisar que NO se usen valores por defecto de desarrollo**
  - **Regla**: JamÃ¡s dejar valores por defecto de dev para `JWT_SECRET`, `REFRESH_TOKEN_SECRET` ni `CSRF_SECRET`.

---

## 3. Email transaccional (si se usa)

- [ ] **Elegir proveedor**
  - Opciones tÃ­picas:
    - Resend
    - SendGrid
    - AWS SES

- [ ] **Configurar variables del proveedor elegido**
  - Ejemplos:
    - Resend:
      - [ ] `RESEND_API_KEY`
      - [ ] `RESEND_FROM_EMAIL`
    - SendGrid:
      - [ ] `SENDGRID_API_KEY`
      - [ ] `SENDGRID_FROM_EMAIL`
    - AWS SES:
      - [ ] `AWS_ACCESS_KEY_ID`
      - [ ] `AWS_SECRET_ACCESS_KEY`
      - [ ] `AWS_REGION`
      - [ ] `AWS_SES_FROM_EMAIL`

- [ ] **Configurar DNS del dominio de envÃ­o**
  - [ ] Registro **SPF**
  - [ ] Registros **DKIM**
  - [ ] Registro **DMARC**

---

## 4. CAPTCHA (recomendado si hay registro pÃºblico)

- [ ] **Elegir proveedor de CAPTCHA**
  - Opciones:
    - `turnstile` (Cloudflare)
    - `recaptcha`
    - `hcaptcha`

- [ ] **Configurar variables**
  - [ ] `CAPTCHA_PROVIDER`
  - [ ] `CAPTCHA_SITE_KEY` (frontend)
  - [ ] `CAPTCHA_SECRET_KEY` (Secret en backend)

---

## 5. OAuth / pasarelas de pago

**No aplica en la versiÃ³n actual**: login con email/contraseÃ±a (y 2FA); sin Google OAuth ni Stripe u otras pasarelas. Si mÃ¡s adelante se implementan, aÃ±adir aquÃ­ la checklist correspondiente.

---

## 6. Dominio, HTTPS y seguridad en tiempo de ejecuciÃ³n

- [ ] **Configurar dominio en Cloudflare Workers**
  - [ ] Asignar **Custom Domain** o **Route** que apunte al Worker.
  - [ ] DNS del dominio correctamente apuntando a Cloudflare.

- [ ] **HTTPS habilitado**
  - [ ] Certificados gestionados por Cloudflare.
  - [ ] Verificar que la app responde correctamente por `https://...`.

- [ ] **CORS**
  - [ ] Solo orÃ­genes incluidos en `ALLOWED_ORIGINS`.

- [ ] **Aviso antiâ€‘phishing**
  - [ ] `OFFICIAL_APP_DOMAIN` coincide con la URL pÃºblica real.
  - [ ] En la pantalla de login se muestra el dominio oficial.
  - [ ] Probar que en un dominio no autorizado el login se bloquea o avisa claramente.

- [ ] **Rate limiting / Seguridad adicional**
  - [ ] Probar mÃºltiples intentos de login para ver bloqueo/rate limit.
  - [ ] Completar **Â§ 0 LÃ­mites de gasto en APIs** (alertas en dashboards + pruebas 429).
  - [ ] (Opcional) `GOOGLE_SAFE_BROWSING_API_KEY` â€” ver Â§ 0.1; solo si aceptas cuota y uso en Google Cloud.

---

## 7. Orden recomendado antes del primer deploy

- [ ] 0. **LÃ­mites de gasto:** Â§ 0 (dashboards + verificar secrets de email; no dejar Mock en prod).
- [ ] 1. Crear D1 remota y ajustar `wrangler.toml` con su `database_id` / `database_name`.
- [ ] 2. Definir `[vars]` y Secrets (JWT, REFRESH, CSRF, NODE_ENV, APP_BASE_URL, ALLOWED_ORIGINS, OFFICIAL_APP_DOMAIN).
- [ ] 3. Ejecutar `bun db:migrate:remote`.
- [ ] 4. Crear `super_admin` con `create-super-admin.cjs` + `wrangler d1 execute ... --remote`.
- [ ] 5. Configurar dominio y HTTPS en Cloudflare.
- [ ] 6. Configurar email, CAPTCHA y OAuth segÃºn necesidad.
- [ ] 7. Hacer smoke-test en producciÃ³n:
  - [ ] Login correcto y logout.
  - [ ] Pantalla de dashboard carga sin errores.
  - [ ] Crear/editar paciente y cita.
  - [ ] Revisar que los logs de errores en Cloudflare estÃ©n limpios.

