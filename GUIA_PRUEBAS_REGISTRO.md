# ðŸ§ª GuÃ­a de Pruebas del Registro PÃºblico

Esta guÃ­a te ayudarÃ¡ a probar el flujo completo de registro pÃºblico paso a paso.

## ðŸ“‹ Prerrequisitos

Antes de comenzar, asegÃºrate de tener configurado:

1. âœ… **Servicio de Email** (uno de estos):
   - Resend API Key
   - SendGrid API Key
   - AWS SES Credentials

2. âœ… **CAPTCHA** (uno de estos):
   - Cloudflare Turnstile
   - Google reCAPTCHA
   - hCaptcha

3. âœ… **Variables de Entorno**:
   - `APP_BASE_URL` - URL base para enlaces de verificaciÃ³n
   - `JWT_SECRET` - Clave secreta para JWT
   - `REFRESH_TOKEN_SECRET` - Clave secreta para refresh tokens
   - `CSRF_SECRET` - Clave secreta para CSRF

## ðŸ”§ ConfiguraciÃ³n Inicial

### 1. Crear archivo `.env`

Crea un archivo `.env` en la raÃ­z del proyecto:

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
APP_BASE_URL=http://localhost:5173

# Opcional: RestricciÃ³n de dominios
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

## ðŸ§ª Pruebas Paso a Paso

### Prueba 1: Registro Exitoso

**Objetivo:** Verificar que un usuario puede registrarse correctamente.

**Pasos:**

1. Abre la aplicaciÃ³n en `http://localhost:5173`
2. Navega a la pÃ¡gina de registro
3. Completa el formulario:
   - **Email:** `test@example.com` (usa un email real que puedas verificar)
   - **ContraseÃ±a:** `MiPasswordSegura123!` (12+ caracteres, mayÃºsculas, minÃºsculas, nÃºmeros, especiales)
   - **Nombre:** `Usuario de Prueba`
   - **TÃ©rminos:** âœ… Aceptar
   - **CAPTCHA:** âœ… Completar
4. EnvÃ­a el formulario

**Resultado Esperado:**
- âœ… Mensaje: "Si el email no estÃ¡ registrado, recibirÃ¡s un correo de verificaciÃ³n"
- âœ… Email recibido con enlace de verificaciÃ³n
- âœ… Usuario creado en base de datos con `emailVerified: false`, `isEnabled: false`

**Verificar en Base de Datos:**
```sql
SELECT * FROM created_users WHERE email = 'test@example.com';
-- Debe mostrar: email_verified = 0, is_enabled = 0, registration_source = 'public'
```

### Prueba 2: VerificaciÃ³n de Email

**Objetivo:** Verificar que el usuario puede activar su cuenta.

**Pasos:**

1. Abre el email recibido
2. Haz clic en el botÃ³n "Verificar Email" o copia el enlace
3. O usa el endpoint directamente:

```bash
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "token-del-email"
}
```

**Resultado Esperado:**
- âœ… Mensaje: "Email verificado correctamente. Ya puedes iniciar sesiÃ³n."
- âœ… Usuario actualizado: `emailVerified: true`, `isEnabled: true`
- âœ… Token marcado como usado

**Verificar en Base de Datos:**
```sql
SELECT * FROM created_users WHERE email = 'test@example.com';
-- Debe mostrar: email_verified = 1, is_enabled = 1
```

### Prueba 3: Login con Usuario Verificado

**Objetivo:** Verificar que el usuario puede hacer login despuÃ©s de verificar su email.

**Pasos:**

1. Ve a la pÃ¡gina de login
2. Ingresa:
   - **Email:** `test@example.com`
   - **ContraseÃ±a:** `MiPasswordSegura123!`
3. EnvÃ­a el formulario

**Resultado Esperado:**
- âœ… Login exitoso
- âœ… Tokens JWT generados
- âœ… Cookies establecidas
- âœ… Usuario autenticado

### Prueba 4: Login sin Verificar Email

