/** Política de retención documental (plazos en ms desde el acto/registro). */
export const RETENTION_POLICY = {
  clinicalYears: 5,
  auditYears: 2,
  notificationsDays: 90,
  operationalDays: 365,
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

export function calculateClinicalRetainUntil(actAtMs: number): number {
  return actAtMs + RETENTION_POLICY.clinicalYears * MS_PER_YEAR;
}

export function calculateAuditRetainUntil(createdMs: number): number {
  return createdMs + RETENTION_POLICY.auditYears * MS_PER_YEAR;
}

export function calculateOperationalRetainUntil(createdMs: number, days: number): number {
  return createdMs + days * MS_PER_DAY;
}

export function retentionSummary() {
  return {
    clinical: {
      category: 'clinical_record',
      years: RETENTION_POLICY.clinicalYears,
      description: 'Expediente clínico y sesiones',
    },
    audit: {
      category: 'audit_evidence',
      years: RETENTION_POLICY.auditYears,
      description: 'Registros de auditoría',
    },
    notifications: {
      category: 'operational_short_term',
      days: RETENTION_POLICY.notificationsDays,
      description: 'Notificaciones del sistema',
    },
    operational: {
      days: RETENTION_POLICY.operationalDays,
      description: 'Datos operativos de corto plazo',
    },
  };
}
