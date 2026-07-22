import { eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, createdUsers, professionalInfo } from '../database/schema';
import type { JWTPayload } from './jwt';
import { getAssignedPodiatristUserIds } from './tenant-isolation';

const MAX_LENGTH = 500;

function normalize(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim().slice(0, MAX_LENGTH) || '';
  return trimmed || null;
}

/** Mensaje del podólogo (si lo definió) o de la clínica (fallback); null = usar el texto genérico i18n. */
export async function resolveRescheduleMessage(
  podiatristUserId: string,
  clinicId: string | null
): Promise<string | null> {
  const personal = await database
    .select({ msg: professionalInfo.rescheduleMessage })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, podiatristUserId))
    .limit(1);
  const personalMsg = normalize(personal[0]?.msg);
  if (personalMsg) return personalMsg;

  if (clinicId) {
    const clinic = await database
      .select({ msg: clinics.rescheduleMessage })
      .from(clinics)
      .where(eq(clinics.clinicId, clinicId))
      .limit(1);
    const clinicMsg = normalize(clinic[0]?.msg);
    if (clinicMsg) return clinicMsg;
  }
  return null;
}

/** Resuelve mensaje + origen ('podiatrist' | 'clinic' | 'default') para mostrar en la UI de ajustes. */
export async function resolveRescheduleMessageForPodiatrist(
  podiatristId: string
): Promise<{ message: string | null; source: 'podiatrist' | 'clinic' | 'default'; clinicId: string | null }> {
  const userRows = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, podiatristId))
    .limit(1);
  const clinicId = userRows[0]?.clinicId ?? null;

  const personal = await database
    .select({ msg: professionalInfo.rescheduleMessage })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, podiatristId))
    .limit(1);
  const personalMsg = normalize(personal[0]?.msg);
  if (personalMsg) return { message: personalMsg, source: 'podiatrist', clinicId };

  if (clinicId) {
    const clinic = await database
      .select({ msg: clinics.rescheduleMessage })
      .from(clinics)
      .where(eq(clinics.clinicId, clinicId))
      .limit(1);
    const clinicMsg = normalize(clinic[0]?.msg);
    if (clinicMsg) return { message: clinicMsg, source: 'clinic', clinicId };
  }
  return { message: null, source: 'default', clinicId };
}

export async function getClinicRescheduleMessage(clinicId: string): Promise<string | null> {
  const rows = await database
    .select({ msg: clinics.rescheduleMessage })
    .from(clinics)
    .where(eq(clinics.clinicId, clinicId))
    .limit(1);
  return normalize(rows[0]?.msg);
}

export async function saveRescheduleMessage(
  target: { kind: 'podiatrist'; podiatristId: string } | { kind: 'clinic'; clinicId: string },
  message: string | null
): Promise<string | null> {
  const value = normalize(message);

  if (target.kind === 'clinic') {
    await database.update(clinics).set({ rescheduleMessage: value }).where(eq(clinics.clinicId, target.clinicId));
    return value;
  }

  const exists = await database
    .select({ userId: professionalInfo.userId })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, target.podiatristId))
    .limit(1);

  if (exists[0]) {
    await database
      .update(professionalInfo)
      .set({ rescheduleMessage: value })
      .where(eq(professionalInfo.userId, target.podiatristId));
  } else {
    const userRows = await database
      .select({ name: createdUsers.name, email: createdUsers.email })
      .from(createdUsers)
      .where(eq(createdUsers.userId, target.podiatristId))
      .limit(1);
    const u = userRows[0];
    await database.insert(professionalInfo).values({
      userId: target.podiatristId,
      name: u?.name ?? 'Podólogo',
      email: u?.email ?? '',
      rescheduleMessage: value,
    });
  }
  return value;
}

export async function canAccessRescheduleMessageForPodiatrist(
  user: JWTPayload,
  podiatristId: string
): Promise<boolean> {
  if (user.role === 'podiatrist') return user.userId === podiatristId;
  if (user.role === 'clinic_admin') {
    if (!user.clinicId) return false;
    const row = await database
      .select({ clinicId: createdUsers.clinicId, role: createdUsers.role })
      .from(createdUsers)
      .where(eq(createdUsers.userId, podiatristId))
      .limit(1);
    return row[0]?.role === 'podiatrist' && row[0]?.clinicId === user.clinicId;
  }
  if (user.role === 'receptionist') {
    const assigned = await getAssignedPodiatristUserIds(user.userId);
    return assigned.includes(podiatristId);
  }
  return false;
}
