# 🧪 Guía de Pruebas del Registro Público

Esta guía te ayudará a probar el flujo completo de registro público paso a paso.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener configurado:

1. ✅ **Servicio de Email** (uno de estos):
   - Resend API Key
   - SendGrid API Key
   - AWS SES Credentials

2. ✅ **CAPTCHA** (uno de estos):
   - Cloudflare Turnstile
   - Google reCAPTCHA
   - hCaptcha

3. ✅ **Variables de Entorno**:
   - `VITE_BASE_URL` - URL base para enlaces de verificación
   - `JWT_SECRET` - Clave secreta para JWT
   - `REFRESH_TOKEN_SECRET` - Clave secreta para refresh tokens
   - `CSRF_SECRET` - Clave secreta para CSRF

## 🔧 Configuración Inicial

### 1. Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto:

```env
# JWT Secrets (requeridos)
JWT_SECRET=tu-jwt-secret-minimo-32-caracteres-aleatorios
REFRESH_TOKEN_SECRET=tu-refresh-secret-diferente-minimo-32-caracteres
CSRF_SECRET=tu-csrf-secret-minimo-32-caracteres

# Email Service (requerido para registro)
RESEND_API_KEY=re_xxxxxxxxxxxxx
# O alternativamente:
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
# AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
# AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx
# AWS_REGION=us-east-1

# CAPTCHA (requerido para registro)
CAPTCHA_PROVIDER=turnstile
CAPTCHA_SITE_KEY=tu-site-key-aqui
CAPTCHA_SECRET_KEY=tu-secret-key-aqui

# Base URL (requerido para enlaces)
VITE_BASE_URL=http://localhost:5173

# Opcional: Restricción de dominios
# ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,hotmail.com
```

### 2. Obtener Credenciales

#### Resend (Recomendado para desarrollo)

1. Ve a https://resend.com/
2. Crea una cuenta gratuita
3. Ve a "API Keys" y crea una nueva key
4. Copia la key (empieza con `re_`)

#### Cloudflare Turnstile (Recomendado)

1. Ve a https://dash.cloudflare.com/
2. Navega a "Turnstile"
3. Crea un nuevo sitio
4. Copia Site Key y Secret Key

## 🧪 Pruebas Paso a Paso

### Prueba 1: Registro Exitoso

**Objetivo:** Verificar que un usuario puede registrarse correctamente.

**Pasos:**

1. Abre la aplicación en `http://localhost:5173`
2. Navega a la página de registro
3. Completa el formulario:
   - **Email:** `test@example.com` (usa un email real que puedas verificar)
   - **Contraseña:** `MiPasswordSegura123!` (12+ caracteres, mayúsculas, minúsculas, números, especiales)
   - **Nombre:** `Usuario de Prueba`
   - **Términos:** ✅ Aceptar
   - **CAPTCHA:** ✅ Completar
4. Envía el formulario

**Resultado Esperado:**
- ✅ Mensaje: "Si el email no está registrado, recibirás un correo de verificación"
- ✅ Email recibido con enlace de verificación
- ✅ Usuario creado en base de datos con `emailVerified: false`, `isEnabled: false`

**Verificar en Base de Datos:**
```sql
SELECT * FROM created_users WHERE email = 'test@example.com';
-- Debe mostrar: email_verified = 0, is_enabled = 0, registration_source = 'public'
```

### Prueba 2: Verificación de Email

**Objetivo:** Verificar que el usuario puede activar su cuenta.

**Pasos:**

1. Abre el email recibido
2. Haz clic en el botón "Verificar Email" o copia el enlace
3. O usa el endpoint directamente:

```bash
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "token-del-email"
}
```

**Resultado Esperado:**
- ✅ Mensaje: "Email verificado correctamente. Ya puedes iniciar sesión."
- ✅ Usuario actualizado: `emailVerified: true`, `isEnabled: true`
- ✅ Token marcado como usado

**Verificar en Base de Datos:**
```sql
SELECT * FROM created_users WHERE email = 'test@example.com';
-- Debe mostrar: email_verified = 1, is_enabled = 1
```

