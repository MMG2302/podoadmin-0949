# Sistema de Rate Limiting Progresivo para Login

## Resumen

Se ha implementado un sistema de rate limiting progresivo para proteger contra ataques de fuerza bruta en el endpoint de login. El sistema aplica delays y bloqueos temporales basados en el número de intentos fallidos.

## Límites Progresivos

### 1. 3 Intentos Fallidos → Retardo de 5 segundos
- Después de 3 intentos fallidos, el usuario debe esperar 5 segundos antes del siguiente intento
- Se envía notificación por email

### 2. 5 Intentos Fallidos → Retardo de 30 segundos
- Después de 5 intentos fallidos, el delay aumenta a 30 segundos
- Se envía notificación por email

### 3. 10 Intentos Fallidos → Bloqueo Temporal de 15 minutos
- Después de 10 intentos fallidos, la cuenta se bloquea por 15 minutos
- Se envía notificación por email
- El usuario no puede intentar login hasta que expire el bloqueo

## Componentes Implementados

### 1. Sistema de Rate Limiting (`src/api/utils/rate-limit.ts`)

- `recordFailedAttempt()`: Registra un intento fallido
- `clearFailedAttempts()`: Limpia intentos fallidos (en login exitoso)
- `checkRateLimit()`: Verifica si el usuario puede intentar login
- `calculateDelay()`: Calcula el delay requerido
- `getFailedAttemptCount()`: Obtiene el número de intentos fallidos

**Características**:
- Almacenamiento en memoria (en producción, usar Redis o base de datos)
- Ventana de tiempo de 1 hora para resetear contador
- Limpieza automática de intentos antiguos

### 2. Notificaciones por Email (`src/api/utils/email-notifications.ts`)

- `sendFailedLoginNotification()`: Envía notificación por email
- `shouldSendNotification()`: Determina si se debe enviar notificación
- `generateEmailTemplate()`: Genera plantilla HTML para emails

**Puntos de notificación**:
- 3 intentos fallidos
- 5 intentos fallidos
- 10 intentos fallidos (bloqueo)
- Intentos adicionales después del bloqueo

### 3. Integración en Login (`src/api/routes/auth.ts`)

- Verificación de rate limit antes de procesar login
- Registro de intentos fallidos
- Aplicación de delays y bloqueos
- Envío de notificaciones por email
- Limpieza de intentos en login exitoso

### 4. UI Actualizada (`src/web/pages/login.tsx`)

- Muestra mensajes de error con información de rate limiting
- Countdown timer para mostrar tiempo restante
- Información sobre intentos fallidos
- Indicador de bloqueo temporal
- Botón deshabilitado durante delays/bloqueos

## Flujo de Funcionamiento

### Intento de Login Fallido

1. Usuario intenta login con credenciales incorrectas
2. Sistema registra el intento fallido
3. Sistema verifica si debe aplicar delay o bloqueo
4. Si corresponde, se envía notificación por email
5. Se retorna error con información de rate limiting

### Intento de Login Exitoso

1. Usuario intenta login con credenciales correctas
2. Sistema limpia todos los intentos fallidos previos
3. Login procede normalmente

### Verificación de Rate Limit

1. Antes de procesar login, se verifica rate limit
2. Si está bloqueado, se retorna error 429 (Too Many Requests)
3. Si hay delay, se retorna error 429 con tiempo de espera
4. Si está permitido, se procesa el login

## Respuestas de Error

### Error 429 - Too Many Requests (con delay)

```json
{
  "error": "Demasiados intentos",
  "message": "Demasiados intentos fallidos. Por favor, espera X segundos antes de intentar nuevamente.",
  "retryAfter": 5
}
```

### Error 429 - Too Many Requests (bloqueado)

```json
{
  "error": "Cuenta temporalmente bloqueada",
  "message": "Demasiados intentos fallidos. Tu cuenta está bloqueada hasta HH:MM:SS. Por favor, intenta más tarde.",
  "retryAfter": 900,
  "blockedUntil": 1234567890000
}
```

### Error 401 - Credenciales Inválidas (con información de rate limiting)

