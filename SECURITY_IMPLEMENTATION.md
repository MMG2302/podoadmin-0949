# Implementación de Validación de Autorización en el Servidor

## Resumen

Se ha implementado un sistema completo de autenticación y autorización en el servidor que **nunca confía en datos del cliente** para decisiones de seguridad. Todas las validaciones se realizan en el servidor.

## Componentes Implementados

### 1. Sistema de Autenticación JWT (`src/api/utils/jwt.ts`)
- Generación de tokens JWT firmados
- Verificación de tokens en cada solicitud
- Extracción de tokens del header Authorization

### 2. Middleware de Autenticación (`src/api/middleware/auth.ts`)
- `authMiddleware`: Adjunta el usuario al contexto si hay token válido
- `requireAuth`: Rechaza solicitudes sin autenticación válida

### 3. Middleware de Autorización (`src/api/middleware/authorization.ts`)
- `requireRole(...roles)`: Requiere roles específicos
- `requirePermission(...permissions)`: Requiere permisos específicos
- `requireSameClinic()`: Verifica acceso a clínica
- `requireOwnershipOrPermission(permission)`: Verifica propiedad o permiso

### 4. Endpoints de Autenticación (`src/api/routes/auth.ts`)
- `POST /api/auth/login`: Autentica usuario y devuelve token
- `POST /api/auth/logout`: Cierra sesión
- `GET /api/auth/verify`: Verifica token y devuelve usuario

### 5. Endpoints Protegidos de Ejemplo
- `src/api/routes/users.ts`: Gestión de usuarios (requiere super_admin/admin)
- `src/api/routes/patients.ts`: Gestión de pacientes (requiere permisos específicos)

### 6. Cliente API (`src/web/lib/api-client.ts`)
- Cliente HTTP con manejo automático de cookies HTTP-only
- Renovación automática de tokens cuando expiran
- Reintento automático después de renovación
- Manejo de errores 401 con renovación transparente

### 7. Actualización del Contexto de Autenticación (`src/web/contexts/auth-context.tsx`)
- Login establece cookies HTTP-only automáticamente
- Verificación de sesión al cargar la aplicación
- Logout elimina cookies del servidor
- Sin manejo manual de tokens (todo automático)

## Seguridad Implementada

### ✅ Validación en el Servidor
- **Todas** las decisiones de autorización se toman en el servidor
- Los roles y permisos se validan en cada solicitud
- Los estados de cuenta (bloqueado/baneado) se verifican en cada solicitud

### ✅ Tokens JWT Seguros con Cookies HTTP-Only
- **Access tokens** (15 minutos) almacenados en cookies HTTP-only
- **Refresh tokens** (7 días) almacenados en cookies HTTP-only
- Cookies con flags `Secure` en producción (solo HTTPS)
- Cookies con `SameSite=Lax` para protección CSRF
- **Renovación automática** de tokens sin interrupciones
- Tokens no accesibles desde JavaScript (protección XSS)
- Verificación en cada solicitud

### ✅ Protección CSRF
- Tokens CSRF en todas las solicitudes que modifican estado (POST, PUT, PATCH, DELETE)
- Patrón double-submit cookie para máxima seguridad
- Cookies configuradas con `SameSite=Lax` para protección cross-site
- Validación automática en el servidor
- Cliente API maneja tokens CSRF automáticamente

### ✅ Rate Limiting Progresivo
- **3 intentos fallidos** → Retardo de 5 segundos
- **5 intentos fallidos** → Retardo de 30 segundos
- **10 intentos fallidos** → Bloqueo temporal de 15 minutos
- Notificaciones por email en puntos críticos (3, 5, 10+ intentos)
- Limpieza automática de intentos en login exitoso
- Ventana de tiempo de 1 hora para resetear contador

### ✅ Protección de Rutas
- Todas las rutas sensibles requieren `requireAuth()`
- Autorización basada en roles y permisos
- Validación de acceso a clínicas
- Protección CSRF en todas las operaciones que modifican estado

### ✅ Escapado HTML y Sanitización
- Escapado HTML en todos los inputs del servidor
- Sanitización de strings removiendo caracteres peligrosos
- Detección de payloads XSS comunes
- Validación con Zod que incluye transformaciones de escapado
- Middleware de sanitización aplicado globalmente

### ✅ Content Security Policy (CSP)
- Headers CSP configurados en todas las respuestas
- Meta tags CSP en HTML
- Headers de seguridad adicionales (X-Frame-Options, X-XSS-Protection, etc.)
- Política estricta en producción (sin unsafe-inline/unsafe-eval)

### ✅ Validación de Inputs con Zod
- Schemas de validación para todos los endpoints
- Validación de tipos y formatos
- Sanitización automática en transformaciones
- Rechazo de payloads XSS en validación