### Prueba 3: Login con Usuario Verificado

**Objetivo:** Verificar que el usuario puede hacer login después de verificar su email.

**Pasos:**

1. Ve a la página de login
2. Ingresa:
   - **Email:** `test@example.com`
   - **Contraseña:** `MiPasswordSegura123!`
3. Envía el formulario

**Resultado Esperado:**
- ✅ Login exitoso
- ✅ Tokens JWT generados
- ✅ Cookies establecidas
- ✅ Usuario autenticado

### Prueba 4: Login sin Verificar Email

**Objetivo:** Verificar que usuarios sin verificar email no pueden hacer login.

**Pasos:**

1. Registra un nuevo usuario (pero NO verifiques el email)
2. Intenta hacer login con ese usuario

**Resultado Esperado:**
- ❌ Error: "Email no verificado"
- ❌ Mensaje: "Por favor, verifica tu email antes de iniciar sesión"
- ❌ Login rechazado

### Prueba 5: Validación de Contraseña Débil

**Objetivo:** Verificar que se rechazan contraseñas débiles.

**Pasos:**

1. Intenta registrar con contraseñas débiles:
   - `password` (muy corta)
   - `Password123` (falta carácter especial)
   - `PASSWORD123!` (falta minúscula)
   - `password123!` (falta mayúscula)
   - `Password!` (falta número)

**Resultado Esperado:**
- ❌ Error: "Contraseña débil"
- ❌ Mensaje específico del error
- ❌ Registro rechazado

### Prueba 6: Rate Limiting

**Objetivo:** Verificar que el rate limiting funciona correctamente.

**Pasos:**

1. Intenta registrar 4 veces desde la misma IP en menos de 1 hora
2. La 4ta vez debería ser rechazada

**Resultado Esperado:**
- ✅ Primeras 3 registros: Exitosos
- ❌ 4to registro: Error 429 "Demasiados registros"
- ❌ Mensaje: "Máximo 3 registros por hora"

**Verificar en Base de Datos:**
```sql
SELECT * FROM registration_rate_limit WHERE identifier = 'tu-ip';
-- Debe mostrar: count = 3
```

### Prueba 7: Bloqueo por Intentos Fallidos

**Objetivo:** Verificar que después de 5 intentos fallidos, la IP se bloquea.

**Pasos:**

1. Intenta registrar con datos inválidos 5 veces:
   - Email inválido
   - Contraseña débil
   - Sin CAPTCHA
   - Etc.
2. Intenta registrar una 6ta vez

**Resultado Esperado:**
- ❌ 6to intento: Error 429 "IP bloqueada"
- ❌ Mensaje: "Tu IP está bloqueada hasta [fecha]"
- ❌ Bloqueo por 24 horas

**Verificar en Base de Datos:**
```sql
SELECT * FROM registration_rate_limit WHERE identifier = 'tu-ip';
-- Debe mostrar: blocked_until = timestamp futuro
```

### Prueba 8: Email Duplicado

**Objetivo:** Verificar que no se revela si un email existe.

**Pasos:**

1. Registra un usuario con `test@example.com`
2. Intenta registrar otro usuario con el mismo email

**Resultado Esperado:**
- ✅ Mensaje genérico: "Si el email existe, recibirás un correo de verificación"
- ✅ NO revela que el email ya existe
- ✅ Registro no procesado (pero mensaje positivo)

### Prueba 9: Email Temporal Bloqueado

**Objetivo:** Verificar que se bloquean emails temporales.

**Pasos:**

1. Intenta registrar con emails temporales:
   - `test@10minutemail.com`
   - `test@tempmail.com`
   - `test@guerrillamail.com`

**Resultado Esperado:**
- ❌ Error: "Email inválido"
- ❌ Mensaje: "No se permiten direcciones de email temporales"
- ❌ Registro rechazado

### Prueba 10: CAPTCHA Requerido

**Objetivo:** Verificar que el CAPTCHA es obligatorio.

**Pasos:**

