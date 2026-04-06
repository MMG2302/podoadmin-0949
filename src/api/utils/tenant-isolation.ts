import { database } from '../database';
import { createdUsers } from '../database/schema';
import { eq, or } from 'drizzle-orm';
import type { JWTPayload } from './jwt';

/**
 * Administrador de clínica debe tener clinicId; si no, no debe ver datos de ninguna clínica.
 */
export function isClinicAdminWithoutClinic(user: JWTPayload): boolean {
  return user.role === 'clinic_admin' && !user.clinicId;
}

/**
 * IDs de podólogos (createdUsers.userId) asignados a una recepcionista.
 * El JWT lleva `userId` = columna `created_users.user_id`, no la PK `id`.
 */
export async function getAssignedPodiatristUserIds(receptionistJwtUserId: string): Promise<string[]> {
  const rows = await database
    .select({ assignedPodiatristIds: createdUsers.assignedPodiatristIds })
    .from(createdUsers)
    .where(eq(createdUsers.userId, receptionistJwtUserId))
    .limit(1);
  if (!rows[0]?.assignedPodiatristIds) return [];
  try {
    const parsed = JSON.parse(rows[0].assignedPodiatristIds) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** clinicId de un usuario cuyo identificador de negocio es `userId` (JWT / createdBy). */
export async function getClinicIdByUserId(jwtUserId: string): Promise<string | null> {
  const rows = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, jwtUserId))
    .limit(1);
  return rows[0]?.clinicId ?? null;
}

/** Fila de usuario por PK `id` o por `user_id` (el que va en JWT / createdBy en pacientes). */
export async function getCreatedUserByIdOrUserId(idOrUserId: string) {
  const rows = await database
    .select()
    .from(createdUsers)
    .where(or(eq(createdUsers.id, idOrUserId), eq(createdUsers.userId, idOrUserId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Comprueba que el usuario pueda actuar sobre un paciente (mismas reglas que GET /patients/:id).
 * @returns mensaje de error corto o null si hay acceso
 */
export async function getPatientAccessDeniedReason(
  user: JWTPayload,
  patient: { createdBy: string; clinicId: string | null }
): Promise<string | null> {
  if (user.role === 'super_admin') return null;
  if (isClinicAdminWithoutClinic(user)) return 'clinic_admin_sin_clinica';
  if (user.role === 'podiatrist' && patient.createdBy !== user.userId) {
    return 'no_paciente';
  }
  if (user.role === 'receptionist') {
    const ids = await getAssignedPodiatristUserIds(user.userId);
    if (!ids.includes(patient.createdBy)) return 'no_paciente';
  }
  if (user.role === 'clinic_admin' && patient.clinicId !== user.clinicId) {
    return 'no_paciente';
  }
  return null;
}

/** Igual que reglas de visibilidad de sesión por fila (createdBy + clinicId). */
export async function getSessionAccessDeniedReason(
  user: JWTPayload,
  session: { createdBy: string; clinicId: string | null }
): Promise<string | null> {
  if (user.role === 'super_admin') return null;
  if (isClinicAdminWithoutClinic(user)) return 'clinic_admin_sin_clinica';
  if (user.role === 'podiatrist' && session.createdBy !== user.userId) return 'no_sesion';
  if (user.role === 'clinic_admin' && session.clinicId !== user.clinicId) return 'no_sesion';
  if (user.role === 'receptionist') {
    const ids = await getAssignedPodiatristUserIds(user.userId);
    if (!ids.includes(session.createdBy)) return 'no_sesion';
  }
  return null;
}
