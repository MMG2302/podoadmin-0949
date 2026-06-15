# Runbook de Compliance y Retención

## Objetivo

Operar y demostrar cumplimiento de retención de historiales médicos y evidencia de auditoría en producción.

## Componentes

- Política global: `docs/RETENTION_POLICY_GLOBAL.md`
- Cron de retención: `src/worker.ts`
- Motor de política: `src/api/utils/retention-policy.ts`
- Metadatos de retención/hold: `src/api/database/schema.ts`
- Endpoints de compliance: `src/api/routes/compliance.ts`

## Frecuencia operativa

- **Diario**: verificación de ejecución de cron (retención 04:00 UTC, purga clínica 05:00 UTC).
- **Semanal**: muestreo de registros con `retainUntil` y `legalHold`.
- **Mensual**: export de evidencia para archivo interno de cumplimiento.
- **Trimestral**: revisión legal de matriz país.

## Crons programados

| Hora (UTC) | Acción |
|------------|--------|
| 04:00 | Backup / retención de metadatos |
| 05:00 | Purga de datos clínicos vencidos (`clinical-retention-purge`) |
| 06:00 | Tareas de mantenimiento |

La purga respeta `retainUntil` y legal holds activos. No elimina pacientes con hold o retención vigente.

## Verificación diaria (operativa)

1. Confirmar que el worker ejecutó cron de retención.
2. Revisar en auditoría evento `COMPLIANCE_RETENTION_CRON_EXECUTED`.
3. Validar que no hubo errores críticos de DB.

## Export de evidencia

### JSON

`GET /api/compliance/evidence/export?format=json&from=<ISO>&to=<ISO>&limit=2000`

### CSV

`GET /api/compliance/evidence/export?format=csv&from=<ISO>&to=<ISO>&limit=2000`

### Resumen rápido

`GET /api/compliance/evidence/summary`

## Gestión de legal hold

Crear bloqueo legal:

`POST /api/compliance/legal-hold/:resourceType/:resourceId`

Body:

```json
{
  "reason": "Requerimiento legal o auditoría",
  "expiresAt": 1799999999999
}
```

Notas:

- Solo `super_admin`.
- `reason` obligatorio (>=10 chars).
- Mientras exista hold activo, el recurso no debe eliminarse automáticamente.

Liberar bloqueo:

`POST /api/compliance/legal-holds/:holdId/release`

Solo `super_admin`. El hold pasa a estado liberado y deja de proteger el recurso.

## Escenario de inspección/auditoría

1. Exportar evidencia por periodo.
2. Adjuntar política vigente.
3. Adjuntar logs de ejecución cron.
4. Adjuntar listado de legal holds activos y motivo.

## Gestión de incidentes

Si cron falla o no deja evidencia:

1. Marcar incidente de cumplimiento.
2. Ejecutar diagnóstico (`/api/system/diagnostics`).
3. Reintentar cron en siguiente ventana programada.
4. Documentar causa raíz y remediación.

## Checklist mensual

- [ ] Export de evidencia del mes.
- [ ] Revisión de holds activos.
- [ ] Muestreo de `retainUntil` en entidades clínicas.
- [ ] Verificación de trazabilidad de auditoría.
- [ ] Confirmación de política legal vigente por país.
