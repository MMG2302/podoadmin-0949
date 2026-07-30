import { and, eq, isNull } from 'drizzle-orm';

import { database } from '../database';
import { createdUsers } from '../database/schema';
import { getCreatedUserByIdOrUserId } from './tenant-isolation';

/** Las clínicas y podólogos independientes tienen recepcionistas ilimitadas. */
export const CLINIC_RECEPTIONISTS_UNLIMITED = true;
export const INDEPENDENT_RECEPTIONISTS_UNLIMITED = true;

type ReceptionistRow = {
  isEnabled?: boolean | null;
  isBlocked?: boolean | null;
  isBanned?: boolean | null;
};

export function isActiveReceptionist(row: ReceptionistRow): boolean {
  if (row.isBanned) return false;
  if (row.isBlocked) return false;
  if (row.isEnabled === false) return false;
  return true;
}

export async function countActiveReceptionistsForClinic(clinicId: string): Promise<number> {
  const rows = await database
    .select({
      isEnabled: createdUsers.isEnabled,
      isBlocked: createdUsers.isBlocked,
      isBanned: createdUsers.isBanned,
    })
    .from(createdUsers)
    .where(and(eq(createdUsers.role, 'receptionist'), eq(createdUsers.clinicId, clinicId)));
  return rows.filter(isActiveReceptionist).length;
}

/** Cuenta recepcionistas vinculadas a un podólogo independiente (sin clínica). */
export async function countReceptionistsForIndependentPodiatrist(podiatristUserId: string): Promise<number> {
  const rows = await database
    .select({ id: createdUsers.id })
    .from(createdUsers)
    .where(
      and(
        eq(createdUsers.role, 'receptionist'),
        eq(createdUsers.createdBy, podiatristUserId),
        isNull(createdUsers.clinicId)
      )
    );
  return rows.length;
}

// Las clínicas tienen recepcionistas ilimitadas: nunca bloquea. Se mantiene la
// firma (y la llamada en users.ts/receptionists.ts) para no dispersar el control.
export async function assertClinicCanAddActiveReceptionist(_clinicId: string): Promise<void> {
  // no-op: sin tope para clínicas.
}

export async function assertIndependentCanAddReceptionist(_podiatristUserId: string): Promise<void> {
  // no-op: sin tope para podólogos independientes (ilimitadas).
}

export async function getClinicPodiatristUserIds(clinicId: string): Promise<string[]> {
  const rows = await database
    .select({ userId: createdUsers.userId })
    .from(createdUsers)
    .where(and(eq(createdUsers.role, 'podiatrist'), eq(createdUsers.clinicId, clinicId)));
  return rows.map((r) => r.userId);
}

/** Valida que todos los IDs sean podólogos de la misma clínica. */
export async function filterValidClinicPodiatristIds(
  clinicId: string,
  candidateIds: string[]
): Promise<string[]> {
  if (candidateIds.length === 0) return [];
  const allowed = new Set(await getClinicPodiatristUserIds(clinicId));
  const normalized: string[] = [];
  for (const id of candidateIds) {
    if (allowed.has(id)) {
      normalized.push(id);
      continue;
    }
    const row = await getCreatedUserByIdOrUserId(id);
    if (row?.role === 'podiatrist' && row.clinicId === clinicId && allowed.has(row.userId)) {
      normalized.push(row.userId);
    }
  }
  return [...new Set(normalized)];
}

/**
 * Alcance de una recepcionista independiente (sin clínica): solo puede quedar
 * asignada al podólogo dueño. Los IDs que manda el cliente solo pueden acotar
 * ese alcance, nunca reemplazarlo — si pide otro podólogo, la lista queda vacía.
 */
export function filterValidIndependentPodiatristIds(
  ownerUserId: string | null | undefined,
  candidateIds: unknown
): string[] {
  if (!ownerUserId) return [];
  if (!Array.isArray(candidateIds)) return [];
  return candidateIds.includes(ownerUserId) ? [ownerUserId] : [];
}

export function canPodiatristManageReceptionist(
  requester: { userId: string; role?: string; clinicId?: string | null },
  row: { role: string; createdBy?: string | null; clinicId?: string | null }
): boolean {
  if (row.role !== 'receptionist') return false;
  if (row.createdBy === requester.userId) return true;
  return Boolean(requester.clinicId && row.clinicId === requester.clinicId);
}
