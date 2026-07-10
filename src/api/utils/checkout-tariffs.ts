import { eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, createdUsers, patients, professionalInfo } from '../database/schema';
import type { JWTPayload } from './jwt';
import {
  DEFAULT_CHECKOUT_TARIFFS,
  normalizeCheckoutTariffs,
  parseCheckoutTariffsJson,
  type CheckoutQuickTariff,
} from '../../web/types/checkout-tariff';
import { listAccessiblePodiatristIds } from './checkout-handoffs-service';
import { createNotification } from './notifications-service';

export { parseCheckoutTariffsJson, normalizeCheckoutTariffs, DEFAULT_CHECKOUT_TARIFFS };
export type { CheckoutQuickTariff };

export async function resolveCheckoutTariffs(
  podiatristUserId: string,
  clinicId: string | null | undefined
): Promise<CheckoutQuickTariff[]> {
  const proRows = await database
    .select({ checkoutTariffsJson: professionalInfo.checkoutTariffsJson })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, podiatristUserId))
    .limit(1);

  const hasCustomPersonal =
    proRows[0]?.checkoutTariffsJson != null && proRows[0].checkoutTariffsJson.trim().length > 0;
  if (hasCustomPersonal) {
    return parseCheckoutTariffsJson(proRows[0]?.checkoutTariffsJson);
  }

  if (clinicId) {
    const clinicRows = await database
      .select({ checkoutTariffsJson: clinics.checkoutTariffsJson })
      .from(clinics)
      .where(eq(clinics.clinicId, clinicId))
      .limit(1);
    if (clinicRows[0]?.checkoutTariffsJson?.trim()) {
      return parseCheckoutTariffsJson(clinicRows[0].checkoutTariffsJson);
    }
  }

  return [...DEFAULT_CHECKOUT_TARIFFS];
}

export async function assertCanReadTariffs(
  user: JWTPayload,
  podiatristUserId: string
): Promise<string | null> {
  const allowed = await listAccessiblePodiatristIds(user);
  if (allowed !== 'all' && !allowed.includes(podiatristUserId)) {
    return 'No autorizado';
  }
  return null;
}

export async function saveCheckoutTariffs(
  user: JWTPayload,
  tariffs: CheckoutQuickTariff[],
  podiatristUserId?: string
): Promise<{ scope: 'podiatrist' | 'clinic'; tariffs: CheckoutQuickTariff[] } | { error: string }> {
  const normalized = normalizeCheckoutTariffs(tariffs);
  const json = JSON.stringify(normalized);

  if (user.role === 'clinic_admin' && user.clinicId) {
    await database
      .update(clinics)
      .set({ checkoutTariffsJson: json })
      .where(eq(clinics.clinicId, user.clinicId));
    return { scope: 'clinic', tariffs: normalized };
  }

  const targetPodiatristId =
    user.role === 'podiatrist' ? user.userId : podiatristUserId?.trim() || '';

  if (!targetPodiatristId) {
    return { error: 'podiatristId es obligatorio' };
  }

  const denied = await assertCanReadTariffs(user, targetPodiatristId);
  if (denied) return { error: denied };

  if (user.role !== 'podiatrist' && user.role !== 'clinic_admin' && user.role !== 'super_admin') {
    return { error: 'No autorizado' };
  }

  const proRows = await database
    .select({ userId: professionalInfo.userId })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, targetPodiatristId))
    .limit(1);

  if (proRows[0]) {
    await database
      .update(professionalInfo)
      .set({ checkoutTariffsJson: json })
      .where(eq(professionalInfo.userId, targetPodiatristId));
  } else {
    const userRows = await database
      .select({ name: createdUsers.name, email: createdUsers.email })
      .from(createdUsers)
      .where(eq(createdUsers.userId, targetPodiatristId))
      .limit(1);
    const u = userRows[0];
    await database.insert(professionalInfo).values({
      userId: targetPodiatristId,
      name: u?.name ?? 'Podólogo',
      email: u?.email ?? '',
      checkoutTariffsJson: json,
    });
  }

  return { scope: 'podiatrist', tariffs: normalized };
}

export async function resolvePodiatristClinicId(podiatristUserId: string): Promise<string | null> {
  const rows = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, podiatristUserId))
    .limit(1);
  return rows[0]?.clinicId ?? null;
}

export async function notifyPodiatristAmountRequested(input: {
  handoffId: string;
  podiatristUserId: string;
  patientId: string;
  patientName: string;
  requestedByName: string;
}): Promise<void> {
  await createNotification({
    userId: input.podiatristUserId,
    type: 'system',
    title: 'Recepción solicita importe',
    message: `${input.requestedByName} necesita el importe para ${input.patientName}. Indícalo en Cobros.`,
    metadata: {
      checkoutHandoffId: input.handoffId,
      patientId: input.patientId,
      patientName: input.patientName,
      action: 'request_amount',
    },
  });
}

export async function getPatientName(patientId: string): Promise<string> {
  const rows = await database
    .select({ firstName: patients.firstName, lastName: patients.lastName })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);
  if (!rows[0]) return 'Paciente';
  return `${rows[0].firstName} ${rows[0].lastName}`.trim();
}
