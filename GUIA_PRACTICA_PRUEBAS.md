# Guía Práctica de Pruebas de Seguridad

Esta guía te ayudará a probar todas las funcionalidades de seguridad implementadas paso a paso.

## 🔧 Preparación

### 1. Verificar que el servidor esté corriendo

```bash
bun run dev
```

### 2. Verificar que las migraciones estén aplicadas

Las tablas deberían estar creadas. Puedes verificar con:

```bash
bun run db:studio
```

Esto abrirá Drizzle Studio donde puedes ver todas las tablas.

## 📝 Prueba 1: Configurar CAPTCHA (Opcional)

### Paso 1: Elegir proveedor

**Opción recomendada: Cloudflare Turnstile (gratis y fácil)**

1. Ve a https://dash.cloudflare.com/
2. Inicia sesión o crea una cuenta
3. Navega a **Turnstile** en el menú lateral
4. Haz clic en **Add Site**
5. Completa el formulario:
   - **Site name**: PodoAdmin
   - **Domain**: localhost (para desarrollo) o tu dominio
   - **Widget mode**: Managed (recomendado)
6. Copia las claves generadas:
   - **Site Key** (pública)
   - **Secret Key** (privada)

### Paso 2: Configurar variables de entorno

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
CAPTCHA_PROVIDER=turnstile
CAPTCHA_SITE_KEY=tu-site-key-aqui
CAPTCHA_SECRET_KEY=tu-secret-key-aqui
```

### Paso 3: Reiniciar el servidor

```bash
# Detén el servidor (Ctrl+C) y reinícialo
bun run dev
```

### Paso 4: Probar CAPTCHA

1. Abre la aplicación en el navegador
2. Intenta hacer login con credenciales **incorrectas** 3 veces
3. En el 4to intento, deberías ver el widget de CAPTCHA
4. Completa el CAPTCHA y continúa

**Nota**: Si no configuras CAPTCHA, el sistema funcionará normalmente pero no mostrará CAPTCHA (el rate limiting seguirá funcionando).

## 🔒 Prueba 2: Configurar y Probar 2FA

### Paso 1: Iniciar sesión

1. Inicia sesión con un usuario (ej: super_admin)
2. Necesitarás estar autenticado para configurar 2FA

### Paso 2: Iniciar configuración de 2FA

**Opción A: Usando la API directamente (Postman/Thunder Client)**

```bash
POST http://localhost:5173/api/2fa/setup
Headers:
  Cookie: access-token=... (de tu sesión)
```

**Opción B: Usando curl**

```bash
curl -X POST http://localhost:5173/api/2fa/setup \
  -H "Cookie: access-token=TU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "otpauth://totp/PodoAdmin:admin@podoadmin.com?secret=JBSWY3DPEHPK3PXP&issuer=PodoAdmin",
  "message": "Escanea el código QR con tu aplicación de autenticación"
}
```

### Paso 3: Escanear código QR

1. Abre una aplicación de autenticación en tu teléfono:
   - **Google Authenticator** (iOS/Android)
   - **Microsoft Authenticator** (iOS/Android)
   - **Authy** (iOS/Android)
   - Cualquier app compatible con TOTP

2. Escanea el código QR desde la respuesta (o usa el `qrCodeUrl`)

3. La app generará un código de 6 dígitos que cambia cada 30 segundos

### Paso 4: Habilitar 2FA

Usa el código actual de tu app de autenticación:

```bash
POST http://localhost:5173/api/2fa/enable
Body:
{
  "secret": "JBSWY3DPEHPK3PXP",  // Del paso 2
  "verificationCode": "123456"   // Código actual de tu app
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "backupCodes": ["12345678", "87654321", "11223344", ...],
  "message": "2FA habilitado correctamente. Guarda los códigos de respaldo en un lugar seguro."
}
```

⚠️ **IMPORTANTE**: Guarda los `backupCodes` en un lugar seguro. Solo se muestran una vez.

### Paso 5: Verificar estado de 2FA

```bash
GET http://localhost:5173/api/2fa/status
Headers:
  Cookie: access-token=...
