# Revisión pendiente del proyecto (localStorage → API/DB)

Análisis del repositorio tras las migraciones ya hechas (settings, notificaciones, mensajes, audit violaciones, seed mock solo local). Resumen de lo que **queda por revisar o migrar**.

---

## 1. Ya migrado o en uso API

| Área | Estado | Notas |
|------|--------|--------|
| **Settings (clínica/profesional)** | ✅ API | Clínica y profesional vía API; logos `getLogoForUser` async API |
| **Notificaciones** | ✅ API | List/create/read/read-all/delete; alerta 5 violaciones impresión en backend |
| **Mensajes (sent)** | ✅ API | List/send/read-status vía `/api/messages` |
| **Usuarios (listado/CRUD)** | ✅ API | `users-page` carga con `api.get("/users")`; bloqueo/desbloqueo/ban vía API |
| **Pacientes** | ✅ API (parcial) | `patients-page` carga con `api.get("/patients")`; recepcionistas usan fallback storage |
| **Sesiones** | ✅ API (parcial) | `sessions-page` y `calendar-page` cargan con `api.get("/sessions")` |
| **Appointments** | ✅ API (parcial) | `calendar-page` carga con `api.get("/appointments")`; CRUD vía API |
| **Audit log (lectura)** | ✅ API | `audit-log-page` carga con `api.get("/audit-logs/...")` |
| **Créditos (admin/ajustes)** | ✅ API | Admin credits usa `/credits/me`, `/credits/limits/:id`, `/credits/adjust` |
| **Mock users seed** | ✅ Solo local | `db:seed:local`; no en `db:migrate:remote` |

---

## 2. Backend aún dependiente de `storage` (web)

| Archivo | Uso | Acción recomendada |
|---------|-----|--------------------|
| **`src/api/routes/auth.ts`** | `getAllUsersWithCredentials()`, `getUserStatus()` desde `../../web/lib/storage` | En Workers no hay localStorage; el fallback “mock/creados” queda en memoria vacía. Login real es por DB (`getUserByEmailFromDB`). **Quitar** el fallback a storage y usar solo DB (incl. usuarios seed en D1 local). |
| **`src/api/routes/two-factor-auth.ts`** | `getAllUsersWithCredentials` desde storage | Mismo criterio: dejar de usar storage; leer usuarios desde DB si hace falta. |

---

## 3. Frontend: lectura/escritura que sigue en storage

### 3.1 Créditos de usuario (`getUserCredits`)

- **Dónde:** `settings-page`, `clinic-page`, `sessions-page`, `calendar-page`, `messages-page`, `notifications-page`, `credits-page`, `audit-log-page`, `users-page`, `patients-page`, `main-layout`, `use-credits.ts`, `admin-credits-page`.
- **Qué hace:** Muestra número de créditos (sidebar, páginas). La fuente de verdad ya es la API (`/credits/me` en dashboard, credits-page, admin).
- **Revisar:** Unificar en API: que layout/sidebar y el resto obtengan créditos con `api.get("/credits/me")` (o hook que use solo API) y dejar de usar `getUserCredits(storage)`.

### 3.2 Lista de usuarios (`getCreatedUsers` / `getAllUsers`)

- **Dónde:** `auth-context.tsx` (getAllUsers, getCreatedUsers, isEmailTaken, verifyAuth fallback), `clinic-page.tsx` (receptionists), `messages-page.tsx` (destinatarios).
- **Qué hace:** Lista de usuarios para login fallback, recepcionistas de clínica, selector de destinatarios.
- **Revisar:** Cargar usuarios desde `api.get("/users")` (o endpoint por rol/clínica si existe) y dejar de depender de `getCreatedUsers()` en localStorage.

### 3.3 Audit log (escritura) – `addAuditLog`

- **Dónde:** `clinic-page`, `sessions-page`, `users-page`, `patients-page` (y otros).
- **Qué hace:** Escribe eventos de auditoría en localStorage.
- **Revisar:** Sustituir por `api.post("/audit-logs", { action, resourceType, resourceId, details })` donde ya exista el endpoint, para que todo audit quede en DB.

### 3.4 Pacientes y sesiones en `users-page`

- **Dónde:** `users-page.tsx`: `getPatients()`, `getSessions()` para reasignar/borrar usuario y para mostrar conteos (pacientes/sesiones por usuario).
- **Qué hace:** Al reasignar o borrar usuario actualiza `localStorage` (patients, sessions).
- **Revisar:** No escribir en localStorage; usar solo API (p. ej. reassign/delete ya existentes). Conteos obtenerlos desde API (pacientes por `createdBy`, sesiones por API si existe filtro).

### 3.5 Conteo de sesiones por paciente (`getSessionsByPatient`)

- **Dónde:** `patients-page.tsx`: número de sesiones por paciente en listado/detalle.
- **Revisar:** Si la API de sesiones permite filtrar por `patientId`, usar esa respuesta para el conteo; si no, valorar endpoint tipo `GET /sessions?patientId=...` o incluir conteo en respuesta de pacientes.

