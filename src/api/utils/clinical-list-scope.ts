import { and, eq, inArray, SQL, sql } from 'drizzle-orm';
import type { JWTPayload } from './jwt';
import { getAssignedPodiatristUserIds, isClinicAdminWithoutClinic } from './tenant-isolation';

export type ClinicalListScope =
  | { mode: 'all' }
  | { mode: 'none' }
  | { mode: 'podiatrist'; createdBy: string }
  | { mode: 'receptionist'; createdByIn: string[] }
  | { mode: 'clinic'; clinicId: string };

export async function resolveClinicalListScope(user: JWTPayload): Promise<ClinicalListScope> {
  if (user.role === 'super_admin' || user.role === 'admin') {
    return { mode: 'all' };
  }
  if (isClinicAdminWithoutClinic(user)) {
    return { mode: 'none' };
  }
  if (user.role === 'podiatrist') {
    return { mode: 'podiatrist', createdBy: user.userId };
  }
  if (user.role === 'receptionist') {
    const ids = await getAssignedPodiatristUserIds(user.userId);
    if (ids.length === 0) return { mode: 'none' };
    return { mode: 'receptionist', createdByIn: ids };
  }
  if (user.role === 'clinic_admin' && user.clinicId) {
    return { mode: 'clinic', clinicId: user.clinicId };
  }
  return { mode: 'none' };
}

export function emptyScopeCondition(): SQL {
  return sql`0 = 1`;
}

export function buildCreatedByScopeCondition(
  scope: ClinicalListScope,
  columns: { createdBy: unknown; clinicId?: unknown }
): SQL | undefined {
  if (scope.mode === 'none') return emptyScopeCondition();
  if (scope.mode === 'podiatrist') {
    return eq(columns.createdBy as never, scope.createdBy);
  }
  if (scope.mode === 'receptionist') {
    return inArray(columns.createdBy as never, scope.createdByIn);
  }
  if (scope.mode === 'clinic' && columns.clinicId) {
    return eq(columns.clinicId as never, scope.clinicId);
  }
  return undefined;
}

export function mergeScopeWhere(
  scope: ClinicalListScope,
  columns: { createdBy: unknown; clinicId?: unknown },
  extra?: SQL
): SQL | undefined {
  const scopeCond = buildCreatedByScopeCondition(scope, columns);
  if (scopeCond && extra) return and(scopeCond, extra);
  return scopeCond ?? extra;
}
