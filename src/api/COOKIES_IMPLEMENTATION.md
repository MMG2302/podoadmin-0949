# Implementación de Cookies HTTP-Only con Renovación Automática

## Resumen

Se ha migrado el sistema de autenticación de almacenamiento en `localStorage` a **cookies HTTP-only con flags Secure**, implementando también un sistema de **refresh tokens** con renovación automática.

## Cambios Principales

### Antes (localStorage)
- ❌ Tokens almacenados en `localStorage` (accesibles desde JavaScript)
- ❌ Vulnerable a XSS (JavaScript puede leer tokens)
- ❌ Tokens expiraban después de 24 horas sin renovación
- ❌ Cliente manejaba tokens manualmente

### Ahora (Cookies HTTP-Only)
- ✅ Tokens almacenados en cookies HTTP-only (no accesibles desde JavaScript)
- ✅ Protección contra XSS (JavaScript no puede leer cookies HTTP-only)
- ✅ Flags Secure en producción (solo HTTPS)
- ✅ Sistema de refresh tokens con renovación automática
- ✅ Access tokens cortos (15 minutos) + Refresh tokens largos (7 días)

## Arquitectura

### Sistema de Tokens Dual

1. **Access Token** (corto, 15 minutos)
   - Almacenado en cookie `access-token` (HTTP-only)
   - Se usa para autenticar solicitudes
   - Expira rápidamente para minimizar riesgo

2. **Refresh Token** (largo, 7 días)
   - Almacenado en cookie `refresh-token` (HTTP-only)
   - Se usa para renovar access tokens
   - Expira después de 7 días de inactividad

### Flujo de Autenticación

1. **Login**:
   - Usuario envía credenciales
   - Servidor valida y genera par de tokens
   - Servidor establece cookies HTTP-only
   - Cliente recibe información del usuario (no tokens)

2. **Solicitudes Autenticadas**:
   - Cliente envía solicitud con `credentials: 'include'`
   - Navegador envía cookies automáticamente
   - Servidor lee access token de cookie
   - Si expiró, cliente renueva automáticamente

3. **Renovación Automática**:
   - Si access token expira (401), cliente detecta
   - Cliente llama a `/api/auth/refresh` con refresh token
   - Servidor valida refresh token y genera nuevo par
   - Cliente reintenta solicitud original

4. **Logout**:
   - Cliente llama a `/api/auth/logout`
   - Servidor elimina cookies estableciendo cookies vacías
   - Cliente limpia estado local

## Componentes Implementados

### 1. Sistema de Tokens (`src/api/utils/jwt.ts`)

- `generateAccessToken()`: Genera access token (15 minutos)
- `generateRefreshToken()`: Genera refresh token (7 días)
- `generateTokenPair()`: Genera ambos tokens
- `verifyAccessToken()`: Verifica access token
- `verifyRefreshToken()`: Verifica refresh token

### 2. Utilidades de Cookies (`src/api/utils/cookies.ts`)

- `formatCookie()`: Formatea cookies con opciones de seguridad
- `extractCookie()`: Extrae valores de cookies
- `getAccessTokenCookieOptions()`: Opciones para access token
- `getRefreshTokenCookieOptions()`: Opciones para refresh token
- `createDeleteCookie()`: Crea cookie de eliminación
- `isProduction()`: Detecta si estamos en producción

### 3. Middleware de Autenticación (`src/api/middleware/auth.ts`)

- Lee tokens de cookies HTTP-only (prioridad)
- Fallback a header Authorization (compatibilidad)
- Valida access tokens automáticamente

### 4. Endpoints de Autenticación (`src/api/routes/auth.ts`)

- `POST /api/auth/login`: Establece cookies con tokens
- `POST /api/auth/logout`: Elimina cookies
- `POST /api/auth/refresh`: Renueva tokens
- `GET /api/auth/verify`: Verifica sesión

### 5. Cliente API (`src/web/lib/api-client.ts`)

- Manejo automático de cookies (no requiere código adicional)
- Renovación automática cuando access token expira
- Reintento automático después de renovación
- Manejo de errores de autenticación

## Configuración de Cookies

### Access Token Cookie
```typescript
{
  httpOnly: true,        // No accesible desde JavaScript
  secure: isProduction,  // Solo HTTPS en producción
  sameSite: 'Lax',      // Protección CSRF
  path: '/',
  maxAge: 15 * 60,      // 15 minutos
}
```

