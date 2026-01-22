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
