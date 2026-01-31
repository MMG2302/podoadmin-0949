# Variables de Entorno Requeridas

Este documento lista todas las variables de entorno necesarias para el proyecto.

## Variables de Seguridad (REQUERIDAS)

### JWT Secrets

```env
# Clave secreta para firmar access tokens JWT
# Mínimo 32 caracteres, debe ser única y aleatoria
JWT_SECRET=your-super-secret-key-for-access-tokens-minimum-32-characters-long-change-in-production

# Clave secreta para firmar refresh tokens JWT
# Mínimo 32 caracteres, debe ser DIFERENTE de JWT_SECRET
REFRESH_TOKEN_SECRET=your-refresh-token-secret-key-minimum-32-characters-long-change-in-production
```

**IMPORTANTE**: 
- Generar claves únicas y aleatorias en producción
- NUNCA usar la misma clave para access y refresh tokens
- Usar un generador de claves seguras (ej: `openssl rand -base64 32`)

### CSRF Secret

```env
# Clave secreta para tokens CSRF
# Mínimo 32 caracteres
CSRF_SECRET=your-csrf-secret-key-minimum-32-characters-long-change-in-production
```

## Variables de Configuración

### Environment

```env
# Entorno de ejecución
NODE_ENV=development  # o 'production'
```

### Base URL

```env
# URL base de la aplicación (para producción)
VITE_BASE_URL=http://localhost:5173  # Desarrollo
# VITE_BASE_URL=https://tu-dominio.com  # Producción
```

## Variables Opcionales

### IP Whitelist

```env
# Lista de IPs confiables (separadas por comas)
# Estas IPs no estarán sujetas a rate limiting
# Soporta IPs individuales y rangos CIDR básicos
IP_WHITELIST=192.168.1.1,10.0.0.0/8,172.16.0.0/12
```

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

**Nota**: Para el registro público, se requiere al menos UN servicio de email configurado para enviar emails de verificación.

### CAPTCHA (Requerido para Registro Público)

El sistema soporta tres proveedores de CAPTCHA. **Se requiere al menos uno configurado para el registro público**.

#### Cloudflare Turnstile (Recomendado)

```env
CAPTCHA_PROVIDER=turnstile
CAPTCHA_SITE_KEY=tu-site-key-aqui
CAPTCHA_SECRET_KEY=tu-secret-key-aqui
```

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

**Nota**: Si no configuras CAPTCHA, el registro público no funcionará correctamente.

### OAuth (Google y Apple) - Opcional

El sistema soporta autenticación OAuth con Google y Apple. **Ambos son opcionales** y se pueden configurar independientemente.

#### Google OAuth

```env
# Client ID de Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com

# Client Secret de Google OAuth
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

**Cómo obtener las credenciales:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de "Google+ API"
4. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth 2.0"
5. Configura:
   - Tipo de aplicación: Aplicación web
   - URI de redirección autorizada: `https://tu-dominio.com/api/auth/oauth/google/callback` (producción) o `http://localhost:5173/api/auth/oauth/google/callback` (desarrollo)

#### Apple OAuth

```env
# Services ID de Apple (Client ID)
APPLE_CLIENT_ID=com.tu-dominio.podoadmin

# Team ID de Apple (encontrado en Apple Developer)
APPLE_TEAM_ID=ABC123DEF4

# Key ID de la clave privada (encontrado en Apple Developer)
APPLE_KEY_ID=XYZ789ABC1

# Clave privada en formato PEM (completa, con headers)
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----
```

**Cómo obtener las credenciales:**
1. Ve a [Apple Developer](https://developer.apple.com/)
2. Crea un Services ID en "Certificates, Identifiers & Profiles"
3. Configura el Services ID con:
   - Return URLs: `https://tu-dominio.com/api/auth/oauth/apple/callback`
   - Domains: `tu-dominio.com`
4. Crea una Key en "Keys" con "Sign in with Apple" habilitado
5. Descarga la clave privada (.p8) y conviértela a PEM:
   ```bash
   # Si tienes la clave en formato .p8
   openssl pkcs8 -topk8 -outform PEM -in AuthKey_XYZ789ABC1.p8 -out AuthKey_XYZ789ABC1.pem -nocrypt
   ```
6. Copia el contenido completo del archivo PEM (incluyendo headers) a `APPLE_PRIVATE_KEY`

**Nota**: Para Apple, la clave privada debe estar en formato PEM completo con los headers `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`. Puedes usar saltos de línea `\n` en la variable de entorno o mantener el formato multilínea.

### Reputación de URLs (Anti-phishing en mensajes) - Opcional

Si se define, los mensajes del super_admin (asunto y cuerpo) se comprueban contra Google Safe Browsing. Cualquier URL marcada como phishing o malware bloquea el envío con un mensaje claro.

```env
# API Key de Google Safe Browsing v4 (threatMatches:find)
# Obtener en: https://console.cloud.google.com/apis/credentials
# Sin esta variable, no se aplica la capa de reputación (solo ofuscación y otras reglas)
GOOGLE_SAFE_BROWSING_API_KEY=tu-api-key
```

**Nota**: La API Safe Browsing v4 es para uso no comercial. Para uso comercial, considera [Web Risk API](https://cloud.google.com/web-risk).

### Modo ligero – imágenes de sesión (Opcional)

Si quieres **reducir el tamaño del respaldo** y de la base de datos, puedes bajar los límites de imágenes por sesión. Ver `docs/ALIGERAR_SISTEMA.md`.

```env
# Máximo de imágenes por sesión clínica (1–10). Por defecto: 10
SESSION_IMAGE_MAX_COUNT=5

# Máximo tamaño por imagen en bytes (100 KB – 2 MB). Por defecto: 2097152 (2 MB)
# Ejemplo 500 KB: 524288
SESSION_IMAGE_MAX_BYTES=524288
```

Sin estas variables se usan los valores por defecto (10 imágenes, 2 MB cada una). Si las defines, el sistema acepta **como máximo** esos valores (no se puede subir el límite por encima del default por seguridad).

### Restricción de Dominios de Email (Opcional)

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

## Configuración en Producción

1. Crear archivo `.env` en la raíz del proyecto
2. Copiar las variables de este documento
3. Generar claves secretas únicas para cada variable
4. Configurar variables de entorno en la plataforma de despliegue (Cloudflare Workers)
5. **NUNCA** commitear el archivo `.env` al repositorio

## Cloudflare Workers

En Cloudflare Workers, las variables de entorno se configuran en `wrangler.toml`:

```toml
[vars]
JWT_SECRET = "tu-clave-secreta"
REFRESH_TOKEN_SECRET = "tu-clave-secreta-diferente"
CSRF_SECRET = "tu-clave-csrf"
NODE_ENV = "production"
```

O usando secrets (más seguro):

```bash
wrangler secret put JWT_SECRET
wrangler secret put REFRESH_TOKEN_SECRET
wrangler secret put CSRF_SECRET
```
