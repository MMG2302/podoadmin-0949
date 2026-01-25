# Guía de Configuración y Pruebas de Seguridad

## ✅ Migraciones de Base de Datos

Las migraciones se han ejecutado correctamente. Las siguientes tablas han sido creadas:

- ✅ `token_blacklist` - Para invalidar tokens en logout
- ✅ `two_factor_auth` - Para almacenar secretos TOTP y códigos de respaldo
- ✅ `security_metrics` - Para métricas de seguridad

## 🔐 Configuración de CAPTCHA (Opcional)

### Opción 1: Google reCAPTCHA

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

### Opción 2: Cloudflare Turnstile (Recomendado)

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

### Opción 3: hCaptcha

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
Si no configuras CAPTCHA, el sistema funcionará normalmente pero no se mostrará CAPTCHA después de intentos fallidos (aunque seguirá funcionando el rate limiting).

## 🔒 Pruebas de 2FA (Autenticación de Dos Factores)

### 1. Habilitar 2FA para un usuario

**Paso 1: Iniciar configuración**
```bash
# POST /api/2fa/setup
# Requiere autenticación
```

Respuesta:
```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/PodoAdmin:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=PodoAdmin",
  "message": "Escanea el código QR con tu aplicación de autenticación"
}
```

**Paso 2: Escanear QR con aplicación de autenticación**
- Google Authenticator
- Microsoft Authenticator
- Authy
- Cualquier app compatible con TOTP

**Paso 3: Verificar código y habilitar**
```bash
# POST /api/2fa/enable
# Body: { "secret": "...", "verificationCode": "123456" }
```

Respuesta:
```json
{
  "success": true,
  "backupCodes": ["12345678", "87654321", ...],
  "message": "2FA habilitado correctamente. Guarda los códigos de respaldo en un lugar seguro."
}
```

⚠️ **IMPORTANTE**: Guarda los códigos de respaldo en un lugar seguro. Solo se muestran una vez.

### 2. Probar login con 2FA

1. Intenta hacer login normalmente
2. Si el usuario tiene 2FA habilitado, recibirás:
   ```json
   {
     "error": "Código 2FA requerido",
     "message": "Por favor, ingresa el código de autenticación de dos factores",
     "requires2FA": true
   }
   ```
3. Ingresa el código de 6 dígitos de tu app de autenticación
4. El login debería completarse exitosamente

### 3. Verificar estado de 2FA

```bash
# GET /api/2fa/status
# Requiere autenticación
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
# Requiere código TOTP o código de respaldo
```

## 📊 Revisar Métricas de Seguridad

### Endpoints disponibles (solo para super_admin)

**1. Estadísticas generales:**
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

**2. Métricas por tipo:**
```bash
GET /api/security-metrics/by-type/failed_login?limit=100
```

**3. Métricas por rango de tiempo:**
```bash
GET /api/security-metrics/by-time-range?startTime=2024-01-01T00:00:00Z&endTime=2024-12-31T23:59:59Z&limit=500
```

### Tipos de métricas disponibles:

- `failed_login` - Intentos de login fallidos
- `successful_login` - Logins exitosos
- `registration_success` - Registros exitosos
- `registration_failed` - Intentos de registro fallidos
- `email_verified` - Emails verificados exitosamente
- `email_verification_failed` - Intentos de verificación de email fallidos
- `blocked_user` - Usuarios bloqueados
- `unblocked_user` - Usuarios desbloqueados
- `banned_user` - Usuarios baneados
- `2fa_enabled` - 2FA habilitado
- `2fa_disabled` - 2FA deshabilitado
- `2fa_used` - 2FA usado en login
- `2fa_failed` - Código 2FA inválido
- `captcha_shown` - CAPTCHA mostrado
- `captcha_passed` - CAPTCHA pasado exitosamente
- `captcha_failed` - CAPTCHA fallido
- `token_revoked` - Tokens revocados
- `password_changed` - Contraseñas cambiadas
- `account_locked` - Cuentas bloqueadas
- `suspicious_activity` - Actividad sospechosa

## 🔍 Logs de Auditoría

### Consultar logs por usuario:
```bash
GET /api/audit-logs/user/:userId?limit=100
```

### Consultar logs por acción:
```bash
GET /api/audit-logs/action/LOGIN_SUCCESS?limit=100
```

### Acciones registradas:
- `LOGIN_SUCCESS` - Login exitoso
- `LOGIN_FAILED` - Login fallido
- `LOGOUT` - Cierre de sesión
- `CREATE_USER` - Usuario creado
- `UPDATE_USER` - Usuario actualizado
- `DELETE_USER` - Usuario eliminado
- `BLOCK_USER` - Usuario bloqueado
- `UNBLOCK_USER` - Usuario desbloqueado
- `BAN_USER` - Usuario baneado
- `2FA_ENABLED` - 2FA habilitado
- `2FA_DISABLED` - 2FA deshabilitado
- `2FA_SETUP_INITIATED` - Inicio de configuración 2FA

## 🧪 Pruebas Rápidas

### 1. Probar Blacklist de Tokens

1. Inicia sesión
2. Haz logout
3. Intenta usar el token anterior (debería ser rechazado)

### 2. Probar CAPTCHA

1. Intenta hacer login con credenciales incorrectas 3 veces
2. En el 4to intento, deberías ver un CAPTCHA (si está configurado)
3. Completa el CAPTCHA y continúa

### 3. Probar Rate Limiting

1. Intenta hacer login con credenciales incorrectas múltiples veces
2. Deberías ver delays progresivos:
   - 3 intentos: 5 segundos
   - 5 intentos: 30 segundos
   - 10 intentos: 15 minutos de bloqueo

