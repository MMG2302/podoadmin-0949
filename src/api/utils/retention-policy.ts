const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const RETENTION_POLICY = {
  /**
   * Política global conservadora para expediente clínico multi-país.
   * Cubre el requisito más estricto de la matriz base (Brasil).
   */
  clinicalRecordYears: 20,
  auditLogYears: 10,
  securityMetricsYears: 5,
  supportConversationYears: 5,
  notificationsDays: 365,
  rateLimitDays: 30,
  tokenBlacklistDays: 30,
  passwordResetDays: 30,
} as const;

export type RetentionCategory =
  | 'clinical_record'
  | 'audit_evidence'
  | 'security_event'
  | 'support_record'
  | 'operational_short_term';

export function yearsToMs(years: number): number {
  return years * 365 * MS_PER_DAY;
}

export function daysToMs(days: number): number {
  return days * MS_PER_DAY;
}

export function calculateClinicalRetainUntil(lastClinicalActAt: number): number {
  return lastClinicalActAt + yearsToMs(RETENTION_POLICY.clinicalRecordYears);
}

export function calculateAuditRetainUntil(baseMs: number): number {
  return baseMs + yearsToMs(RETENTION_POLICY.auditLogYears);
}

export function calculateSecurityRetainUntil(baseMs: number): number {
  return baseMs + yearsToMs(RETENTION_POLICY.securityMetricsYears);
}

export function calculateSupportRetainUntil(baseMs: number): number {
  return baseMs + yearsToMs(RETENTION_POLICY.supportConversationYears);
}

export function calculateOperationalRetainUntil(baseMs: number, days: number): number {
  return baseMs + daysToMs(days);
}

export function parseIsoToMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function retentionSummary() {
  return {
    model: 'global-single-policy',
    clinicalRecordYears: RETENTION_POLICY.clinicalRecordYears,
    countryCoverage: [
      { country: 'Mexico', legalBase: 'LFPDPPP + NOM-004-SSA3-2012', minimum: '5 years' },
      { country: 'Brazil', legalBase: 'LGPD + CFM', minimum: '20 years (digital records)' },
      { country: 'Argentina', legalBase: 'Ley 25.326 + Ley de Historia Clinica', minimum: '10 years' },
      { country: 'Colombia', legalBase: 'Ley 1581 + Resolucion 1995', minimum: '10 years' },
      { country: 'Chile', legalBase: 'Ley 20.584', minimum: '15 years' },
      { country: 'Peru', legalBase: 'Ley 29733 + MINSA', minimum: 'variable' },
      { country: 'Uruguay', legalBase: 'Ley 18.331', minimum: '10 years' },
      { country: 'Costa Rica', legalBase: 'Ley 8968 + EDUS', minimum: 'variable' },
    ],
  };
}
