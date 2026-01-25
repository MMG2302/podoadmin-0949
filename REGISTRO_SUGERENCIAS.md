# Sugerencias para Sistema de Registro

## Estado Actual

Actualmente, el sistema **no tiene registro público**. Los usuarios solo pueden ser creados por un `super_admin` a través de la interfaz de administración.

## Recomendaciones de Seguridad para Registro Público

Si decides implementar registro público en el futuro, aquí están las recomendaciones de seguridad:

### 1. Validación de Contraseñas Fuertes

```typescript
// Schema de validación sugerido
export const registerSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255)
    .transform((val) => sanitizeEmail(val) || val),
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial')
    .max(128),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100)
    .transform((val) => escapeHtml(val)),
  // Campos adicionales según necesidad
});
```

### 2. Rate Limiting en Registro

- **Límite**: Máximo 3 registros por IP por hora
- **Bloqueo**: Después de 5 intentos fallidos, bloquear IP por 24 horas
- **Tracking**: Registrar todos los intentos de registro (exitosos y fallidos)

### 3. Verificación de Email

- **Requerir verificación de email** antes de activar la cuenta
- Enviar email con token de verificación (válido por 24 horas)
- Token único, no reutilizable
- Registrar intentos de verificación

### 4. CAPTCHA en Registro

- **Siempre requerir CAPTCHA** en el formulario de registro
- Verificar CAPTCHA antes de procesar cualquier dato
- Usar reCAPTCHA v3 o Cloudflare Turnstile

### 5. Prevención de Cuentas Duplicadas

- Verificar que el email no esté ya registrado
- No revelar si un email existe o no (mensaje genérico)
- Registrar intentos de registro con emails existentes

### 6. Validación de Dominios de Email

- Opcional: Permitir solo ciertos dominios de email
- Bloquear dominios temporales/descartables (10minutemail, etc.)
- Validar formato de email estricto

### 7. Hashing de Contraseñas

- **NUNCA** almacenar contraseñas en texto plano
- Usar `bcrypt` o `argon2` con salt
- Cost factor mínimo de 10 (recomendado 12+)

### 8. Logging de Auditoría

- Registrar todos los registros exitosos
- Registrar todos los intentos fallidos
- Incluir IP, User-Agent, timestamp
- Alertar sobre patrones sospechosos (múltiples registros desde misma IP)

### 9. Confirmación de Términos y Condiciones

- Requerir aceptación explícita de términos
- Almacenar timestamp de aceptación
- Registrar en audit log

### 10. Activación Manual (Opcional)

- Para sistemas médicos, considerar activación manual por administrador
- Usuario recibe email de "registro pendiente"
- Administrador revisa y aprueba/rechaza

## Implementación Sugerida

### Endpoint de Registro

```typescript
POST /api/auth/register
```

**Flujo sugerido:**

1. Validar datos de entrada (schema + sanitización)
2. Verificar CAPTCHA
3. Verificar rate limiting
4. Verificar que email no existe
5. Hash de contraseña
6. Crear usuario con estado `pending_verification`
7. Generar token de verificación
8. Enviar email de verificación
9. Registrar en audit log
10. Retornar éxito (sin revelar si email existe)

### Endpoint de Verificación

```typescript
POST /api/auth/verify-email
```

**Flujo sugerido:**

1. Validar token de verificación
2. Verificar que no haya expirado (24 horas)
3. Activar cuenta (cambiar estado a `active`)
4. Invalidar token (usado una vez)
5. Registrar en audit log
6. Opcional: Auto-login después de verificación

### Variables de Entorno Necesarias

```env
# CAPTCHA
CAPTCHA_PROVIDER=recaptcha|hcaptcha|turnstile
CAPTCHA_SITE_KEY=...
CAPTCHA_SECRET_KEY=...

# Email (ya implementado)
SENDGRID_API_KEY=...
# o
RESEND_API_KEY=...

# Rate limiting (ya implementado)
RATE_LIMIT_ENABLED=true
```

## Consideraciones Adicionales

### Para Sistemas Médicos

1. **Verificación de Identidad**: Considerar verificación de documentos profesionales
2. **Aprobación Manual**: Todos los registros requieren aprobación de super_admin
3. **Validación de Cédula Profesional**: Si aplica
4. **Asociación con Clínica**: Requerir código de clínica válido

### Mejoras Futuras

1. **Registro con Invitación**: Solo usuarios con código de invitación pueden registrarse
2. **Registro por Roles**: Diferentes flujos según tipo de usuario (podiatrist vs admin)
3. **Registro Multi-paso**: Formulario progresivo con validación en cada paso
4. **Biometría**: Para dispositivos móviles (Face ID, Touch ID)

## Ejemplo de Implementación

Ver `src/api/routes/auth.ts` para referencia del login actual. El registro seguiría un patrón similar pero con:

- Validación más estricta
- CAPTCHA obligatorio
- Verificación de email
- Rate limiting más agresivo
- Logging completo

## Conclusión

Para un sistema médico como PodoAdmin, **recomiendo mantener el registro solo para super_admin** por ahora, ya que:

1. Mayor control sobre quién accede al sistema
2. Mejor seguridad (no exposición pública)
3. Validación manual de credenciales profesionales
4. Menor riesgo de spam/ataques

Si en el futuro necesitas registro público, implementa todas las medidas de seguridad mencionadas arriba.