### Refresh Token Cookie
```typescript
{
  httpOnly: true,        // No accesible desde JavaScript
  secure: isProduction,  // Solo HTTPS en producción
  sameSite: 'Lax',      // Protección CSRF
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 días
}
```

## Seguridad

### ✅ Protecciones Implementadas

1. **HTTP-Only**: Cookies no accesibles desde JavaScript (protección XSS)
2. **Secure Flag**: Solo HTTPS en producción
3. **SameSite=Lax**: Protección CSRF
4. **Tokens Cortos**: Access tokens expiran en 15 minutos
5. **Renovación Automática**: Sin interrupciones para el usuario
6. **Validación en Servidor**: Todos los tokens se validan en el servidor

### ⚠️ Consideraciones

1. **CORS**: Debe configurarse `credentials: true` en CORS
2. **HTTPS en Producción**: Secure flag requiere HTTPS
3. **Dominio de Cookies**: Por defecto, cookies son del dominio actual
4. **Subdominios**: Si necesitas compartir cookies entre subdominios, configurar `domain`

## Uso

### En el Cliente

El cliente no necesita manejar tokens manualmente:

```typescript
import { api } from '@/lib/api-client';

// Login - los tokens se establecen automáticamente en cookies
const response = await api.post('/auth/login', { email, password });

// Solicitudes autenticadas - cookies se envían automáticamente
const patients = await api.get('/patients');

// Renovación automática - ocurre transparentemente si el token expira
const users = await api.get('/users'); // Si expiró, se renueva y reintenta
```

### En el Servidor

Los tokens se leen automáticamente de cookies:

```typescript
// El middleware lee automáticamente de cookies
app.use('*', authMiddleware);

// En las rutas, el usuario está disponible
app.get('/protected', requireAuth, async (c) => {
  const user = c.get('user'); // Usuario autenticado
  // ...
});
```

## Variables de Entorno

Agregar a `.env`:

```env
JWT_SECRET=tu-clave-secreta-para-access-tokens-minimo-32-caracteres
REFRESH_TOKEN_SECRET=tu-clave-secreta-para-refresh-tokens-minimo-32-caracteres
```

**IMPORTANTE**: Usar claves diferentes para access y refresh tokens.

## Migración desde localStorage

### Cambios en el Código

1. **Eliminado**: `localStorage.getItem('podoadmin_token')`
2. **Eliminado**: `localStorage.setItem('podoadmin_token', token)`
3. **Eliminado**: `setAuthToken()` y `removeAuthToken()` del cliente
4. **Agregado**: Manejo automático de cookies
5. **Agregado**: Renovación automática de tokens

### Compatibilidad

- El sistema mantiene compatibilidad con header `Authorization` (fallback)
- La información del usuario sigue en `localStorage` (solo datos, no tokens)
- Las cookies se establecen automáticamente en login

## Troubleshooting

### Error: "Cookies no se establecen"

**Causa**: Configuración de CORS o dominio

**Solución**:
1. Verificar que `credentials: true` está en CORS
2. Verificar que `credentials: 'include'` está en fetch
3. Verificar que el dominio es el mismo

### Error: "Token expirado" constante

**Causa**: Refresh token también expiró o no se renueva correctamente

**Solución**:
1. Verificar que refresh token no ha expirado (7 días)
2. Verificar que el endpoint `/api/auth/refresh` funciona
3. Verificar que las cookies se están enviando

### Error: "No autorizado" después de login

**Causa**: Cookies no se están leyendo correctamente

**Solución**:
1. Verificar que las cookies se establecieron (DevTools > Application > Cookies)
2. Verificar que `credentials: 'include'` está en todas las solicitudes
3. Verificar que el middleware lee de cookies correctamente

## Próximos Pasos Recomendados

1. **Blacklist de tokens**: Implementar blacklist para tokens revocados
2. **Rotación de refresh tokens**: Rotar refresh tokens en cada renovación
3. **Monitoreo**: Monitorear intentos de renovación fallidos
4. **Rate limiting**: Agregar rate limiting al endpoint de refresh
5. **Logging**: Registrar renovaciones de tokens para auditoría

## Referencias

- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [HTTP-Only Cookies](https://owasp.org/www-community/HttpOnly)
- [Refresh Token Pattern](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