**Objetivo:** Verificar que usuarios sin verificar email no pueden hacer login.

**Pasos:**

1. Registra un nuevo usuario (pero NO verifiques el email)
2. Intenta hacer login con ese usuario

**Resultado Esperado:**
- âŒ Error: "Email no verificado"
- âŒ Mensaje: "Por favor, verifica tu email antes de iniciar sesiÃ³n"
- âŒ Login rechazado

### Prueba 5: ValidaciÃ³n de ContraseÃ±a DÃ©bil

**Objetivo:** Verificar que se rechazan contraseÃ±as dÃ©biles.

**Pasos:**

1. Intenta registrar con contraseÃ±as dÃ©biles:
   - `password` (muy corta)
   - `Password123` (falta carÃ¡cter especial)
   - `PASSWORD123!` (falta minÃºscula)
   - `password123!` (falta mayÃºscula)
   - `Password!` (falta nÃºmero)

**Resultado Esperado:**
- âŒ Error: "ContraseÃ±a dÃ©bil"
- âŒ Mensaje especÃ­fico del error
- âŒ Registro rechazado

### Prueba 6: Rate Limiting

**Objetivo:** Verificar que el rate limiting funciona correctamente.

**Pasos:**

1. Intenta registrar 4 veces desde la misma IP en menos de 1 hora
2. La 4ta vez deberÃ­a ser rechazada

**Resultado Esperado:**
- âœ… Primeras 3 registros: Exitosos
- âŒ 4to registro: Error 429 "Demasiados registros"
- âŒ Mensaje: "MÃ¡ximo 3 registros por hora"

**Verificar en Base de Datos:**
```sql
SELECT * FROM registration_rate_limit WHERE identifier = 'tu-ip';
-- Debe mostrar: count = 3
```

### Prueba 7: Bloqueo por Intentos Fallidos

**Objetivo:** Verificar que despuÃ©s de 5 intentos fallidos, la IP se bloquea.

**Pasos:**

1. Intenta registrar con datos invÃ¡lidos 5 veces:
   - Email invÃ¡lido
   - ContraseÃ±a dÃ©bil
   - Sin CAPTCHA
   - Etc.
2. Intenta registrar una 6ta vez

**Resultado Esperado:**
- âŒ 6to intento: Error 429 "IP bloqueada"
- âŒ Mensaje: "Tu IP estÃ¡ bloqueada hasta [fecha]"
- âŒ Bloqueo por 24 horas

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
- âœ… Mensaje genÃ©rico: "Si el email existe, recibirÃ¡s un correo de verificaciÃ³n"
- âœ… NO revela que el email ya existe
- âœ… Registro no procesado (pero mensaje positivo)

### Prueba 9: Email Temporal Bloqueado

**Objetivo:** Verificar que se bloquean emails temporales.

**Pasos:**

1. Intenta registrar con emails temporales:
   - `test@10minutemail.com`
   - `test@tempmail.com`
   - `test@guerrillamail.com`

**Resultado Esperado:**
- âŒ Error: "Email invÃ¡lido"
- âŒ Mensaje: "No se permiten direcciones de email temporales"
- âŒ Registro rechazado

### Prueba 10: CAPTCHA Requerido

**Objetivo:** Verificar que el CAPTCHA es obligatorio.

**Pasos:**

1. Intenta registrar sin completar CAPTCHA
2. Intenta registrar con CAPTCHA invÃ¡lido

**Resultado Esperado:**
- âŒ Sin CAPTCHA: Error "CAPTCHA requerido"
- âŒ CAPTCHA invÃ¡lido: Error "CAPTCHA invÃ¡lido"
- âŒ Registro rechazado

### Prueba 11: TÃ©rminos y Condiciones

**Objetivo:** Verificar que se requiere aceptar tÃ©rminos.

**Pasos:**

1. Intenta registrar sin aceptar tÃ©rminos

