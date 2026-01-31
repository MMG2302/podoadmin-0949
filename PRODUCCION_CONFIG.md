# Configuración en producción

Guía de variables, secretos y pasos para desplegar PodoAdmin en producción (Cloudflare Workers + D1).

Para detalle de cada variable, ver **ENV_VARIABLES.md**.

---

## 1. Variables de entorno en Cloudflare Workers

En Workers las variables se definen en **`wrangler.toml`** (`[vars]`) o como **Secrets** (más seguro para claves).

### Opción A: `wrangler.toml` (solo valores no sensibles)

```toml
[vars]
NODE_ENV = "production"
VITE_BASE_URL = "https://tu-dominio.com"
ALLOWED_ORIGINS = "https://tu-dominio.com,https://www.tu-dominio.com"
OFFICIAL_APP_DOMAIN = "https://tu-dominio.com"
```

### Opción B: Secrets (obligatorio para claves)

```bash
wrangler secret put JWT_SECRET
wrangler secret put REFRESH_TOKEN_SECRET
wrangler secret put CSRF_SECRET
# Si usas email, OAuth, CAPTCHA o reputación de URLs:
wrangler secret put RESEND_API_KEY
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put APPLE_PRIVATE_KEY
wrangler secret put CAPTCHA_SECRET_KEY
wrangler secret put GOOGLE_SAFE_BROWSING_API_KEY   # opcional: anti-phishing en mensajes
```

**Importante:** En Workers, las variables que el código lee con `process.env.*` deben estar definidas como `[vars]` o como Secrets; ambas quedan disponibles en el objeto `env` del Worker. Si usas solo Secrets, no pongas valores por defecto sensibles en código.

---

## 2. Checklist de variables en producción

### Obligatorias (seguridad)

| Variable | Descripción | Cómo generar |
|----------|-------------|--------------|
| `JWT_SECRET` | Firma de access tokens (≥32 caracteres) | `openssl rand -base64 32` |
| `REFRESH_TOKEN_SECRET` | Firma de refresh tokens (diferente de JWT_SECRET) | `openssl rand -base64 32` |
| `CSRF_SECRET` | Tokens CSRF (≥32 caracteres) | `openssl rand -base64 32` |

### Obligatorias (app)

| Variable | Ejemplo producción |
|----------|---------------------|
| `NODE_ENV` | `production` |
| `VITE_BASE_URL` | `https://app.podoadmin.com` |
| `ALLOWED_ORIGINS` | `https://app.podoadmin.com,https://www.podoadmin.com` |
| `OFFICIAL_APP_DOMAIN` | `https://app.podoadmin.com` (aviso anti-phishing en login) |

### Opcionales (seguridad / operación)

| Variable | Uso |
|----------|-----|
| `IP_WHITELIST` | IPs sin rate limiting (ej. oficina), separadas por coma |
| `ALLOWED_EMAIL_DOMAINS` | Dominios permitidos en registro (coma); si no se pone, se aplican reglas por defecto |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Reputación de URLs en mensajes (anti-phishing); si no se pone, solo se aplican reglas de ofuscación |

### Email (al menos uno si hay registro/verificación)

| Variable | Proveedor |
|----------|-----------|
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Resend |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` | SendGrid |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_SES_FROM_EMAIL` | AWS SES |

**SPF, DKIM y DMARC:** Configura estos registros DNS en el dominio desde el que envías correo (ej. `noreply@tudominio.com`), para reducir que tus emails se marquen como spam o suplantación:
- **SPF**: Registro TXT que autoriza los servidores que pueden enviar por tu dominio.
- **DKIM**: Firma criptográfica de los mensajes; el proveedor (Resend, SendGrid, SES) suele dar las claves y el registro TXT.
- **DMARC**: Política de rechazo/cuarentena para correos que no pasen SPF/DKIM; reduce el phishing que suplanta tu dominio.

Consulta la documentación de tu proveedor de email para los valores exactos de los registros.

### CAPTCHA (recomendado para registro público)

| Variable | Descripción |
|----------|-------------|
| `CAPTCHA_PROVIDER` | `turnstile` \| `recaptcha` \| `hcaptcha` |
| `CAPTCHA_SITE_KEY` | Clave pública (frontend) |
| `CAPTCHA_SECRET_KEY` | Clave privada (backend, usar Secret) |

### OAuth (opcional)

| Variable | Proveedor |
|----------|-----------|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Apple |

`BASE_URL` o `VITE_BASE_URL` se usan para callbacks OAuth; en producción deben apuntar a la URL pública de la app.

---

## 3. Base de datos (D1)

1. **Migraciones remotas** (antes del primer deploy o tras cambios de schema):
   ```bash
   bun db:migrate:remote
   ```