### 4. Probar Logging de Auditoría

1. Realiza cualquier acción (crear usuario, bloquear usuario, etc.)
2. Consulta los logs de auditoría
3. Verifica que la acción esté registrada

## 📝 Notas Importantes

1. **Blacklist de Tokens**: Los tokens se invalidan inmediatamente al hacer logout. La limpieza de tokens expirados debe ejecutarse periódicamente (considera un cron job).

2. **2FA**: Los secretos TOTP se almacenan en la base de datos. En producción, considera encriptarlos adicionalmente.

3. **CAPTCHA**: Solo se muestra después de 3 intentos fallidos. Si no está configurado, el sistema funcionará normalmente sin CAPTCHA.

4. **Métricas**: Se registran automáticamente en todas las acciones de seguridad. No requiere configuración adicional.

5. **Logs de Auditoría**: Se registran automáticamente en todas las acciones sensibles. Se almacenan en la base de datos D1.

## 📧 Configuración de Email para Registro Público

El registro público requiere un servicio de email configurado para enviar emails de verificación.

### Opción 1: Resend (Recomendado para desarrollo)

1. **Crear cuenta en Resend:**
   - Ve a https://resend.com/
   - Crea una cuenta gratuita
   - Obtén tu API key

2. **Configurar variable de entorno:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### Opción 2: SendGrid

1. **Crear cuenta en SendGrid:**
   - Ve a https://sendgrid.com/
   - Crea una cuenta
   - Genera un API key

2. **Configurar variable de entorno:**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

### Opción 3: AWS SES

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
# URL base para enlaces de verificación de email
VITE_BASE_URL=http://localhost:5173  # Desarrollo
# VITE_BASE_URL=https://tu-dominio.com  # Producción
```

## 🧪 Pruebas del Flujo de Registro Público

### 1. Preparación

Asegúrate de tener configurado:
- ✅ Servicio de email (Resend/SendGrid/AWS SES)
- ✅ CAPTCHA (Turnstile/reCAPTCHA/hCaptcha)
- ✅ VITE_BASE_URL

### 2. Probar Registro

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "nuevo@example.com",
  "password": "MiPasswordSegura123!",
  "name": "Juan Pérez",
  "termsAccepted": true,
  "captchaToken": "token-del-captcha-completado"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Si el email no está registrado, recibirás un correo de verificación. Por favor, revisa tu bandeja de entrada."
}
```

**Errores comunes:**
- `400` - Datos inválidos (contraseña débil, email inválido, etc.)
- `429` - Rate limit excedido (3 registros por IP/hora)
- `400` - CAPTCHA requerido o inválido
- `400` - Email temporal bloqueado

### 3. Verificar Email

**Opción A: Usar el enlace del email**

El usuario recibe un email con un enlace como:
```
http://localhost:5173/verify-email?token=abc123...
```

**Opción B: Usar el endpoint directamente**

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
  "message": "Email verificado correctamente. Ya puedes iniciar sesión.",
  "user": {
    "id": "user_public_...",
    "email": "nuevo@example.com",
    "name": "Juan Pérez"
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
    "name": "Juan Pérez",
    "role": "podiatrist"
  }
}
```

**Error si email no verificado:**
```json
{
  "error": "Email no verificado",
  "message": "Por favor, verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
  "requiresEmailVerification": true
}
```

### 5. Verificar Logs y Métricas

**Consultar logs de registro:**
```bash
GET /api/audit-logs/action/REGISTER_ATTEMPT?limit=10
```

**Consultar métricas de registro:**
```bash
GET /api/security-metrics/by-type/captcha_passed?limit=10
GET /api/security-metrics/by-type/captcha_failed?limit=10
```

## 🧪 Script de Prueba Manual

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

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

# Base URL (requerido para enlaces de verificación)
VITE_BASE_URL=http://localhost:5173

# Opcional: Restricción de dominios
# ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com
```

### Paso 2: Probar Registro

1. Abre tu aplicación en el navegador
2. Ve a la página de registro
3. Completa el formulario:
   - Email válido (no temporal)
   - Contraseña fuerte (12+ caracteres, mayúsculas, minúsculas, números, especiales)
   - Nombre
   - Acepta términos
   - Completa CAPTCHA
4. Envía el formulario
5. Verifica que recibas un email de verificación

### Paso 3: Verificar Email

1. Abre el email recibido
2. Haz clic en el botón "Verificar Email" o copia el enlace
3. Verifica que la cuenta se active correctamente

### Paso 4: Probar Login

1. Intenta hacer login con el email y contraseña registrados
2. Verifica que el login sea exitoso
3. Verifica que puedas acceder a la aplicación

### Paso 5: Verificar Seguridad

1. Intenta registrar el mismo email dos veces (debe dar mensaje genérico)
2. Intenta registrar con email temporal (debe ser bloqueado)
3. Intenta registrar más de 3 veces desde la misma IP (debe aplicar rate limit)
4. Intenta hacer login sin verificar email (debe ser rechazado)

## 🚀 Próximos Pasos

1. ✅ Migraciones ejecutadas
2. ⚙️ Configurar servicio de email (Resend/SendGrid/AWS SES)
3. ⚙️ Configurar CAPTCHA (Turnstile/reCAPTCHA/hCaptcha)
4. ⚙️ Configurar VITE_BASE_URL
5. 🧪 Probar flujo completo de registro
6. 🧪 Probar flujo de 2FA
7. 📊 Revisar métricas de seguridad
8. 🔍 Revisar logs de auditoría

¡Todo está listo para usar! 🎉