### ✅ Prepared Statements
- Drizzle ORM usa prepared statements automáticamente
- Todas las consultas protegidas contra SQL injection
- Sin consultas SQL crudas en el código

### ✅ Rate Limiting Mejorado
- Tracking por IP además de email
- Identificador combinado email:IP para mayor seguridad
- IP Whitelist para IPs confiables
- Bypass de rate limiting para IPs whitelisted

## Uso

### En el Servidor (Nuevas Rutas)

```typescript
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const routes = new Hono();
routes.use('*', requireAuth); // Requiere autenticación

routes.get('/', requirePermission('view_mi_recurso'), async (c) => {
  const user = c.get('user'); // Usuario autenticado
  // ...
});
```

### En el Cliente

```typescript
import { api } from '@/lib/api-client';

// Login
const response = await api.post('/auth/login', { email, password });
if (response.success) {
  // Token se guarda automáticamente
}

// Solicitudes protegidas
const patients = await api.get('/patients');
```

## Variables de Entorno

Ver `ENV_VARIABLES.md` para documentación completa.

**Variables Requeridas**:
```env
JWT_SECRET=tu-clave-secreta-para-access-tokens-minimo-32-caracteres
REFRESH_TOKEN_SECRET=tu-clave-secreta-para-refresh-tokens-minimo-32-caracteres
CSRF_SECRET=tu-clave-secreta-para-csrf-minimo-32-caracteres
```

**Variables Opcionales**:
```env
IP_WHITELIST=192.168.1.1,10.0.0.0/8  # IPs confiables (bypass rate limiting)
SENDGRID_API_KEY=...  # Para notificaciones por email
```

**IMPORTANTE**: 
- En producción, usar claves secretas fuertes y únicas para cada propósito
- **NUNCA** usar la misma clave para access y refresh tokens
- Generar claves con: `openssl rand -base64 32`

## Próximos Pasos Recomendados

1. ✅ **Migrar datos a base de datos**: Schemas y funciones de migración creados (ver `MIGRATION_GUIDE.md`)
2. **Implementar blacklist de tokens**: Para logout completo
3. ✅ **Migrar rate limiting a D1**: Implementado (ver `src/api/utils/rate-limit-d1.ts`)
4. ✅ **Integrar servicio de email real**: Implementado (Resend, SendGrid, AWS SES - ver `src/api/utils/email-service.ts`)
5. **Agregar logging de auditoría**: Registrar todas las acciones sensibles
6. **Agregar métricas y monitoreo**: Dashboard de seguridad
7. **Implementar CAPTCHA**: Después de X intentos fallidos
8. **Agregar 2FA**: Autenticación de dos factores

## Implementaciones Recientes

### ✅ Configuración de Variables de Entorno
- Script automático: `bun run setup:env`
- Genera claves secretas seguras
- Ver `ENV_VARIABLES.md` para detalles

### ✅ Pruebas de Payloads XSS
- Endpoint de prueba: `POST /api/test-xss`
- Lista de payloads: `GET /api/test-xss/payloads`
- Análisis detallado de seguridad
- Ver `src/api/tests/xss-payloads.test.md`

### ✅ Migración a Base de Datos D1
- Schemas completos: `src/api/database/schema.ts`
- Funciones de migración: `src/api/utils/migration.ts`
- Guía completa: `MIGRATION_GUIDE.md`

### ✅ Rate Limiting Persistente
- Implementación con D1: `src/api/utils/rate-limit-d1.ts`
- Persistencia de intentos fallidos
- Limpieza automática

### ✅ Servicio de Email Unificado
- Soporte para Resend, SendGrid, AWS SES
- Mock service para desarrollo
- Integrado con notificaciones de seguridad
- Ver `src/api/utils/email-service.ts`

## Archivos Creados/Modificados

### Nuevos Archivos
- `src/api/utils/jwt.ts` - Sistema de access y refresh tokens
- `src/api/utils/cookies.ts` - Utilidades para cookies HTTP-only
- `src/api/utils/rate-limit.ts` - Sistema de rate limiting progresivo
- `src/api/utils/email-notifications.ts` - Notificaciones por email
- `src/api/utils/sanitization.ts` - Utilidades de sanitización y escapado HTML
- `src/api/utils/validation.ts` - Schemas de validación con Zod
- `src/api/utils/ip-tracking.ts` - Utilidades para tracking de IPs
- `src/api/middleware/auth.ts`
- `src/api/middleware/authorization.ts`
- `src/api/middleware/csrf.ts` - Protección CSRF
- `src/api/middleware/csp.ts` - Content Security Policy
- `src/api/middleware/sanitization.ts` - Middleware de sanitización
- `src/api/middleware/rate-limit.ts` - Middleware de rate limiting
- `src/api/utils/csrf.ts` - Utilidades CSRF
- `src/api/routes/auth.ts` - Incluye endpoint de refresh y rate limiting
- `src/api/routes/users.ts` - Con validación y sanitización
- `src/api/routes/patients.ts` - Con validación y sanitización
- `src/api/routes/csrf.ts` - Endpoint para tokens CSRF
- `src/web/lib/api-client.ts` - Con renovación automática
- `src/api/README.md`
- `src/api/CSRF_IMPLEMENTATION.md` - Documentación CSRF
- `src/api/COOKIES_IMPLEMENTATION.md` - Documentación cookies HTTP-only
- `src/api/RATE_LIMITING.md` - Documentación rate limiting
- `src/api/SECURITY_CHECKLIST.md` - Checklist de seguridad
- `src/api/tests/xss-payloads.test.md` - Payloads XSS para probar
- `ENV_VARIABLES.md` - Documentación de variables de entorno
- `SECURITY_IMPLEMENTATION.md`

