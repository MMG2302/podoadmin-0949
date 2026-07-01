# Variables de Entorno Requeridas

Este documento lista todas las variables de entorno necesarias para el proyecto.

## Variables de Seguridad (REQUERIDAS)

### JWT Secrets

```env
# Clave secreta para firmar access tokens JWT
# MÃ­nimo 32 caracteres, debe ser Ãºnica y aleatoria
JWT_SECRET=your-super-secret-key-for-access-tokens-minimum-32-characters-long-change-in-production

# Clave secreta para firmar refresh tokens JWT
# MÃ­nimo 32 caracteres, debe ser DIFERENTE de JWT_SECRET
REFRESH_TOKEN_SECRET=your-refresh-token-secret-key-minimum-32-characters-long-change-in-production
```

**IMPORTANTE**: 
- Generar claves Ãºnicas y aleatorias en producciÃ³n
- NUNCA usar la misma clave para access y refresh tokens
- Usar un generador de claves seguras (ej: `openssl rand -base64 32`)
- El Worker **no arranca** sin estas tres variables definidas (ver `src/api/utils/validate-env.ts`)
- **Local con Wrangler**: secretos solo en **`.dev.vars`** (copia desde `.dev.vars.example`) o `npm run setup:env` (genera `.dev.vars`). No pongas secretos en `.env`
- **ProducciÃ³n**: `wrangler secret put JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `CSRF_SECRET`

### CSRF Secret

```env
# Clave secreta para tokens CSRF
# MÃ­nimo 32 caracteres
CSRF_SECRET=your-csrf-secret-key-minimum-32-characters-long-change-in-production
```

## Variables de ConfiguraciÃ³n

### Environment

```env
# Entorno de ejecuciÃ³n
NODE_ENV=development  # o 'production'
```

### Base URL (solo Worker / host)

```env
# URL pública de la app (enlaces de email). Sin prefijo VITE_ — no va al bundle del navegador.
APP_BASE_URL=http://localhost:5173  # Desarrollo (.dev.vars o wrangler [vars])
# APP_BASE_URL=https://tu-dominio.com  # Producción
```

## Variables Opcionales

### Email de soporte (login)

```env
# Email para el enlace "Contacta al administrador para crear una cuenta" en la pantalla de login
# Si no se define, se usa soporte@podoadmin.com por defecto
SUPPORT_EMAIL=soporte@tudominio.com
```

### IP Whitelist

```env
# Lista de IPs confiables (separadas por comas)
# Omite rate limiting global, tenant y login
# Soporta IPs individuales y rangos CIDR básicos
IP_WHITELIST=192.168.1.1,10.0.0.0/8,172.16.0.0/12
```

### Rate limiting (despliegue masivo / multi-clínica)

Ajusta topes sin cambiar código (valores por minuto salvo ráfaga):

```env
RATE_LIMIT_ANON_READ_PER_MIN=180
RATE_LIMIT_ANON_WRITE_PER_MIN=90
RATE_LIMIT_AUTH_READ_PER_MIN=600
RATE_LIMIT_AUTH_WRITE_PER_MIN=300
RATE_LIMIT_BURST_PER_10S=80
RATE_LIMIT_TENANT_READ_PER_MIN=2000
RATE_LIMIT_TENANT_WRITE_PER_MIN=800
```

Ver `docs/DEPLOY_MASIVO.md` (tiers standard/scale) y `src/api/RATE_LIMITING.md`.

### Backup D1 (producción)

Time Travel de Cloudflare está **siempre activo** (30 días con Workers Paid). Para copias SQL adicionales en R2:

```env
D1_BACKUP_ENABLED=1
CLOUDFLARE_ACCOUNT_ID=tu-account-id
D1_DATABASE_ID=mismo-database_id-de-wrangler.toml
D1_BACKUP_RETENTION_DAYS=30
```

Secret (no en `[vars]`):

```bash
npx wrangler secret put D1_BACKUP_API_TOKEN
```

Token API con permiso **Account → D1 → Edit**. Cron Worker: **04:00 UTC** diario → `backups/d1/{database_id}/` en R2.

Backup manual local: `npm run db:backup:remote`

### Email Service (para notificaciones)

#### SendGrid

```env
SENDGRID_API_KEY=your-sendgrid-api-key
```

#### AWS SES

```env
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
```

#### Resend

```env
RESEND_API_KEY=your-resend-api-key
```

**Nota**: Para el registro pÃºblico, se requiere al menos UN servicio de email configurado para enviar emails de verificaciÃ³n.

### CAPTCHA (Requerido para Registro Público)

**Proveedor recomendado: Cloudflare Turnstile** (sin servidor propio; mismo panel que Workers).

```env
CAPTCHA_PROVIDER=turnstile
CAPTCHA_SITE_KEY=tu-site-key-aqui
CAPTCHA_SECRET_KEY=tu-secret-key-aqui
```

Obtener claves: [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/). En desarrollo puedes usar las [claves de prueba](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

#### Google reCAPTCHA

```env
CAPTCHA_PROVIDER=recaptcha
CAPTCHA_SITE_KEY=tu-site-key-aqui
CAPTCHA_SECRET_KEY=tu-secret-key-aqui
```

#### hCaptcha

```env
CAPTCHA_PROVIDER=hcaptcha
CAPTCHA_SITE_KEY=tu-site-key-aqui
CAPTCHA_SECRET_KEY=tu-secret-key-aqui
```

**Nota**: Si no configuras CAPTCHA, el registro pÃºblico no funcionarÃ¡ correctamente.

### OAuth (Google / Apple) â€” no activo en esta versiÃ³n

El login es **email + contraseÃ±a** (y 2FA donde aplique). La base de datos conserva columnas `google_id`, `apple_id`, `oauth_provider` por si en el futuro se aÃ±ade OAuth; **no hay rutas ni variables de entorno OAuth en uso** y no debes configurar `GOOGLE_*` ni `APPLE_*` salvo que implementes ese flujo explÃ­citamente.

**Pasarelas de pago (Stripe, etc.)**: no integradas; no hay webhooks ni secrets de cobro en este proyecto.

### ReputaciÃ³n de URLs (Anti-phishing en mensajes) - Opcional

Si se define, los mensajes del super_admin (asunto y cuerpo) se comprueban contra Google Safe Browsing. Cualquier URL marcada como phishing o malware bloquea el envÃ­o con un mensaje claro.

```env
# API Key de Google Safe Browsing v4 (threatMatches:find)
# Obtener en: https://console.cloud.google.com/apis/credentials
# Sin esta variable, no se aplica la capa de reputaciÃ³n (solo ofuscaciÃ³n y otras reglas)
GOOGLE_SAFE_BROWSING_API_KEY=tu-api-key
```

**Nota**: La API Safe Browsing v4 es para uso no comercial. Para uso comercial, considera [Web Risk API](https://cloud.google.com/web-risk).

### Observabilidad — Sentry (Opcional)

Centraliza errores del Worker y del frontend. Sin `SENTRY_DSN`, la app funciona igual (solo logs locales + Cloudflare).

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

Producción: `wrangler secret put SENTRY_DSN`. Consultar alertas D1: `npm run alerts:check` (local) o `npm run alerts:check:remote`.

### Modo ligero â€“ imÃ¡genes de sesiÃ³n (Opcional)

Si quieres **reducir el tamaÃ±o del respaldo** y de la base de datos, puedes bajar los lÃ­mites de imÃ¡genes por sesiÃ³n. Ver `docs/ALIGERAR_SISTEMA.md`.

```env
# MÃ¡ximo de imÃ¡genes por sesiÃ³n clÃ­nica (1â€“10). Por defecto: 10
SESSION_IMAGE_MAX_COUNT=5

