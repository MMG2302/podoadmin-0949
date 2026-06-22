# GuÃ­a de ConfiguraciÃ³n y Pruebas de Seguridad

## âœ… Migraciones de Base de Datos

Las migraciones se han ejecutado correctamente. Las siguientes tablas han sido creadas:

- âœ… `token_blacklist` - Para invalidar tokens en logout
- âœ… `two_factor_auth` - Para almacenar secretos TOTP y cÃ³digos de respaldo
- âœ… `security_metrics` - Para mÃ©tricas de seguridad

## ðŸ” ConfiguraciÃ³n de CAPTCHA (Opcional)

### OpciÃ³n 1: Google reCAPTCHA

1. **Registrar sitio en Google reCAPTCHA:**
   - Ve a https://www.google.com/recaptcha/admin/create
   - Selecciona reCAPTCHA v2 o v3
   - Agrega tu dominio
   - Copia las claves generadas

2. **Configurar variables de entorno:**
   ```env
   CAPTCHA_PROVIDER=recaptcha
   CAPTCHA_SITE_KEY=tu-site-key-aqui
   CAPTCHA_SECRET_KEY=tu-secret-key-aqui
   ```

### OpciÃ³n 2: Cloudflare Turnstile (Recomendado)

1. **Registrar sitio en Cloudflare:**
   - Ve a https://dash.cloudflare.com/
   - Navega a Turnstile
   - Crea un nuevo sitio
   - Copia las claves generadas

2. **Configurar variables de entorno:**
   ```env
   CAPTCHA_PROVIDER=turnstile
   CAPTCHA_SITE_KEY=tu-site-key-aqui
   CAPTCHA_SECRET_KEY=tu-secret-key-aqui
   ```

### OpciÃ³n 3: hCaptcha

1. **Registrar sitio en hCaptcha:**
   - Ve a https://www.hcaptcha.com/
   - Crea una cuenta y registra tu sitio
   - Copia las claves generadas

2. **Configurar variables de entorno:**
   ```env
   CAPTCHA_PROVIDER=hcaptcha
   CAPTCHA_SITE_KEY=tu-site-key-aqui
   CAPTCHA_SECRET_KEY=tu-secret-key-aqui
   ```

### Nota
Si no configuras CAPTCHA, el sistema funcionarÃ¡ normalmente pero no se mostrarÃ¡ CAPTCHA despuÃ©s de intentos fallidos (aunque seguirÃ¡ funcionando el rate limiting).

## ðŸ”’ Pruebas de 2FA (AutenticaciÃ³n de Dos Factores)

### 1. Habilitar 2FA para un usuario

**Paso 1: Iniciar configuraciÃ³n**
```bash
# POST /api/2fa/setup
# Requiere autenticaciÃ³n
```

Respuesta:
```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/PodoAdmin:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=PodoAdmin",
  "message": "Escanea el cÃ³digo QR con tu aplicaciÃ³n de autenticaciÃ³n"
}
```

**Paso 2: Escanear QR con aplicaciÃ³n de autenticaciÃ³n**
- Google Authenticator
- Microsoft Authenticator
- Authy
- Cualquier app compatible con TOTP

**Paso 3: Verificar cÃ³digo y habilitar**
```bash
# POST /api/2fa/enable
# Body: { "secret": "...", "verificationCode": "123456" }
```

Respuesta:
```json
{
  "success": true,
  "backupCodes": ["12345678", "87654321", ...],
  "message": "2FA habilitado correctamente. Guarda los cÃ³digos de respaldo en un lugar seguro."
}
```

âš ï¸ **IMPORTANTE**: Guarda los cÃ³digos de respaldo en un lugar seguro. Solo se muestran una vez.

### 2. Probar login con 2FA

1. Intenta hacer login normalmente
2. Si el usuario tiene 2FA habilitado, recibirÃ¡s:
   ```json
   {
     "error": "CÃ³digo 2FA requerido",
     "message": "Por favor, ingresa el cÃ³digo de autenticaciÃ³n de dos factores",
     "requires2FA": true
   }
   ```