```

Debería retornar:
```json
{
  "success": true,
  "enabled": true
}
```

### Paso 6: Probar login con 2FA

1. Cierra sesión
2. Intenta hacer login normalmente
3. Deberías recibir:
   ```json
   {
     "error": "Código 2FA requerido",
     "message": "Por favor, ingresa el código de autenticación de dos factores",
     "requires2FA": true
   }
   ```
4. Ingresa el código de 6 dígitos de tu app de autenticación en el campo `twoFactorCode`
5. El login debería completarse exitosamente

### Paso 7: Probar con código de respaldo (opcional)

Si pierdes acceso a tu app de autenticación, puedes usar un código de respaldo:

1. Intenta hacer login
2. En lugar del código TOTP, usa uno de los `backupCodes` que guardaste
3. El login debería funcionar
4. **Nota**: Cada código de respaldo solo se puede usar una vez

## 📊 Prueba 3: Revisar Métricas de Seguridad

### Requisitos
- Debes estar autenticado como `super_admin`

### Paso 1: Ver estadísticas generales

```bash
GET http://localhost:5173/api/security-metrics/stats
Headers:
  Cookie: access-token=...
```

**Con filtro de tiempo:**
```bash
GET http://localhost:5173/api/security-metrics/stats?startTime=2024-01-01T00:00:00Z&endTime=2024-12-31T23:59:59Z
```

**Respuesta esperada:**
```json
{
  "success": true,
  "stats": {
    "failed_login": 5,
    "successful_login": 12,
    "blocked_user": 0,
    "2fa_used": 3,
    "captcha_shown": 2
  }
}
```

### Paso 2: Ver métricas por tipo

```bash
GET http://localhost:5173/api/security-metrics/by-type/failed_login?limit=100
```

**Otros tipos disponibles:**
- `successful_login`
- `blocked_user`
- `2fa_enabled`
- `2fa_used`
- `captcha_shown`
- `captcha_passed`
- etc.

### Paso 3: Ver métricas por rango de tiempo

```bash
GET http://localhost:5173/api/security-metrics/by-time-range?startTime=2024-01-01T00:00:00Z&endTime=2024-12-31T23:59:59Z&limit=500
```

### Paso 4: Generar algunas métricas

Para ver métricas en acción:

1. **Generar métricas de login:**
   - Intenta hacer login (exitoso o fallido)
   - Cada intento genera una métrica

2. **Generar métricas de 2FA:**
   - Usa 2FA en un login
   - Esto genera métricas `2fa_used`

3. **Generar métricas de bloqueo:**
   - Como super_admin, bloquea un usuario
   - Esto genera métricas `blocked_user`

4. **Verificar las métricas:**
   - Consulta los endpoints nuevamente
   - Deberías ver las nuevas métricas registradas

## 🔍 Prueba 4: Revisar Logs de Auditoría

### Requisitos
- Debes estar autenticado
- Para ver todos los logs: necesitas ser `super_admin`
- Para ver tus propios logs: cualquier usuario autenticado

### Paso 1: Ver tus propios logs

```bash
GET http://localhost:5173/api/audit-logs/user/TU_USER_ID?limit=100
Headers:
  Cookie: access-token=...
```

**Respuesta esperada:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "1234567890-abc123",
      "userId": "user_123",
      "action": "LOGIN_SUCCESS",
      "resourceType": "authentication",
      "resourceId": null,
      "details": {
        "email": "admin@podoadmin.com",
        "has2FA": true
      },
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "clinicId": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    ...
  ],
  "count": 10
}
```

### Paso 2: Ver logs por acción (solo super_admin)

```bash
GET http://localhost:5173/api/audit-logs/action/LOGIN_SUCCESS?limit=100
```

**Acciones disponibles:**
- `LOGIN_SUCCESS`
- `LOGIN_FAILED`
- `LOGOUT`
- `CREATE_USER`
- `UPDATE_USER`
- `DELETE_USER`
- `BLOCK_USER`
- `UNBLOCK_USER`
- `BAN_USER`
- `2FA_ENABLED`
- `2FA_DISABLED`
- `2FA_SETUP_INITIATED`

### Paso 3: Ver todos los logs (solo super_admin)

```bash
GET http://localhost:5173/api/audit-logs/all?limit=500
```

