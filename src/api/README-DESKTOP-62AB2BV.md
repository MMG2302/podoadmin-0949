# Sistema de Autenticación y Autorización del Servidor

Este documento describe el sistema de autenticación y autorización implementado en el servidor. **Nunca confíes en datos del cliente para decisiones de seguridad.**

## Arquitectura

### 1. Autenticación (¿Quién eres?)

El sistema usa **JWT (JSON Web Tokens)** para autenticación:

- Los tokens se generan en el servidor después de un login exitoso
- Los tokens incluyen información del usuario (userId, email, role, clinicId)
- Los tokens expiran después de 24 horas
- El cliente envía el token en el header `Authorization: Bearer <token>`

### 2. Autorización (¿Qué puedes hacer?)

El sistema usa **middlewares de autorización** basados en:

- **Roles**: `super_admin`, `clinic_admin`, `admin`, `podiatrist`
- **Permisos**: Lista de permisos específicos por rol

## Middlewares Disponibles

### `authMiddleware`
Adjunta el usuario al contexto si hay un token válido. **No protege rutas**, solo proporciona información.

```typescript
import { authMiddleware } from './middleware/auth';
app.use('*', authMiddleware);
```

### `requireAuth`
**Rechaza solicitudes sin token válido**. Debe usarse en todas las rutas protegidas.

```typescript
import { requireAuth } from './middleware/auth';

app.get('/protected', requireAuth, async (c) => {
  const user = c.get('user'); // Usuario autenticado
  // ...
});
```

### `requireRole(...roles)`
Requiere que el usuario tenga uno de los roles especificados.

```typescript
import { requireRole } from './middleware/authorization';

// Solo super_admin puede acceder
app.delete('/users/:id', requireRole('super_admin'), async (c) => {
  // ...
});

// super_admin o admin pueden acceder
app.get('/users', requireRole('super_admin', 'admin'), async (c) => {
  // ...
});
```

### `requirePermission(...permissions)`
Requiere que el usuario tenga uno de los permisos especificados.

```typescript
import { requirePermission } from './middleware/authorization';

app.get('/patients', requirePermission('view_patients'), async (c) => {
  // ...
});

app.post('/patients', requirePermission('manage_patients'), async (c) => {
  // ...
});
```

### `requireSameClinic()`
Verifica que el usuario pertenece a la misma clínica que el recurso solicitado.

```typescript
import { requireSameClinic } from './middleware/authorization';

app.get('/clinic/:clinicId/stats', requireSameClinic(), async (c) => {
  // ...
});
```

### `requireOwnershipOrPermission(permission)`
Permite acceso si el usuario es el propietario del recurso O tiene el permiso especificado.

```typescript
import { requireOwnershipOrPermission } from './middleware/authorization';

app.get('/profile/:userId', requireOwnershipOrPermission('view_users'), async (c) => {
  // ...
});
```

## Ejemplo de Ruta Protegida

```typescript
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const routes = new Hono();

// Todas las rutas requieren autenticación
routes.use('*', requireAuth);

// Ver pacientes - requiere permiso
routes.get('/', requirePermission('view_patients'), async (c) => {
  const user = c.get('user');
  // Lógica de negocio...
  return c.json({ success: true, patients: [] });
});

// Crear paciente - requiere permiso diferente
routes.post('/', requirePermission('manage_patients'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  // Validar y crear paciente...
  return c.json({ success: true, patient: {} });
});

export default routes;
```

## Roles y Permisos

### super_admin
- Acceso completo a la plataforma
- Gestión de usuarios, créditos, configuración
- **NO** tiene acceso a pacientes o sesiones clínicas

### clinic_admin
- Gestión de podólogos de su clínica
- Visualización de pacientes y sesiones
- Reasignación de pacientes
- **NO** puede crear/editar sesiones clínicas

### admin (Soporte)
- Ajuste limitado de créditos
- Visualización de usuarios y créditos

### podiatrist
- Gestión completa de pacientes
- Creación y edición de sesiones clínicas
- Impresión de documentos

## Seguridad

### ✅ Buenas Prácticas Implementadas

1. **Validación en el servidor**: Todas las decisiones de autorización se toman en el servidor
2. **Tokens JWT firmados**: Los tokens están firmados con una clave secreta
3. **Expiración de tokens**: Los tokens expiran después de 24 horas
4. **Verificación de estados**: Se verifica si la cuenta está bloqueada/baneada en cada solicitud
5. **Validación de clínica**: Los usuarios solo pueden acceder a recursos de su clínica

### ⚠️ Consideraciones

1. **JWT_SECRET**: Debe estar en variables de entorno en producción
2. **Blacklist de tokens**: Para logout completo, considerar implementar una blacklist
3. **Rate limiting**: Considerar agregar rate limiting para prevenir ataques
4. **HTTPS**: Siempre usar HTTPS en producción
5. **Validación de datos**: Validar todos los datos de entrada

## Uso en el Cliente

El cliente debe:

1. **Almacenar el token**: Guardar el token JWT después del login
2. **Enviar en headers**: Incluir `Authorization: Bearer <token>` en todas las solicitudes
3. **Manejar 401**: Si recibe 401, limpiar el token y redirigir al login
4. **Verificar token**: Verificar el token al cargar la aplicación

Ver `src/web/lib/api-client.ts` para el cliente API implementado.

## Endpoints de Autenticación

### POST `/api/auth/login`
Autentica un usuario y devuelve un token JWT.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_001",
    "email": "user@example.com",
    "name": "Usuario",
    "role": "podiatrist",
    "clinicId": "clinic_001"
  }
}
```

### GET `/api/auth/verify`
Verifica si el token es válido y devuelve información del usuario.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_001",
    "email": "user@example.com",
    "name": "Usuario",
    "role": "podiatrist",
    "clinicId": "clinic_001"
  }
}
```

### POST `/api/auth/logout`
Cierra la sesión (en una implementación completa, invalidaría el token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Sesión cerrada correctamente"
}
```

## Agregar Nuevas Rutas Protegidas

1. Crear archivo de rutas en `src/api/routes/`
2. Importar middlewares necesarios
3. Aplicar `requireAuth` a todas las rutas
4. Aplicar `requireRole` o `requirePermission` según corresponda
5. Registrar la ruta en `src/api/index.ts`

```typescript
// src/api/routes/mi-recurso.ts
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const routes = new Hono();
routes.use('*', requireAuth);

routes.get('/', requirePermission('view_mi_recurso'), async (c) => {
  // ...
});

export default routes;
```

```typescript
// src/api/index.ts
import miRecursoRoutes from './routes/mi-recurso';
app.route('/mi-recurso', miRecursoRoutes);
```