**Resultado Esperado:**
- âŒ Error: "TÃ©rminos no aceptados"
- âŒ Mensaje: "Debes aceptar los tÃ©rminos y condiciones"
- âŒ Registro rechazado

### Prueba 12: Token de VerificaciÃ³n Expirado

**Objetivo:** Verificar que tokens expirados no funcionan.

**Pasos:**

1. Registra un usuario
2. Espera 24 horas (o modifica el token en BD para que expire)
3. Intenta verificar con el token expirado

**Resultado Esperado:**
- âŒ Error: "Token invÃ¡lido"
- âŒ Mensaje: "El token de verificaciÃ³n no es vÃ¡lido o ha expirado"
- âŒ VerificaciÃ³n rechazada

### Prueba 13: Token de VerificaciÃ³n Reutilizado

**Objetivo:** Verificar que tokens usados no pueden reutilizarse.

**Pasos:**

1. Verifica un email exitosamente
2. Intenta usar el mismo token de nuevo

**Resultado Esperado:**
- âŒ Error: "Token invÃ¡lido"
- âŒ Mensaje: "Token no encontrado o ya usado"
- âŒ VerificaciÃ³n rechazada

## ðŸ“Š Verificar Logs y MÃ©tricas

### Consultar Logs de AuditorÃ­a

```bash
# Ver todos los registros
GET /api/audit-logs/action/REGISTER_ATTEMPT?limit=10

# Ver verificaciones de email
GET /api/audit-logs/action/EMAIL_VERIFIED?limit=10
```

### Consultar MÃ©tricas de Seguridad

```bash
# Ver estadÃ­sticas generales
GET /api/security-metrics/stats

# Ver mÃ©tricas de CAPTCHA
GET /api/security-metrics/by-type/captcha_passed?limit=10
GET /api/security-metrics/by-type/captcha_failed?limit=10

# Ver mÃ©tricas de registro
GET /api/security-metrics/by-type/successful_login?limit=10
```

## âœ… Checklist de Pruebas

- [ ] Registro exitoso con datos vÃ¡lidos
- [ ] Email de verificaciÃ³n recibido
- [ ] VerificaciÃ³n de email exitosa
- [ ] Login con usuario verificado
- [ ] Login rechazado sin verificar email
- [ ] ContraseÃ±as dÃ©biles rechazadas
- [ ] Rate limiting (3 registros/hora)
- [ ] Bloqueo por 5 intentos fallidos
- [ ] Email duplicado (mensaje genÃ©rico)
- [ ] Emails temporales bloqueados
- [ ] CAPTCHA requerido
- [ ] TÃ©rminos y condiciones requeridos
- [ ] Token expirado rechazado
- [ ] Token reutilizado rechazado
- [ ] Logs de auditorÃ­a registrados
- [ ] MÃ©tricas de seguridad registradas

## ðŸ› SoluciÃ³n de Problemas

### No recibo emails de verificaciÃ³n

1. Verifica que el servicio de email estÃ© configurado correctamente
2. Revisa los logs del servidor para errores
3. Verifica que `APP_BASE_URL` estÃ© configurado
4. Revisa la carpeta de spam

### CAPTCHA no funciona

1. Verifica que las claves de CAPTCHA sean correctas
2. Verifica que `CAPTCHA_PROVIDER` estÃ© configurado
3. Revisa la consola del navegador para errores

### Rate limiting muy estricto

1. Verifica la tabla `registration_rate_limit` en la BD
2. Limpia registros antiguos si es necesario
3. Ajusta los lÃ­mites en `src/api/utils/registration-rate-limit.ts`

### Token de verificaciÃ³n no funciona

1. Verifica que el token no haya expirado (24 horas)
2. Verifica que el token no haya sido usado
3. Revisa la tabla `email_verification_tokens` en la BD

## ðŸŽ‰ Â¡Pruebas Completadas!

Una vez que todas las pruebas pasen, el sistema de registro pÃºblico estarÃ¡ completamente funcional y seguro.
