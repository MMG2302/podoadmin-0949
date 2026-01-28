# Análisis: sistemas en local y migración a base de datos

Análisis del repositorio para identificar **qué sistemas siguen usando almacenamiento local** (localStorage, memoria del servidor, etc.) y **qué debe migrarse a la base de datos por seguridad y alineado con la finalidad del sistema** (gestión clínica podológica).

---

## 1. Resumen ejecutivo

| Sistema | Ubicación actual | ¿En DB? | Prioridad migración | Motivo |
|--------|-------------------|---------|----------------------|--------|
| Rate limiting de login | Memoria (`Map`) en API | No | **Alta** | No persiste entre reinicios ni entre Workers; ya existe implementación D1 sin usar. |
| Usuarios (created users) en API | `storage` → localStorage/memoria en servidor | Parcial (tabla existe) | **Alta** | Auth, users y 2FA usan `getCreatedUsers`/`getAllUsersWithCredentials` desde storage; en servidor eso es memoria vacía. |
| Pacientes y sesiones en frontend | localStorage + API | API ya en D1 | **Alta** | Muchas pantallas siguen leyendo/escribiendo en storage; debe ser API como única fuente. |
| Ajustes de admin (créditos) | localStorage en frontend | No | **Media** | Auditoría de ajustes debería estar en DB (audit_log o tabla específica). |
| Usuario actual (`podoadmin_user`) | localStorage | N/A | Baja | Solo caché de perfil; autorización ya se hace por token. |
| Rate limiting de registro | D1 | Sí | — | Ya migrado. |
| Token blacklist | D1 | Sí | — | Ya migrado. |
| Pacientes / sesiones / créditos (API) | D1 | Sí | — | Rutas de API ya usan D1. |

---

## 2. Detalle por sistema

### 2.1 Rate limiting de login (in-memory) — **MIGRAR A D1**

**Situación actual**

- **Archivo:** `src/api/utils/rate-limit.ts`
- **Almacenamiento:** `const failedAttempts = new Map<string, FailedAttempt>();` (memoria del proceso).
- **Uso:** `src/api/routes/auth.ts` y `src/api/middleware/rate-limit.ts` importan `checkRateLimit`, `recordFailedAttempt`, `clearFailedAttempts`, `getFailedAttemptCount` desde `rate-limit.ts`.

**Problemas**

- En Cloudflare Workers (o varios procesos), cada instancia tiene su propio `Map`: el límite no es global.
- Tras un cold start, el contador se reinicia.
- Un atacante puede repartir intentos entre instancias o esperar reinicios y evadir el rate limiting.

**Solución ya existente**

- `src/api/utils/rate-limit-d1.ts` implementa la misma lógica usando la tabla `rate_limit_attempts` en D1.
- El schema ya define `rateLimitAttempts` en `src/api/database/schema.ts`.

**Acción recomendada**

1. En `auth.ts`: sustituir imports y llamadas de `rate-limit.ts` por las versiones async de `rate-limit-d1.ts`:
   - `checkRateLimit` → `checkRateLimitD1`
   - `recordFailedAttempt` → `recordFailedAttemptD1`
   - `clearFailedAttempts` → `clearFailedAttemptsD1`
   - `getFailedAttemptCount` → `getFailedAttemptCountD1`
2. En `rate-limit.ts` (middleware): mismo cambio, usando las funciones async de `rate-limit-d1.ts` (o un middleware que las use).

---

### 2.2 Usuarios creados y autenticación — **USAR D1 COMO FUENTE EN API**

**Situación actual**

- **Auth** (`src/api/routes/auth.ts`): usa `getUserByEmailFromDB` primero y, si no hay usuario, usa `getAllUsersWithCredentials()` de `../../web/lib/storage`.  
  `getAllUsersWithCredentials` = `MOCK_USERS` + `getCreatedUsers()`, y `getCreatedUsers()` en el servidor lee de `getItem(KEYS.CREATED_USERS)` → en Node/Worker eso es `memoryStorage`, vacío tras cold start.
- **Users** (`src/api/routes/users.ts`): CRUD de usuarios vía `getAllUsers`, `getCreatedUsers`, `saveCreatedUser`, `updateCreatedUser`, `deleteCreatedUser` desde `../../web/lib/storage`. En servidor, todo eso es memoria/local, no persistente entre reinicios.
- **2FA** (`src/api/routes/two-factor-auth.ts`): usa `getAllUsersWithCredentials` de storage para resolver usuario.

