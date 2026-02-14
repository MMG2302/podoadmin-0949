/**
 * Ciclo de cancelación de usuario:
 * - 0-30 días: grace period (puede seguir usando la app)
 * - 30-240 días: bloqueado (no puede acceder)
 * - 240+ días: borrado permanente (ejecutado por cron)
 */
export const RETENTION = {
  /** Días de grace period tras deshabilitar (puede seguir accediendo) */
  GRACE_PERIOD_DAYS: 30,
  /** Días totales hasta borrado permanente (1 mes grace + 7 meses bloqueado) */
  DELETION_AFTER_DAYS: 240, // 30 + 210 (7 meses)
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type UserCancellationPhase = 'active' | 'grace_period' | 'blocked' | 'scheduled_deletion';

/**
 * Calcula la fase del ciclo de cancelación según disabledAt
 */
export function getCancellationPhase(disabledAt: number | null | undefined): UserCancellationPhase {
  if (!disabledAt) return 'active';
  const now = Date.now();
  const elapsedDays = (now - disabledAt) / MS_PER_DAY;
  if (elapsedDays < RETENTION.GRACE_PERIOD_DAYS) return 'grace_period';
  if (elapsedDays < RETENTION.DELETION_AFTER_DAYS) return 'blocked';
  return 'scheduled_deletion';
}

/**
 * ¿El usuario puede acceder? (grace period sí, blocked no)
 * Si disabledAt es null pero el usuario está deshabilitado (isEnabled=false), no puede acceder
 * (compatibilidad con usuarios deshabilitados antes de añadir disabledAt)
 */
export function canUserAccess(disabledAt: number | null | undefined): boolean {
  if (disabledAt === undefined || disabledAt === null) {
    return false; // Sin timestamp = deshabilitado antiguo o no aplica; si isEnabled=false, no acceso
  }
  const phase = getCancellationPhase(disabledAt);
  return phase === 'grace_period';
}

/**
 * Timestamp límite: usuarios con disabled_at anterior a este deben borrarse
 */
export function getDeletionThresholdMs(): number {
  return Date.now() - RETENTION.DELETION_AFTER_DAYS * MS_PER_DAY;
}
