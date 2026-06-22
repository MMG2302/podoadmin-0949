import { and, eq, or } from 'drizzle-orm';

import { database } from '../database';
import { createdUsers } from '../database/schema';
import type { JWTPayload } from './jwt';

export type CreatedUserRow = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  clinicId: string | null;
  createdBy?: string | null;
  assignedPodiatristIds?: string | null;
};

const ASSIGNED_PODIATRIST_CACHE_TTL_MS = 30_000;
const assignedPodiatristCache = new Map<string, { at: number; ids: string[] }>();

export function invalidateAssignedPodiatristCache(receptionistUserId: string): void {
  assignedPodiatristCache.delete(receptionistUserId);
}

type TenantScopedRow = {
  createdBy: string;
  clinicId?: string | null;
};

function safeJsonParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function isClinicAdminWithoutClinic(user: JWTPayload): boolean {
  return user.role === 'clinic_admin' && !user.clinicId;
}

export async function getCreatedUserByIdOrUserId(idOrUserId: string): Promise<CreatedUserRow | null> {
  const key = String(idOrUserId).trim();
  if (!key) return null;

  const rows = await database
    .select({
      id: createdUsers.id,
      userId: createdUsers.userId,
      email: createdUsers.email,
      name: createdUsers.name,
      role: createdUsers.role,
      clinicId: createdUsers.clinicId,
      createdBy: createdUsers.createdBy,
      assignedPodiatristIds: createdUsers.assignedPodiatristIds,
    })
    .from(createdUsers)
    .where(or(eq(createdUsers.id, key), eq(createdUsers.userId, key)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    email: row.email,
    name: row.name,
    role: row.role,
    clinicId: row.clinicId ?? null,
    createdBy: row.createdBy ?? null,
    assignedPodiatristIds: row.assignedPodiatristIds ?? null,
  };
}

export async function getAssignedPodiatristUserIds(receptionistUserId: string): Promise<string[]> {
  const cached = assignedPodiatristCache.get(receptionistUserId);
  const now = Date.now();
  if (cached && now - cached.at < ASSIGNED_PODIATRIST_CACHE_TTL_MS) {
    return cached.ids;
  }

  const rows = await database
    .select({ assignedPodiatristIds: createdUsers.assignedPodiatristIds })
    .from(createdUsers)
    .where(and(eq(createdUsers.userId, receptionistUserId), eq(createdUsers.role, 'receptionist')))
    .limit(1);

  const row = rows[0];
  if (!row?.assignedPodiatristIds) {
    assignedPodiatristCache.set(receptionistUserId, { at: now, ids: [] });
    return [];
  }
  const ids = safeJsonParseArray(row.assignedPodiatristIds);
  assignedPodiatristCache.set(receptionistUserId, { at: now, ids });
  return ids;
}

async function resolveClinicalAccessDenied(
  user: JWTPayload,
  row: TenantScopedRow
): Promise<string | null> {
  if (user.role === 'super_admin' || user.role === 'admin') {
    return null;
  }
  if (isClinicAdminWithoutClinic(user)) {
    return 'clinic_admin_sin_clinica';
  }
  if (user.role === 'clinic_admin') {
    if (row.clinicId !== user.clinicId) {
      return 'No tienes permiso para acceder a este recurso de otra clínica';
    }
    return null;
  }
  if (user.role === 'podiatrist') {
    if (row.createdBy !== user.userId) {
      return 'No tienes permiso para acceder a este recurso';
    }
    return null;
  }
  if (user.role === 'receptionist') {
    const assigned = await getAssignedPodiatristUserIds(user.userId);
    if (!assigned.includes(row.createdBy)) {
      return 'No tienes permiso para acceder a este recurso';
    }
    return null;
  }
  return 'No tienes permiso para acceder a este recurso';
}

export async function getPatientAccessDeniedReason(
  user: JWTPayload,
  patient: TenantScopedRow
): Promise<string | null> {
  return resolveClinicalAccessDenied(user, patient);
}

export async function getSessionAccessDeniedReason(
  user: JWTPayload,
  row: TenantScopedRow
): Promise<string | null> {
  return resolveClinicalAccessDenied(user, row);
}
