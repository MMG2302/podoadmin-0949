# Política Global de Retención de Datos (Multi-País)

## Alcance

Esta política aplica a PodoAdmin en operación multi-país (México, Brasil, Argentina, Colombia, Chile, Perú, Uruguay, Costa Rica) usando una configuración global única.

## Regla global principal

- **Historial clínico y expediente médico relacionado:** 20 años desde el último acto clínico registrado.

La política usa un criterio conservador para cubrir el mínimo más exigente de la matriz base (Brasil: 20 años).

## Plazos por categoría de dato

| Categoría | Ejemplos | Plazo |
|-----------|----------|-------|
| `clinical_record` | `patients`, `clinical_sessions`, `appointments` | 20 años |
| `audit_evidence` | `audit_log` | 10 años |
| `security_event` | `security_metrics` | 5 años |
| `support_record` | `support_conversations`, `support_messages` | 5 años |
| `operational_short_term` | rate limiting, reset tokens, blacklist temporal, notificaciones | 30 días a 1 año (según tabla) |

## Evento de inicio del cómputo

- **Historial clínico:** `lastClinicalActAt` (última actuación clínica válida).
- **Auditoría y seguridad:** timestamp de creación del evento.
- **Operacional de corto plazo:** timestamp de creación/expiración técnica.

## Legal hold (bloqueo legal)

Cuando exista requerimiento de litigio, auditoría, investigación o autoridad:

- Se crea registro en `legal_holds`.
- Se marca `legalHold = true` en el recurso.
- El cron de retención no elimina registros con `legalHold` activo.

## Cumplimiento de derechos ARCO/LGPD/GDPR

Esta política se complementa con procesos para:

- Acceso y portabilidad de datos.
- Rectificación.
- Supresión cuando aplique legalmente.
- Oposición/restricción conforme marco local.

Si existe conflicto entre solicitud de supresión y obligación legal de conservación, prevalece conservación mínima legal y se registra evidencia en auditoría.

## Excepciones país/cliente

Para países con criterios variables (Perú, Costa Rica) o contratos específicos:

- Se documenta anexo legal-operativo por cliente.
- No se reduce el mínimo global de 20 años para historial clínico.

## Revisión de política

- Revisión legal y técnica trimestral.
- Revisión extraordinaria ante cambio regulatorio o requerimiento de autoridad.