3. Ingresa el cÃ³digo de 6 dÃ­gitos de tu app de autenticaciÃ³n
4. El login deberÃ­a completarse exitosamente

### 3. Verificar estado de 2FA

```bash
# GET /api/2fa/status
# Requiere autenticaciÃ³n
```

Respuesta:
```json
{
  "success": true,
  "enabled": true
}
```

### 4. Deshabilitar 2FA

```bash
# POST /api/2fa/disable
# Body: { "verificationCode": "123456" }
# Requiere cÃ³digo TOTP o cÃ³digo de respaldo
```

## ðŸ“Š Revisar MÃ©tricas de Seguridad

### Endpoints disponibles (solo para super_admin)

**1. EstadÃ­sticas generales:**
```bash
GET /api/security-metrics/stats?startTime=2024-01-01T00:00:00Z&endTime=2024-12-31T23:59:59Z
```

Respuesta:
```json
{
  "success": true,
  "stats": {
    "failed_login": 15,
    "successful_login": 120,
    "blocked_user": 2,
    "2fa_used": 45,
    "captcha_shown": 8,
    "captcha_passed": 7
  }
}
```

**2. MÃ©tricas por tipo:**
```bash
GET /api/security-metrics/by-type/failed_login?limit=100
```

**3. MÃ©tricas por rango de tiempo:**
```bash
GET /api/security-metrics/by-time-range?startTime=2024-01-01T00:00:00Z&endTime=2024-12-31T23:59:59Z&limit=500
```

### Tipos de mÃ©tricas disponibles:

- `failed_login` - Intentos de login fallidos
- `successful_login` - Logins exitosos
- `registration_success` - Registros exitosos
- `registration_failed` - Intentos de registro fallidos
- `email_verified` - Emails verificados exitosamente
- `email_verification_failed` - Intentos de verificaciÃ³n de email fallidos
- `blocked_user` - Usuarios bloqueados
- `unblocked_user` - Usuarios desbloqueados
- `banned_user` - Usuarios baneados
- `2fa_enabled` - 2FA habilitado
- `2fa_disabled` - 2FA deshabilitado
- `2fa_used` - 2FA usado en login
- `2fa_failed` - CÃ³digo 2FA invÃ¡lido
- `captcha_shown` - CAPTCHA mostrado
- `captcha_passed` - CAPTCHA pasado exitosamente
- `captcha_failed` - CAPTCHA fallido
- `token_revoked` - Tokens revocados
- `password_changed` - ContraseÃ±as cambiadas
- `account_locked` - Cuentas bloqueadas
- `suspicious_activity` - Actividad sospechosa

## ðŸ” Logs de AuditorÃ­a

### Consultar logs por usuario:
```bash
GET /api/audit-logs/user/:userId?limit=100
```

### Consultar logs por acciÃ³n:
```bash
GET /api/audit-logs/action/LOGIN_SUCCESS?limit=100
```

### Acciones registradas:
- `LOGIN_SUCCESS` - Login exitoso
- `LOGIN_FAILED` - Login fallido
- `LOGOUT` - Cierre de sesiÃ³n
- `CREATE_USER` - Usuario creado
- `UPDATE_USER` - Usuario actualizado
- `DELETE_USER` - Usuario eliminado
- `BLOCK_USER` - Usuario bloqueado
- `UNBLOCK_USER` - Usuario desbloqueado
- `BAN_USER` - Usuario baneado
- `2FA_ENABLED` - 2FA habilitado
- `2FA_DISABLED` - 2FA deshabilitado
- `2FA_SETUP_INITIATED` - Inicio de configuraciÃ³n 2FA

## ðŸ§ª Pruebas RÃ¡pidas

### 1. Probar Blacklist de Tokens

1. Inicia sesiÃ³n
2. Haz logout
3. Intenta usar el token anterior (deberÃ­a ser rechazado)

### 2. Probar CAPTCHA

1. Intenta hacer login con credenciales incorrectas 3 veces
2. En el 4to intento, deberÃ­as ver un CAPTCHA (si estÃ¡ configurado)
3. Completa el CAPTCHA y continÃºa

### 3. Probar Rate Limiting