# MÃ¡ximo tamaÃ±o por imagen en bytes (100 KB â€“ 2 MB). Por defecto: 2097152 (2 MB)
# Ejemplo 500 KB: 524288
SESSION_IMAGE_MAX_BYTES=524288
```

Sin estas variables se usan los valores por defecto (10 imÃ¡genes, 2 MB cada una). Si las defines, el sistema acepta **como mÃ¡ximo** esos valores (no se puede subir el lÃ­mite por encima del default por seguridad).

### RestricciÃ³n de Dominios de Email (Opcional)

```env
# Lista de dominios permitidos (separados por comas)
# Si no se configura, se permiten todos los dominios excepto los temporales
ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,hotmail.com,empresa.com
```

## Generar Claves Secretas

### Usando OpenSSL

```bash
# Generar JWT_SECRET
openssl rand -base64 32

# Generar REFRESH_TOKEN_SECRET (diferente)
openssl rand -base64 32

# Generar CSRF_SECRET (diferente)
openssl rand -base64 32
```

### Usando Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## ConfiguraciÃ³n en ProducciÃ³n

1. Local: `npm run setup:env` o copiar `.dev.vars.example` → `.dev.vars`
2. Producción: `wrangler secret put` para JWT, REFRESH, CSRF; `[vars]` para `APP_BASE_URL`, `ALLOWED_ORIGINS`, etc.
3. **NUNCA** commitear `.dev.vars` ni poner secretos en `.env`

## Cloudflare Workers

En Cloudflare Workers, las variables de entorno se configuran en `wrangler.toml`:

```toml
[vars]
NODE_ENV = "production"
APP_BASE_URL = "https://tu-dominio.com"
ALLOWED_ORIGINS = "https://tu-dominio.com"
```

O usando secrets (mÃ¡s seguro):

```bash
wrangler secret put JWT_SECRET
wrangler secret put REFRESH_TOKEN_SECRET
wrangler secret put CSRF_SECRET
```
