# Escalado: podólogos independientes y recepcionistas

Plan de endurecimiento orientado al modelo **consultorio independiente + asistente/recepcionista**, no a clínicas multi-podólogo.

## Modelo de datos (independientes)

| Entidad | Aislamiento |
|---------|-------------|
| Pacientes | `created_by` = `userId` del podólogo |
| Sesiones / citas | `created_by` = mismo podólogo |
| Recepcionista | Ve datos de podólogos en `assigned_podiatrist_ids` |
| Folios | Prefijo `IND-AAAA-#####` (sin `clinic_id`) |
| Rate limit tenant | Clave `user:{podiatristUserId}` si no hay clínica |

## Cambios implementados (Fase 1)

### Base de datos — migración `0036_scale_indexes_independents.sql`

Índices críticos:

- `patients(created_by)` — listados del podólogo
- `clinical_sessions(created_by)`, `appointments(created_by)`
- `appointments(session_date)` — agenda
- `patients(updated_at)` — orden de listado paginado

### API — consultas con `WHERE` + paginación

Endpoints endurecidos:

- `GET /api/patients?limit=&offset=`
- `GET /api/sessions?limit=&offset=&patient=`
- `GET /api/appointments?limit=&offset=&date=&podiatristId=`

Defaults: **200** filas/página, máximo **500**.

Respuesta incluye:

```json
{
  "success": true,
  "patients": [...],
  "pagination": { "limit": 200, "offset": 0, "hasMore": true }
}
```

Visibilidad centralizada en `clinical-list-scope.ts` (podólogo / recepcionista / clínica / super_admin).

### Folios sin full scan

`patient-folio.ts` — último folio por prefijo `IND-2026-%` con `LIKE` + `ORDER BY DESC LIMIT 1`.

### Caché de acceso (menos presión D1)

- `resolveSystemAccessCached` — TTL 60 s (`ACCESS_CACHE_TTL_MS`)
- Podólogos/recepcionistas: menos consultas de suscripción en cada request clínico
- `getAssignedPodiatristUserIds` — caché 30 s por recepcionista

### Frontend

- `clinical-list-fetch.ts` — carga automática de todas las páginas (500 en bloque)
- Compatible con UI actual sin cambiar pantallas

### Campañas WhatsApp

- `fetchPatientsForWhatsAppCampaign` — consulta acotada por alcance, no `SELECT *` global

---

## Capacidad objetivo (independientes)

| Métrica | Objetivo razonable post-Fase 1 |
|---------|-------------------------------|
| Podólogos activos simultáneos | 500–1 000 |
| Pacientes por consultorio | hasta ~5 000 |
| Recepcionistas por podólogo | 1–3 |
| Lecturas API autenticadas | 600/min por IP (config prod) |
| Tenant sin clínica | `user:{id}` — 2000 lecturas/min |

---

## Fase 2 (pendiente — mayor impacto)

1. **Rate limit en KV** en lugar de D1 por request (reduce writes ~70%)
2. **Logos solo en R2** (no base64 en `clinics` / `professional_logos`)
3. **Cola WhatsApp** para recordatorios horarios masivos
4. **Listados lazy** en UI (no cargar todos los pacientes al entrar al dashboard)
5. **D1 producción dedicada** con `database_id` real en `wrangler.toml`

---

## Variables de entorno recomendadas (producción)

```env
RATE_LIMIT_AUTH_READ_PER_MIN=600
RATE_LIMIT_AUTH_WRITE_PER_MIN=300
RATE_LIMIT_TENANT_READ_PER_MIN=2000
RATE_LIMIT_TENANT_WRITE_PER_MIN=800
RATE_LIMIT_BURST_PER_10S=80
ACCESS_CACHE_TTL_MS=60000
```

---

## Verificación

```bash
npm run db:migrate
npx vitest run src/api/utils/clinical-list-scope.test.ts src/lib/phone-country.test.ts
```

Prueba manual:

1. Login como podólogo independiente con muchos pacientes mock
2. `GET /api/patients?limit=10` → 10 filas + `hasMore: true` si hay más
3. Recepcionista asignada → mismos pacientes que su podólogo, no los de otros