1. Intenta hacer login con credenciales incorrectas mÃºltiples veces
2. DeberÃ­as ver delays progresivos:
   - 3 intentos: 5 segundos
   - 5 intentos: 30 segundos
   - 10 intentos: 15 minutos de bloqueo

### 4. Probar Logging de AuditorÃ­a

1. Realiza cualquier acciÃ³n (crear usuario, bloquear usuario, etc.)
2. Consulta los logs de auditorÃ­a
3. Verifica que la acciÃ³n estÃ© registrada

## ðŸ“ Notas Importantes

1. **Blacklist de Tokens**: Los tokens se invalidan inmediatamente al hacer logout. La limpieza de tokens expirados debe ejecutarse periÃ³dicamente (considera un cron job).

2. **2FA**: Los secretos TOTP se almacenan en la base de datos. En producciÃ³n, considera encriptarlos adicionalmente.

3. **CAPTCHA**: Solo se muestra despuÃ©s de 3 intentos fallidos. Si no estÃ¡ configurado, el sistema funcionarÃ¡ normalmente sin CAPTCHA.

4. **MÃ©tricas**: Se registran automÃ¡ticamente en todas las acciones de seguridad. No requiere configuraciÃ³n adicional.

5. **Logs de AuditorÃ­a**: Se registran automÃ¡ticamente en todas las acciones sensibles. Se almacenan en la base de datos D1.

## ðŸ“§ ConfiguraciÃ³n de Email para Registro PÃºblico

El registro pÃºblico requiere un servicio de email configurado para enviar emails de verificaciÃ³n.

### OpciÃ³n 1: Resend (Recomendado para desarrollo)

1. **Crear cuenta en Resend:**
   - Ve a https://resend.com/
   - Crea una cuenta gratuita
   - ObtÃ©n tu API key

2. **Configurar variable de entorno:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### OpciÃ³n 2: SendGrid

1. **Crear cuenta en SendGrid:**
   - Ve a https://sendgrid.com/
   - Crea una cuenta
   - Genera un API key

2. **Configurar variable de entorno:**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

### OpciÃ³n 3: AWS SES

1. **Configurar AWS SES:**
   - Ve a AWS Console
   - Configura SES
   - Crea credenciales IAM

2. **Configurar variables de entorno:**
   ```env
   AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
   AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
   AWS_REGION=us-east-1
   ```

### Configurar Base URL

```env
# URL base para enlaces de verificaciÃ³n de email
APP_BASE_URL=http://localhost:5173  # Desarrollo
# APP_BASE_URL=https://tu-dominio.com  # ProducciÃ³n
```

## ðŸ§ª Pruebas del Flujo de Registro PÃºblico

### 1. PreparaciÃ³n

AsegÃºrate de tener configurado:
- âœ… Servicio de email (Resend/SendGrid/AWS SES)
- âœ… CAPTCHA (Turnstile/reCAPTCHA/hCaptcha)
- âœ… APP_BASE_URL

### 2. Probar Registro

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "nuevo@example.com",
  "password": "MiPasswordSegura123!",
  "name": "Juan PÃ©rez",
  "termsAccepted": true,
  "captchaToken": "token-del-captcha-completado"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Si el email no estÃ¡ registrado, recibirÃ¡s un correo de verificaciÃ³n. Por favor, revisa tu bandeja de entrada."
}
```

**Errores comunes:**
- `400` - Datos invÃ¡lidos (contraseÃ±a dÃ©bil, email invÃ¡lido, etc.)
- `429` - Rate limit excedido (3 registros por IP/hora)
- `400` - CAPTCHA requerido o invÃ¡lido
- `400` - Email temporal bloqueado

### 3. Verificar Email

**OpciÃ³n A: Usar el enlace del email**

El usuario recibe un email con un enlace como:
```
http://localhost:5173/verify-email?token=abc123...
```

**OpciÃ³n B: Usar el endpoint directamente**

**Endpoint:** `POST /api/auth/verify-email`

**Request:**
```json
{
  "token": "token-del-email"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Email verificado correctamente. Ya puedes iniciar sesiÃ³n.",
  "user": {
    "id": "user_public_...",
    "email": "nuevo@example.com",
    "name": "Juan PÃ©rez"
  }
}
```

### 4. Probar Login con Usuario Verificado

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "nuevo@example.com",
  "password": "MiPasswordSegura123!"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "user": {
    "id": "user_public_...",
    "email": "nuevo@example.com",
    "name": "Juan PÃ©rez",
    "role": "podiatrist"
  }
}
```

