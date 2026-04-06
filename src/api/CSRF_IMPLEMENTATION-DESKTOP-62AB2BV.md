# Implementación de Protección CSRF

## Resumen

Se ha implementado protección CSRF (Cross-Site Request Forgery) en todas las solicitudes que modifican estado (POST, PUT, PATCH, DELETE) usando el patrón **double-submit cookie**.

## Arquitectura

### Patrón Double-Submit Cookie

1. **Token en Cookie**: El servidor establece un token CSRF en una cookie (`csrf-token`)
2. **Token en Header**: El cliente envía el mismo token en el header `X-CSRF-Token`
3. **Validación**: El servidor verifica que ambos tokens coincidan

### ¿Por qué Double-Submit Cookie?

- **Seguridad**: Un atacante no puede leer cookies debido a la política Same-Origin
- **Simplicidad**: No requiere almacenamiento en el servidor
- **Escalabilidad**: Funciona bien en arquitecturas distribuidas

## Componentes Implementados

### 1. Utilidades CSRF (`src/api/utils/csrf.ts`)

- `generateCsrfToken()`: Genera tokens CSRF seguros usando Web Crypto API
- `validateCsrfToken()`: Valida tokens CSRF
- `formatCookie()`: Formatea cookies con opciones de seguridad
- `getCsrfCookieOptions()`: Genera opciones de cookie con SameSite=Lax

### 2. Middleware CSRF (`src/api/middleware/csrf.ts`)

- `csrfProtection`: Valida tokens CSRF en todas las solicitudes que modifican estado
- `optionalCsrfProtection`: Validación opcional de CSRF

### 3. Endpoint CSRF (`src/api/routes/csrf.ts`)

- `GET /api/csrf/token`: Genera y devuelve un token CSRF
  - Establece el token como cookie con `SameSite=Lax`
  - Devuelve el token en el body de la respuesta

### 4. Cliente API (`src/web/lib/api-client.ts`)

- Obtiene automáticamente tokens CSRF cuando es necesario
- Incluye el token en el header `X-CSRF-Token` para solicitudes que modifican estado
- Reintenta automáticamente si el token CSRF expira

## Configuración de Cookies

Las cookies CSRF se configuran con:

```typescript
{
  httpOnly: false,        // JavaScript puede leerlo (necesario para double-submit)
  secure: isProduction,  // Solo HTTPS en producción
  sameSite: 'Lax',       // Protección CSRF con flexibilidad
  path: '/',
  maxAge: 60 * 60 * 24, // 24 horas
}
```

### SameSite=Lax vs SameSite=Strict

- **Lax** (implementado): Permite que la cookie se envíe en navegación top-level (ej: click en link)
- **Strict**: Solo envía cookies en solicitudes del mismo sitio

Se usa `Lax` porque:
- Proporciona buena protección CSRF
- Mantiene funcionalidad para navegación normal
- Es más compatible con diferentes flujos de autenticación

## Uso

### En el Servidor

El middleware CSRF se aplica automáticamente a todas las rutas:

```typescript
// En src/api/index.ts
app.use('*', async (c, next) => {
  // Excluir login de protección CSRF
  if (c.req.path === '/api/auth/login' && c.req.method === 'POST') {
    return next();
  }
  return csrfProtection(c, next);
});
```

**Excepciones**:
- `POST /api/auth/login`: No requiere CSRF (usuario aún no autenticado)
- Métodos seguros (GET, HEAD, OPTIONS): No requieren CSRF

### En el Cliente

El cliente API maneja CSRF automáticamente:

```typescript
import { api } from '@/lib/api-client';

// El token CSRF se obtiene y envía automáticamente
const response = await api.post('/patients', { name: 'John' });
```

**Flujo automático**:
1. Cliente detecta que necesita CSRF (método POST/PUT/PATCH/DELETE)
2. Obtiene token CSRF de la cookie o solicita uno nuevo
3. Incluye el token en el header `X-CSRF-Token`
4. Si el token expira, obtiene uno nuevo y reintenta

### Obtener Token CSRF Manualmente

```typescript
import { api } from '@/lib/api-client';

// Obtener token CSRF
const response = await api.get('/csrf/token');
// El token se establece como cookie automáticamente
// También está disponible en response.data.token
```

## Seguridad

### ✅ Protecciones Implementadas

1. **Validación de tokens**: Los tokens se validan en cada solicitud
2. **Coincidencia cookie-header**: Se verifica que ambos tokens coincidan
3. **Formato de token**: Los tokens tienen formato y hash válidos
4. **SameSite cookies**: Previene envío de cookies en solicitudes cross-site
5. **Secure cookies en producción**: Solo HTTPS en producción

### ⚠️ Consideraciones

1. **httpOnly=false**: Necesario para double-submit cookie, pero JavaScript puede leerlo
   - Mitigado por: SameSite=Lax y validación en servidor
2. **Token en localStorage**: No se almacena en localStorage, solo en cookie
3. **Expiración**: Tokens expiran después de 24 horas
4. **Regeneración**: Los tokens se regeneran al obtener uno nuevo

## Excepciones

### Rutas que NO requieren CSRF

- `GET /api/ping`: Ruta pública de prueba
- `GET /api/csrf/token`: Endpoint para obtener tokens
- `POST /api/auth/login`: Login público (usuario no autenticado)
- Métodos seguros: GET, HEAD, OPTIONS

### Rutas que SÍ requieren CSRF

- `POST /api/auth/logout`: Cerrar sesión
- `POST /api/users`: Crear usuario
- `PUT /api/users/:id`: Actualizar usuario
- `DELETE /api/users/:id`: Eliminar usuario
- Todas las demás rutas POST, PUT, PATCH, DELETE

## Troubleshooting

### Error: "Token CSRF faltante"

**Causa**: El cliente no está enviando el token CSRF

**Solución**:
1. Verificar que el cliente está obteniendo el token: `GET /api/csrf/token`
2. Verificar que la cookie `csrf-token` está presente
3. Verificar que el header `X-CSRF-Token` se está enviando

### Error: "Token CSRF inválido"

**Causa**: El token no coincide o es inválido

**Solución**:
1. Obtener un nuevo token: `GET /api/csrf/token`
2. Verificar que el token en la cookie coincide con el del header
3. Verificar que el token no ha expirado

### Cookie no se establece

**Causa**: Configuración de CORS o cookies

**Solución**:
1. Verificar que `credentials: 'include'` está en las solicitudes fetch
2. Verificar configuración de CORS en el servidor
3. Verificar que el dominio es el mismo (o configurar dominio en cookie)

## Variables de Entorno

Agregar a `.env`:

```env
CSRF_SECRET=tu-clave-secreta-para-csrf-minimo-32-caracteres
```

**IMPORTANTE**: En producción, usar una clave secreta fuerte y única.

## Próximos Pasos Recomendados

1. **Rotación de tokens**: Considerar rotar tokens periódicamente
2. **Rate limiting**: Agregar rate limiting al endpoint de tokens CSRF
3. **Monitoreo**: Monitorear intentos de CSRF fallidos
4. **Tokens por sesión**: Considerar tokens únicos por sesión de usuario

## Referencias

- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double-Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