2. **Primer super_admin** (si no existe ninguno):
   ```bash
   node scripts/create-super-admin.cjs "admin@tudominio.com" "ContraseñaSegura" "Nombre Admin"
   bunx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
   ```
   No uses el seed de usuarios mock en producción; solo `create-super-admin` o usuarios creados por la app.

---

## 4. Wrangler / Cloudflare

- **`wrangler.toml`**: Revisar `name`, `compatibility_date`, `d1_databases` (binding `DB`, `database_id` y `database_name` de producción).
- **D1**: Crear la base remota en el dashboard si no existe; el `database_id` debe coincidir con el del `wrangler.toml`.
- **Dominio**: Asignar dominio personalizado al Worker en Cloudflare (DNS + Workers Routes o Custom Domain).
- **HTTPS**: Dejar que Cloudflare gestione SSL; el código usa HSTS en producción cuando detecta HTTPS (`x-forwarded-proto` o entorno).

---

## 5. Seguridad en producción (resumen)

| Medida | Comportamiento |
|--------|----------------|
| **Cookies** | `Secure` cuando se detecta producción/HTTPS; `HttpOnly`, `SameSite=Lax`. |
| **HSTS** | Header `Strict-Transport-Security` en producción con HTTPS. |
| **CORS** | Solo orígenes en `ALLOWED_ORIGINS`. |
| **CSRF** | Token en mutaciones; login/refresh excluidos. |
| **Anti-phishing** | Aviso en login con `OFFICIAL_APP_DOMAIN`; verificación de origen (no introducir credenciales si la URL no coincide); mensajes rechazan URLs ofuscadas y, opcionalmente, URLs en listas de Safe Browsing (`GOOGLE_SAFE_BROWSING_API_KEY`). |
| **Rate limiting** | Intentos de login; CAPTCHA tras N fallos; bloqueo temporal. |
| **2FA** | TOTP + códigos de respaldo; recomendable para admins. |

Asegurar que en producción **no** se usen valores por defecto de desarrollo para `JWT_SECRET`, `REFRESH_TOKEN_SECRET` ni `CSRF_SECRET` (definir siempre vars o secrets).

---

## 6. Orden recomendado antes del primer deploy

1. Crear D1 remota y ajustar `wrangler.toml` con su `database_id`/`database_name`.
2. Definir `[vars]` y/o Secrets (JWT, REFRESH, CSRF, NODE_ENV, VITE_BASE_URL, ALLOWED_ORIGINS, OFFICIAL_APP_DOMAIN).
3. Ejecutar `bun db:migrate:remote`.
4. Crear super_admin con `create-super-admin.cjs` + `wrangler d1 execute ... --remote`.
5. Configurar dominio y HTTPS en Cloudflare.
6. (Opcional) Configurar email, CAPTCHA y OAuth según necesidad.
7. Desplegar el Worker y comprobar login, aviso de dominio oficial y flujos críticos.

---

## 7. Anti-phishing en producción

- **`OFFICIAL_APP_DOMAIN`**: Debe ser la URL pública real de la app (ej. `https://app.podoadmin.com`). El frontend la usa para mostrar “Solo inicia sesión en [este dominio]” y para comparar con `window.location.origin`; si no coincide, se muestra una alerta y se deshabilita el botón de login.
- **`GOOGLE_SAFE_BROWSING_API_KEY`** (opcional): Si está definida, los mensajes del super_admin (asunto y cuerpo) se comprueban contra Google Safe Browsing; las URLs marcadas como phishing o malware bloquean el envío con un mensaje claro. Sin esta variable solo se aplican reglas de ofuscación (hxxp, [.], etc.).

---

## 8. Referencias

- **ENV_VARIABLES.md** – Listado completo de variables y generación de claves.
- **README.md** – Comandos de DB y desarrollo.
- **PHISHING_PROTECTION.md** – Medidas anti-phishing.
- **INPUT_SECURITY.md** – Sanitización, headers y detección de URLs ofuscadas.
- **UPLOAD_ISOLATION.md** – Aislamiento de cargas (logos): validación de tipo y tamaño para que una carga corrupta no dañe el sistema.
- **ARQUITECTURA_SAAS_SEGURIDAD.md** – Revisión de seguridad interna, multi-tenant y escalabilidad (Zero Trust, secrets, rate limiting por cliente, timeouts).
- **COMPLIANCE_CONFIANZA.md** – Compliance y confianza (GDPR/LFPDPPP, retención, exportación de evidencias, auditoría de decisiones, SLA).
- **CONFIGURACION_SEGURIDAD.md** – Pruebas y flujos de seguridad (2FA, CAPTCHA, etc.).