### Paso 4: Generar algunos logs

Para ver logs en acción:

1. **Generar log de login:**
   - Inicia sesión
   - Debería aparecer un log `LOGIN_SUCCESS`

2. **Generar log de creación de usuario:**
   - Como super_admin, crea un nuevo usuario
   - Debería aparecer un log `CREATE_USER`

3. **Generar log de bloqueo:**
   - Como super_admin, bloquea un usuario
   - Debería aparecer un log `BLOCK_USER`

4. **Generar log de 2FA:**
   - Habilita 2FA
   - Debería aparecer un log `2FA_ENABLED`

5. **Verificar los logs:**
   - Consulta los endpoints nuevamente
   - Deberías ver los nuevos logs registrados

## 🧪 Prueba 5: Probar Blacklist de Tokens

### Paso 1: Obtener un token válido

1. Inicia sesión
2. El token se almacena en la cookie `access-token`

### Paso 2: Hacer logout

```bash
POST http://localhost:5173/api/auth/logout
Headers:
  Cookie: access-token=...
```

### Paso 3: Intentar usar el token anterior

1. Intenta hacer una solicitud autenticada con el token anterior
2. Debería ser rechazado con error 401
3. El token está en la blacklist y ya no es válido

**Ejemplo:**
```bash
GET http://localhost:5173/api/auth/verify
Headers:
  Cookie: access-token=TOKEN_ANTERIOR
```

Debería retornar:
```json
{
  "error": "No autorizado",
  "message": "Se requiere autenticación"
}
```

## 📋 Checklist de Pruebas

Usa este checklist para asegurarte de probar todo:

### CAPTCHA
- [ ] Configurar variables de entorno
- [ ] Probar que aparece después de 3 intentos fallidos
- [ ] Probar que el login funciona después de completar CAPTCHA

### 2FA
- [ ] Iniciar configuración (`/api/2fa/setup`)
- [ ] Escanear código QR con app de autenticación
- [ ] Habilitar 2FA (`/api/2fa/enable`)
- [ ] Verificar estado (`/api/2fa/status`)
- [ ] Probar login con código TOTP
- [ ] Probar login con código de respaldo
- [ ] Deshabilitar 2FA (`/api/2fa/disable`)

### Métricas
- [ ] Ver estadísticas generales
- [ ] Ver métricas por tipo
- [ ] Ver métricas por rango de tiempo
- [ ] Generar algunas métricas y verificar que se registren

### Logs de Auditoría
- [ ] Ver logs propios
- [ ] Ver logs por acción (como super_admin)
- [ ] Ver todos los logs (como super_admin)
- [ ] Generar algunos logs y verificar que se registren

### Blacklist de Tokens
- [ ] Obtener token válido
- [ ] Hacer logout
- [ ] Verificar que el token anterior ya no funciona

## 🐛 Solución de Problemas

### Error: "CAPTCHA no configurado"
- Verifica que las variables de entorno estén configuradas
- Reinicia el servidor después de cambiar variables de entorno

### Error: "2FA ya está habilitado"
- El usuario ya tiene 2FA configurado
- Usa `/api/2fa/status` para verificar
- Usa `/api/2fa/disable` para deshabilitar primero

### Error: "Código 2FA inválido"
- Asegúrate de usar el código actual (cambia cada 30 segundos)
- Verifica que el reloj de tu dispositivo esté sincronizado
- Intenta esperar al siguiente código

### Error: "No autorizado" en métricas/logs
- Verifica que estés autenticado
- Para ver todos los logs/métricas, necesitas ser `super_admin`
- Verifica que el token no haya expirado

### No se registran métricas/logs
- Verifica que la base de datos esté funcionando
- Revisa la consola del servidor para errores
- Verifica que las migraciones estén aplicadas

## 🎉 ¡Listo!

Una vez que hayas completado todas las pruebas, tendrás:

- ✅ CAPTCHA configurado y funcionando
- ✅ 2FA configurado y probado
- ✅ Métricas de seguridad siendo registradas
- ✅ Logs de auditoría funcionando
- ✅ Blacklist de tokens funcionando

¡Tu sistema de seguridad está completamente operativo! 🚀