### 3.6 Recepcionistas: pacientes desde storage

- **Dónde:** `patients-page.tsx`: para recepcionistas usa `getPatients()` de storage y filtra por `assignedPodiatristIds`.
- **Revisar:** Cargar pacientes desde API (p. ej. endpoint por recepcionista o filtro por podólogos asignados) y quitar fallback a storage.

### 3.7 Créditos de clínica (`getClinicCredits`)

- **Dónde:** `credits-page`, `users-page`, `main-layout.tsx`.
- **Revisar:** Sustituir por `api.get("/clinic-credits/...")` (o la ruta que exista) y dejar de usar storage.

### 3.8 Prescripciones (`getPrescriptionsBySession`)

- **Dónde:** `sessions-page.tsx`: prescripciones por sesión.
- **Revisar:** Comprobar si existe API de prescripciones; si no, valorar crearla y usar solo API aquí.

### 3.9 Clínicas (`getClinics`)

- **Dónde:** Probablemente en `storage` y usadas en varias pantallas.
- **Revisar:** Listado y detalle de clínicas vía `api.get("/clinics")` y quitar lectura desde storage.

### 3.10 Appointments (lectura inicial en otras páginas)

- **Dónde:** `calendar-page` ya usa API; revisar si hay más sitios que lean appointments desde storage.
- **Revisar:** Asegurar que en todas las pantallas los appointments vengan de API.

---

## 4. localStorage aceptable (mantener o acordar)

| Uso | Dónde | Nota |
|-----|--------|------|
| **Idioma** | `language-context.tsx` | Preferencia de UI; correcto en localStorage. |
| **Copia de usuario (sesión)** | `auth-context`: `podoadmin_user` | Sesión real en cookies; copia en localStorage es redundante. Opcional: dejar solo cookies y quitar esta copia. |
| **Ajustes admin (historial local)** | `admin-credits-page`: `ADMIN_ADJUSTMENTS_KEY` | Preferencia/historial local; se puede dejar o migrar a API más adelante. |
| **Seed datos dev** | `seed-data.ts` | Rellena localStorage para desarrollo; documentar que es solo para entornos sin API/DB. |

---

## 5. Resumen priorizado

### Alta prioridad

1. **Auth backend:** Eliminar dependencia de `getAllUsersWithCredentials` / `getUserStatus` en `auth.ts` y `two-factor-auth.ts`; usar solo DB (incl. usuarios seed en D1 local).
2. **Lista de usuarios en frontend:** Cargar usuarios desde API en auth-context, messages-page y clinic-page; dejar de usar `getCreatedUsers()`.
3. **Créditos en UI:** Unificar obtención de créditos con API (`/credits/me`) en layout, sidebar y páginas; quitar `getUserCredits(storage)`.
4. **Audit log escritura:** Sustituir todas las llamadas a `addAuditLog(storage)` por `api.post("/audit-logs", ...)`.

### Media prioridad

5. **users-page:** Dejar de escribir/leer pacientes y sesiones en localStorage; usar solo API para reasignar/borrar y para conteos.
6. **Sesiones por paciente:** Conteo vía API (sesiones filtradas por paciente o dato incluido en pacientes).
7. **Recepcionistas – pacientes:** Cargar pacientes desde API (filtro por podólogos asignados) en lugar de storage.
8. **Clinic credits:** Reemplazar `getClinicCredits(storage)` por llamadas a API de clinic-credits.

### Baja prioridad

9. **Prescripciones:** Comprobar si hay API; si no, diseñar endpoint y usar solo API en sessions-page.
10. **Clínicas:** Revisar todos los usos de `getClinics(storage)` y pasarlos a API.
11. **Limpieza sesión:** Valorar quitar copia `podoadmin_user` de localStorage y usar solo cookies.
12. **admin-credits historial:** Decidir si el historial de ajustes debe persistir en backend o seguir solo en localStorage.

---

## 6. Archivos clave a tocar

- **API:** `src/api/routes/auth.ts`, `src/api/routes/two-factor-auth.ts`
- **Frontend:** `src/web/contexts/auth-context.tsx`, `src/web/components/layout/main-layout.tsx`, `src/web/pages/users-page.tsx`, `src/web/pages/patients-page.tsx`, `src/web/pages/clinic-page.tsx`, `src/web/pages/sessions-page.tsx`, `src/web/pages/credits-page.tsx`, `src/web/pages/calendar-page.tsx`, `src/web/hooks/use-credits.ts`
- **Storage:** `src/web/lib/storage.ts` (ir reduciendo usos de KEYS y funciones que ya tengan equivalente en API)

Cuando una entidad pase a usarse solo por API, se pueden dejar en `storage.ts` solo los **tipos** y helpers que no dependan de localStorage (p. ej. `generateId`, interfaces exportadas).