### Archivos Modificados
- `src/api/index.ts` - Agregados middlewares de seguridad (CSP, sanitización, CSRF)
- `src/api/routes/auth.ts` - Agregado rate limiting, validación, sanitización, tracking por IP
- `src/api/routes/users.ts` - Agregada validación con Zod y sanitización
- `src/api/routes/patients.ts` - Agregada validación con Zod y sanitización
- `src/web/contexts/auth-context.tsx` - Actualizado para usar API del servidor, obtener tokens CSRF y manejar rate limiting
- `src/web/lib/api-client.ts` - Agregado manejo automático de tokens CSRF
- `src/web/pages/login.tsx` - Agregada UI para mostrar información de rate limiting
- `index.html` - Agregados meta tags de seguridad (CSP, X-Frame-Options, etc.)

## Notas Importantes

⚠️ **NUNCA confíes en datos del cliente para decisiones de seguridad**

- Los roles y permisos se validan **siempre** en el servidor
- Los tokens JWT se verifican en **cada solicitud**
- Los tokens se almacenan en **cookies HTTP-only** (no accesibles desde JavaScript)
- Los tokens CSRF se validan en **cada solicitud que modifica estado**
- Los estados de cuenta se verifican en **cada solicitud**
- Las cookies están configuradas con **SameSite=Lax** y **Secure** (en producción)
- La renovación de tokens es **automática y transparente**
- El cliente solo muestra/oculta UI, pero el servidor es la fuente de verdad

## Protección CSRF

Todas las solicitudes que modifican estado (POST, PUT, PATCH, DELETE) están protegidas contra ataques CSRF usando el patrón double-submit cookie:

1. El servidor establece un token CSRF en una cookie con `SameSite=Lax`
2. El cliente envía el mismo token en el header `X-CSRF-Token`
3. El servidor valida que ambos tokens coincidan

**Excepciones**:
- `POST /api/auth/login`: No requiere CSRF (usuario aún no autenticado)
- Métodos seguros (GET, HEAD, OPTIONS): No requieren CSRF

Ver `src/api/CSRF_IMPLEMENTATION.md` para más detalles.

## Cookies HTTP-Only y Renovación Automática

Los tokens de sesión ahora se almacenan en **cookies HTTP-only** con flags Secure:

1. **Access tokens** (15 minutos) se almacenan en cookie `access-token`
2. **Refresh tokens** (7 días) se almacenan en cookie `refresh-token`
3. Las cookies son **HTTP-only** (no accesibles desde JavaScript)
4. Las cookies tienen flag **Secure** en producción (solo HTTPS)
5. **Renovación automática**: Si el access token expira, se renueva automáticamente usando el refresh token
6. El cliente no necesita manejar tokens manualmente

**Ventajas**:
- Protección contra XSS (JavaScript no puede leer cookies HTTP-only)
- Renovación automática sin interrupciones
- Tokens cortos minimizan riesgo de exposición
- Sin necesidad de manejo manual de tokens en el cliente

Ver `src/api/COOKIES_IMPLEMENTATION.md` para más detalles.

## Rate Limiting Progresivo

El sistema implementa límites progresivos para proteger contra ataques de fuerza bruta:

1. **3 intentos fallidos** → Retardo de 5 segundos
2. **5 intentos fallidos** → Retardo de 30 segundos
3. **10 intentos fallidos** → Bloqueo temporal de 15 minutos

**Características**:
- Tracking de intentos fallidos por email
- Delays progresivos que aumentan con cada intento
- Bloqueo temporal después de 10 intentos
- Notificaciones por email en puntos críticos
- Limpieza automática en login exitoso
- Ventana de tiempo de 1 hora para resetear contador

**UI**:
- Muestra mensajes de error con información de rate limiting
- Countdown timer para mostrar tiempo restante
- Botón deshabilitado durante delays/bloqueos
- Información sobre intentos fallidos y bloqueos

Ver `src/api/RATE_LIMITING.md` para más detalles.