**Error si email no verificado:**
```json
{
  "error": "Email no verificado",
  "message": "Por favor, verifica tu email antes de iniciar sesiÃ³n. Revisa tu bandeja de entrada.",
  "requiresEmailVerification": true
}
```

### 5. Verificar Logs y MÃ©tricas

**Consultar logs de registro:**
```bash
GET /api/audit-logs/action/REGISTER_ATTEMPT?limit=10
```

**Consultar mÃ©tricas de registro:**
```bash
GET /api/security-metrics/by-type/captcha_passed?limit=10
GET /api/security-metrics/by-type/captcha_failed?limit=10
```

## ðŸ§ª Script de Prueba Manual

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env` en la raÃ­z del proyecto con:

```env
# JWT Secrets (requeridos)
JWT_SECRET=tu-jwt-secret-minimo-32-caracteres
REFRESH_TOKEN_SECRET=tu-refresh-secret-diferente-minimo-32-caracteres
CSRF_SECRET=tu-csrf-secret-minimo-32-caracteres

# Email (requerido para registro)
RESEND_API_KEY=tu-resend-api-key
# O alternativamente:
# SENDGRID_API_KEY=tu-sendgrid-api-key
# AWS_ACCESS_KEY_ID=tu-aws-key
# AWS_SECRET_ACCESS_KEY=tu-aws-secret
# AWS_REGION=us-east-1

# CAPTCHA (requerido para registro)
CAPTCHA_PROVIDER=turnstile
CAPTCHA_SITE_KEY=tu-site-key
CAPTCHA_SECRET_KEY=tu-secret-key

# Base URL (requerido para enlaces de verificaciÃ³n)
APP_BASE_URL=http://localhost:5173

# Opcional: RestricciÃ³n de dominios
# ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com
```

### Paso 2: Probar Registro

1. Abre tu aplicaciÃ³n en el navegador
2. Ve a la pÃ¡gina de registro
3. Completa el formulario:
   - Email vÃ¡lido (no temporal)
   - ContraseÃ±a fuerte (12+ caracteres, mayÃºsculas, minÃºsculas, nÃºmeros, especiales)
   - Nombre
   - Acepta tÃ©rminos
   - Completa CAPTCHA
4. EnvÃ­a el formulario
5. Verifica que recibas un email de verificaciÃ³n

### Paso 3: Verificar Email

1. Abre el email recibido
2. Haz clic en el botÃ³n "Verificar Email" o copia el enlace
3. Verifica que la cuenta se active correctamente

### Paso 4: Probar Login

1. Intenta hacer login con el email y contraseÃ±a registrados
2. Verifica que el login sea exitoso
3. Verifica que puedas acceder a la aplicaciÃ³n

### Paso 5: Verificar Seguridad

1. Intenta registrar el mismo email dos veces (debe dar mensaje genÃ©rico)
2. Intenta registrar con email temporal (debe ser bloqueado)
3. Intenta registrar mÃ¡s de 3 veces desde la misma IP (debe aplicar rate limit)
4. Intenta hacer login sin verificar email (debe ser rechazado)

## ðŸš€ PrÃ³ximos Pasos

1. âœ… Migraciones ejecutadas
2. âš™ï¸ Configurar servicio de email (Resend/SendGrid/AWS SES)
3. âš™ï¸ Configurar CAPTCHA (Turnstile/reCAPTCHA/hCaptcha)
4. âš™ï¸ Configurar APP_BASE_URL
5. ðŸ§ª Probar flujo completo de registro
6. ðŸ§ª Probar flujo de 2FA
7. ðŸ“Š Revisar mÃ©tricas de seguridad
8. ðŸ” Revisar logs de auditorÃ­a

Â¡Todo estÃ¡ listo para usar! ðŸŽ‰