**Problemas**

- En producción, los “usuarios creados” por el admin no persisten en la API: la memoria del Worker se reinicia.
- La tabla `created_users` existe en el schema y ya se usa para login cuando `getUserByEmailFromDB` encuentra al usuario; pero crear/actualizar/eliminar usuarios en el API sigue yendo a storage, no a D1.

**Acción recomendada**

1. **Users API:** que todas las operaciones de usuarios (listar, crear, actualizar, eliminar, block/unblock, etc.) usen solo D1 (`created_users`). Eliminar dependencia de `storage` en `users.ts`.
2. **Auth:** mantener prioridad a `getUserByEmailFromDB`. Opcionalmente mantener `getAllUsersWithCredentials` solo para MOCK_USERS en desarrollo, o eliminar MOCK y usar solo usuarios en D1.
3. **2FA:** que la resolución de usuario sea por `getUserByEmailFromDB` / `getUserByIdFromDB` (o equivalente desde D1), no por `getAllUsersWithCredentials` de storage.

---

### 2.3 Pacientes y sesiones en el frontend — **API COMO ÚNICA FUENTE**

**Situación actual**

- La **API** de pacientes y sesiones ya usa D1 (`src/api/routes/patients.ts`, `src/api/routes/sessions.ts`).
- El **frontend** en muchos flujos sigue usando `getPatients()`, `getSessions()`, `getSessionsByPatient()` de `src/web/lib/storage` (localStorage / memoria).
- Escrituras directas a localStorage de pacientes/sesiones aparecen en:
  - `src/web/pages/users-page.tsx` (líneas ~660–662): `localStorage.setItem("podoadmin_patients", ...)`, `localStorage.setItem("podoadmin_sessions", ...)`.
  - `src/web/pages/clinic-page.tsx` (líneas ~294–295): mismo patrón.
- Lecturas desde storage en:
  - `users-page.tsx`: conteos y filtros por `getPatients()`, `getSessions()`.
  - `patients-page.tsx`: para rol recepcionista usa `getPatients()` como fallback (líneas ~95–102).
  - `sessions-page.tsx`: `getPatients()` en estado inicial.
  - `dashboard.tsx`: `getPatients()`, `getSessions()`.
  - `calendar-page.tsx`: `getSessions()`, `getPatients()`.
  - `clinic-page.tsx`: `getPatients()`, `getSessions()`.

**Problemas**

- Doble fuente de verdad: API (D1) vs localStorage. Riesgo de inconsistencias y de que datos sensibles (historial clínico) queden solo en el navegador.
- Para cumplir con finalidad del sistema (clínica) y buenas prácticas de seguridad, los datos clínicos deben estar centralizados en la base de datos y servidos vía API.

**Acción recomendada**

1. Hacer que **todas** las pantallas que hoy usan `getPatients()` / `getSessions()` obtengan esos datos desde la API (`/api/patients`, `/api/sessions` o endpoints concretos por rol/filtros).
2. Quitar o restringir las escrituras directas a `podoadmin_patients` y `podoadmin_sessions` en `users-page` y `clinic-page`; que las mutaciones pasen siempre por la API.
3. Para recepcionistas: definir un contrato de API (permisos, filtros por podólogo asignado, etc.) y que `patients-page` use solo esa API, sin fallback a `getPatients()` de storage.
4. Opcional: mantener en storage solo una caché volátil para UX (por ejemplo lista reciente), siempre subordinate a la API como fuente de verdad.

---

### 2.4 Ajustes de admin (créditos) en localStorage — **MIGRAR A DB**

**Situación actual**

- **Archivo:** `src/web/pages/admin-credits-page.tsx`
- **Clave:** `"podoadmin_admin_adjustments"`
- Se guarda un array de objetos `AdminAdjustment` (id, userId, userName, amount, reason, adminId, adminName, createdAt) en localStorage, con recorte a las últimas 40–50 entradas.

**Problemas**

- Historial de ajustes de créditos por parte de admins queda solo en el cliente, sin trazabilidad en servidor ni respaldo.
- Para auditoría y seguridad, estos eventos deberían estar en base de datos.

**Acción recomendada**

