/** Política de retención documental (plazos en ms desde el acto/registro). */
export const RETENTION_POLICY = {
  clinicalYears: 5,
  auditYears: 2,
  notificationsDays: 90,
  operationalDays: 365,
} as const;

/**
 * Años mínimos de conservación del expediente clínico, por país (ISO 3166-1 alfa-2).
 *
 * Son obligaciones legales sanitarias, no valores de producto: NO se completan por
 * estimación ni por analogía con otro país. Cada entrada debe respaldarse con la norma
 * que la impone, citada en el comentario.
 *
 * Un país ausente de esta tabla no obtiene plazo, y `calculateClinicalRetainUntil`
 * devuelve null: el registro queda excluido de la purga automática. Es deliberado.
 * Conservar de más es un problema corregible; borrar antes de tiempo es una infracción
 * irreversible.
 */
export const CLINICAL_RETENTION_YEARS_BY_COUNTRY: Record<string, number> = {
  MX: 5, // NOM-004-SSA3-2012: mínimo 5 años desde el último acto médico.
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

/**
 * Fecha hasta la que debe conservarse el expediente, o `null` si el país no tiene
 * plazo confirmado en `CLINICAL_RETENTION_YEARS_BY_COUNTRY`. `null` significa
 * "no purgar": la purga omite los registros sin plazo.
 */
export function calculateClinicalRetainUntil(
  actAtMs: number,
  countryCode?: string | null
): number | null {
  const years = countryCode
    ? CLINICAL_RETENTION_YEARS_BY_COUNTRY[countryCode.trim().toUpperCase()]
    : undefined;
  if (years === undefined) return null;
  return actAtMs + years * MS_PER_YEAR;
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
