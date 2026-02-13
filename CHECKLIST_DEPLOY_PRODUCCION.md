# Checklist de Deploy a Producción (PodoAdmin)

Este documento resume, en formato de checklist accionable, lo que hay que revisar/ejecutar antes de desplegar PodoAdmin en producción.

Para detalles extensos, ver también `PRODUCCION_CONFIG.md` y `ENV_VARIABLES.md`.
z
---

## 1. Base de datos D1 (Cloudflare)

- [ ] **Crear base de datos D1 remota**
  - **Acción**: Crear la BD D1 en el dashboard de Cloudflare (no solo la local).
  - **Verificar**: Nombre y `database_id` correctos.

- [ ] **Configurar `wrangler.toml` con la D1 de producción**
  - **Acción**: En la sección `[[d1_databases]]`, usar:
    - `binding = "DB"`
    - `database_name` y `database_id` de la BD remota de producción.

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
  - **Verificar**: Que puedes iniciar sesión como `super_admin` en producción.

- [ ] **No ejecutar seeds de mock en producción**
  - **Regla**: No usar `seed-mock-users` ni datos de prueba en la BD remota.

---

## 2. Variables y secrets en Cloudflare Workers

- [ ] **Variables obligatorias de seguridad**
  - Definir como **Secrets** en Cloudflare:
    - [ ] `JWT_SECRET` (≥ 32 chars, aleatorio)
    - [ ] `REFRESH_TOKEN_SECRET` (distinto de `JWT_SECRET`)
    - [ ] `CSRF_SECRET` (≥ 32 chars)

- [ ] **Variables obligatorias de la app**
  - Definir en `[vars]` de `wrangler.toml` o como Secrets:
    - [ ] `NODE_ENV = "production"`
    - [ ] `VITE_BASE_URL = "https://tu-dominio.com"` (URL pública real de la app)
    - [ ] `ALLOWED_ORIGINS = "https://tu-dominio.com,https://www.tu-dominio.com"`
    - [ ] `OFFICIAL_APP_DOMAIN = "https://tu-dominio.com"` (para aviso anti‑phishing)

- [ ] **Revisar que NO se usen valores por defecto de desarrollo**
  - **Regla**: Jamás dejar valores por defecto de dev para `JWT_SECRET`, `REFRESH_TOKEN_SECRET` ni `CSRF_SECRET`.

---

## 3. Email transaccional (si se usa)

- [ ] **Elegir proveedor**
  - Opciones típicas:
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

- [ ] **Configurar DNS del dominio de envío**
  - [ ] Registro **SPF**
  - [ ] Registros **DKIM**
  - [ ] Registro **DMARC**

---

## 4. CAPTCHA (recomendado si hay registro público)

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

## 5. OAuth (si se va a usar)

- [ ] **Google OAuth**
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`
  - [ ] Callbacks configurados apuntando a `VITE_BASE_URL` de producción.

- [ ] **Apple OAuth**
  - [ ] `APPLE_CLIENT_ID`
  - [ ] `APPLE_TEAM_ID`
  - [ ] `APPLE_KEY_ID`
  - [ ] `APPLE_PRIVATE_KEY`

---

## 6. Dominio, HTTPS y seguridad en tiempo de ejecución

- [ ] **Configurar dominio en Cloudflare Workers**
  - [ ] Asignar **Custom Domain** o **Route** que apunte al Worker.
  - [ ] DNS del dominio correctamente apuntando a Cloudflare.

- [ ] **HTTPS habilitado**
  - [ ] Certificados gestionados por Cloudflare.
  - [ ] Verificar que la app responde correctamente por `https://...`.

- [ ] **CORS**
  - [ ] Solo orígenes incluidos en `ALLOWED_ORIGINS`.

- [ ] **Aviso anti‑phishing**
  - [ ] `OFFICIAL_APP_DOMAIN` coincide con la URL pública real.
  - [ ] En la pantalla de login se muestra el dominio oficial.
  - [ ] Probar que en un dominio no autorizado el login se bloquea o avisa claramente.

- [ ] **Rate limiting / Seguridad adicional**
  - [ ] Probar múltiples intentos de login para ver bloqueo/rate limit.
  - [ ] (Opcional) `GOOGLE_SAFE_BROWSING_API_KEY` para comprobación de URLs en mensajes.

---

## 7. Orden recomendado antes del primer deploy

- [ ] 1. Crear D1 remota y ajustar `wrangler.toml` con su `database_id` / `database_name`.
- [ ] 2. Definir `[vars]` y Secrets (JWT, REFRESH, CSRF, NODE_ENV, VITE_BASE_URL, ALLOWED_ORIGINS, OFFICIAL_APP_DOMAIN).
- [ ] 3. Ejecutar `bun db:migrate:remote`.
- [ ] 4. Crear `super_admin` con `create-super-admin.cjs` + `wrangler d1 execute ... --remote`.
- [ ] 5. Configurar dominio y HTTPS en Cloudflare.
- [ ] 6. Configurar email, CAPTCHA y OAuth según necesidad.
- [ ] 7. Hacer smoke-test en producción:
  - [ ] Login correcto y logout.
  - [ ] Pantalla de dashboard carga sin errores.
  - [ ] Crear/editar paciente y cita.
  - [ ] Revisar que los logs de errores en Cloudflare estén limpios.