1. Registrar cada ajuste de crédito en el servidor, por ejemplo:
   - como eventos en la tabla `audit_log` (p. ej. `resourceType: 'credit_adjustment'`, `details` con amount, reason, target userId, etc.), o
   - en una tabla dedicada `admin_credit_adjustments` si se necesita consultas específicas.
2. Añadir un endpoint (p. ej. `GET /api/credits/adjustments` o dentro de audit-logs) para que el frontend lea el historial desde la API.
3. Dejar de usar `podoadmin_admin_adjustments` en localStorage para persistir ajustes; se puede seguir usando solo como caché temporal o eliminarlo.

---

### 2.5 Usuario actual (`podoadmin_user`) en localStorage

**Situación actual**

- `auth-context.tsx` guarda el objeto `user` en `localStorage.setItem("podoadmin_user", ...)` para restaurar sesión en pestaña/recarga.
- Los tokens ya no están en localStorage (están en cookies HTTP-only); la autorización en el API se hace por token (middleware `requireAuth`).

**Valoración**

- El backend no usa este objeto para decisiones de seguridad; es solo caché de perfil en el cliente.
- El riesgo principal sería que alguien manipule el objeto en el navegador para cambiar rol/nombre en la UI; las acciones reales siguen protegidas por el token y los permisos en el API.
- Prioridad de migración a DB: **baja**. Opcional: refrescar perfil desde un endpoint tipo `GET /api/auth/me` y usar ese resultado como fuente de verdad en la UI, reduciendo dependencia del valor guardado en localStorage.

---

### 2.6 Ya migrados o fuera de alcance de esta migración

- **Rate limiting de registro:** `src/api/utils/registration-rate-limit.ts` usa la tabla `registration_rate_limit` en D1. Correcto.
- **Token blacklist:** `src/api/utils/token-blacklist.ts` usa la tabla `token_blacklist` en D1. Correcto.
- **Pacientes, sesiones, créditos en la API:** las rutas correspondientes ya leen/escriben en D1. Lo pendiente es que el frontend deje de usar storage como fuente principal.
- **Seed data y preferencias (idioma, tema):** pensados para desarrollo o UX; no son datos que requieran migración a DB por seguridad en este análisis.

---

## 3. Orden sugerido de migración

1. **Rate limiting de login a D1**  
   Cambiar auth y middleware de `rate-limit.ts` a `rate-limit-d1.ts`. Impacto acotado, mejora clara de seguridad.

2. **Usuarios en API solo D1**  
   Hacer que `users.ts`, `auth.ts` y `two-factor-auth.ts` usen D1 para usuarios creados/registrados y dejen de depender de `getCreatedUsers`/`getAllUsersWithCredentials` de storage para producción.

3. **Frontend: pacientes y sesiones desde API**  
   Actualizar todas las páginas que usan `getPatients()`/`getSessions()` para que consuman la API y eliminar escrituras directas a localStorage de pacientes/sesiones.

4. **Ajustes de admin a DB**  
   Endpoint y tabla/audit para ajustes de créditos y sustituir `podoadmin_admin_adjustments` en localStorage.

5. **Opcional:** perfil de usuario desde `GET /api/auth/me` y menor dependencia de `podoadmin_user` en localStorage.

---

## 4. Referencias rápidas en el código

| Tema | Archivos relevantes |
|------|---------------------|
| Rate limit login (memoria) | `src/api/utils/rate-limit.ts` |
| Rate limit login (D1, no usado) | `src/api/utils/rate-limit-d1.ts` |
| Uso de rate limit en auth | `src/api/routes/auth.ts` (import y uso de `checkRateLimit`, etc.) |
| Usuarios desde storage en API | `src/api/routes/users.ts`, `src/api/routes/auth.ts`, `src/api/routes/two-factor-auth.ts` |
| Usuarios en D1 | `src/api/utils/user-db.ts`, tabla `created_users` en `schema.ts` |
| Frontend pacientes/sesiones desde storage | `users-page.tsx`, `patients-page.tsx`, `sessions-page.tsx`, `dashboard.tsx`, `calendar-page.tsx`, `clinic-page.tsx` |
| Ajustes admin en localStorage | `src/web/pages/admin-credits-page.tsx` (clave `podoadmin_admin_adjustments`) |
| Schema D1 | `src/api/database/schema.ts` |

---

Este documento refleja el estado del repositorio en el momento del análisis. Conviene revisar importaciones y rutas antes de aplicar los cambios.