1. Intenta registrar sin completar CAPTCHA
2. Intenta registrar con CAPTCHA inválido

**Resultado Esperado:**
- ❌ Sin CAPTCHA: Error "CAPTCHA requerido"
- ❌ CAPTCHA inválido: Error "CAPTCHA inválido"
- ❌ Registro rechazado

### Prueba 11: Términos y Condiciones

**Objetivo:** Verificar que se requiere aceptar términos.

**Pasos:**

1. Intenta registrar sin aceptar términos

**Resultado Esperado:**
- ❌ Error: "Términos no aceptados"
- ❌ Mensaje: "Debes aceptar los términos y condiciones"
- ❌ Registro rechazado

### Prueba 12: Token de Verificación Expirado

**Objetivo:** Verificar que tokens expirados no funcionan.

**Pasos:**

1. Registra un usuario
2. Espera 24 horas (o modifica el token en BD para que expire)
3. Intenta verificar con el token expirado

**Resultado Esperado:**
- ❌ Error: "Token inválido"
- ❌ Mensaje: "El token de verificación no es válido o ha expirado"
- ❌ Verificación rechazada

### Prueba 13: Token de Verificación Reutilizado

**Objetivo:** Verificar que tokens usados no pueden reutilizarse.

**Pasos:**

1. Verifica un email exitosamente
2. Intenta usar el mismo token de nuevo

**Resultado Esperado:**
- ❌ Error: "Token inválido"
- ❌ Mensaje: "Token no encontrado o ya usado"
- ❌ Verificación rechazada

## 📊 Verificar Logs y Métricas

### Consultar Logs de Auditoría

```bash
# Ver todos los registros
GET /api/audit-logs/action/REGISTER_ATTEMPT?limit=10

# Ver verificaciones de email
GET /api/audit-logs/action/EMAIL_VERIFIED?limit=10
```

### Consultar Métricas de Seguridad

```bash
# Ver estadísticas generales
GET /api/security-metrics/stats

# Ver métricas de CAPTCHA
GET /api/security-metrics/by-type/captcha_passed?limit=10
GET /api/security-metrics/by-type/captcha_failed?limit=10

# Ver métricas de registro
GET /api/security-metrics/by-type/successful_login?limit=10
```

## ✅ Checklist de Pruebas

- [ ] Registro exitoso con datos válidos
- [ ] Email de verificación recibido
- [ ] Verificación de email exitosa
- [ ] Login con usuario verificado
- [ ] Login rechazado sin verificar email
- [ ] Contraseñas débiles rechazadas
- [ ] Rate limiting (3 registros/hora)
- [ ] Bloqueo por 5 intentos fallidos
- [ ] Email duplicado (mensaje genérico)
- [ ] Emails temporales bloqueados
- [ ] CAPTCHA requerido
- [ ] Términos y condiciones requeridos
- [ ] Token expirado rechazado
- [ ] Token reutilizado rechazado
- [ ] Logs de auditoría registrados
- [ ] Métricas de seguridad registradas

## 🐛 Solución de Problemas

### No recibo emails de verificación

1. Verifica que el servicio de email esté configurado correctamente
2. Revisa los logs del servidor para errores
3. Verifica que `VITE_BASE_URL` esté configurado
4. Revisa la carpeta de spam

### CAPTCHA no funciona

1. Verifica que las claves de CAPTCHA sean correctas
2. Verifica que `CAPTCHA_PROVIDER` esté configurado
3. Revisa la consola del navegador para errores

### Rate limiting muy estricto

1. Verifica la tabla `registration_rate_limit` en la BD
2. Limpia registros antiguos si es necesario
3. Ajusta los límites en `src/api/utils/registration-rate-limit.ts`

### Token de verificación no funciona

1. Verifica que el token no haya expirado (24 horas)
2. Verifica que el token no haya sido usado
3. Revisa la tabla `email_verification_tokens` en la BD

## 🎉 ¡Pruebas Completadas!

Una vez que todas las pruebas pasen, el sistema de registro público estará completamente funcional y seguro.