```json
{
  "error": "Credenciales inválidas",
  "message": "Email o contraseña incorrectos",
  "attemptCount": 3,
  "retryAfter": 5
}
```

## Configuración

Los límites están configurados en `src/api/utils/rate-limit.ts`:

```typescript
const LIMITS = {
  DELAY_3_ATTEMPTS: 3,
  DELAY_5_ATTEMPTS: 5,
  BLOCK_10_ATTEMPTS: 10,
  
  DELAY_5_SECONDS: 5 * 1000,
  DELAY_30_SECONDS: 30 * 1000,
  BLOCK_15_MINUTES: 15 * 60 * 1000,
  
  RESET_WINDOW: 60 * 60 * 1000, // 1 hora
};
```

## Notificaciones por Email

### En Desarrollo

En desarrollo, las notificaciones se loguean en la consola:

```
[EMAIL NOTIFICATION] {
  to: 'user@example.com',
  attemptCount: 5,
  blocked: false,
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

### En Producción

En producción, se debe integrar con un servicio de email real:

1. **SendGrid**: Servicio de email transaccional
2. **AWS SES**: Amazon Simple Email Service
3. **Resend**: Servicio moderno de email
4. **Nodemailer**: Para SMTP directo

Ejemplo de integración (comentado en el código):

```typescript
const emailService = getEmailService();
await emailService.send({
  to: email,
  subject: '⚠️ Múltiples intentos de login fallidos',
  html: generateEmailTemplate(subject, body, attemptCount, blocked),
});
```

## Seguridad

### ✅ Protecciones Implementadas

1. **Delays progresivos**: Aumentan con cada intento fallido
2. **Bloqueo temporal**: Previene ataques de fuerza bruta
3. **Ventana de tiempo**: Resetea contador después de 1 hora
4. **Notificaciones**: Alerta al usuario sobre actividad sospechosa
5. **Limpieza automática**: Elimina intentos antiguos

### ⚠️ Consideraciones

1. **Almacenamiento**: Actualmente en memoria (no persiste entre reinicios)
   - **Solución**: Usar Redis o base de datos en producción
2. **IP vs Email**: Actualmente usa email como identificador
   - **Mejora**: Considerar usar IP + email para mayor seguridad
3. **Distributed Systems**: En arquitecturas distribuidas, usar almacenamiento compartido
4. **Email Service**: Integrar servicio de email real en producción

## Mejoras Futuras Recomendadas

1. **Almacenamiento persistente**: Migrar a Redis o base de datos
2. **Tracking por IP**: Agregar tracking por IP además de email
3. **Whitelist de IPs**: Permitir IPs confiables sin rate limiting
4. **Configuración dinámica**: Permitir ajustar límites sin reiniciar
5. **Métricas y monitoreo**: Agregar métricas de intentos fallidos
6. **Captcha**: Agregar CAPTCHA después de X intentos
7. **2FA**: Requerir autenticación de dos factores después de bloqueo

## Uso

El sistema funciona automáticamente. No se requiere código adicional:

```typescript
// El endpoint de login maneja todo automáticamente
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// Si hay rate limiting, retorna 429 con información
// Si no hay rate limiting, procesa el login normalmente
```

## Testing

Para probar el sistema:

1. **3 intentos fallidos**: Intentar login 3 veces con credenciales incorrectas
   - Debe mostrar delay de 5 segundos
2. **5 intentos fallidos**: Continuar hasta 5 intentos
   - Debe mostrar delay de 30 segundos
3. **10 intentos fallidos**: Continuar hasta 10 intentos
   - Debe bloquear por 15 minutos
4. **Login exitoso**: Después de bloqueo, usar credenciales correctas
   - Debe limpiar intentos y permitir login

## Troubleshooting

### "Demasiados intentos" pero no he intentado

**Causa**: Intentos previos desde la misma IP/email

**Solución**: Esperar 1 hora para que se resetee el contador

### No recibo emails de notificación

**Causa**: En desarrollo, solo se loguean en consola

**Solución**: Verificar logs del servidor o integrar servicio de email

### El bloqueo no expira

**Causa**: Bug en el cálculo de tiempo

**Solución**: Verificar que `blockedUntil` se calcula correctamente
