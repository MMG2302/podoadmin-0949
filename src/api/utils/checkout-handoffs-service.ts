import { and, eq, inArray, or } from 'drizzle-orm';
import { database } from '../database';
import {
  checkoutHandoffs,
  createdUsers,
  patients,
} from '../database/schema';
import type { JWTPayload } from './jwt';
import { getAssignedPodiatristUserIds } from './tenant-isolation';
import { createNotifications } from './notifications-service';

export type CheckoutHandoffStatus =
  | 'awaiting_amount'
  | 'ready_for_payment'
  | 'paid'
  | 'cancelled';

function safeJsonParseArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function formatAmountLabel(amountCents: number | null | undefined, currency: string): string {
  if (amountCents == null) return '—';
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export async function getReceptionistUserIdsForPodiatrist(podiatristUserId: string): Promise<string[]> {
  const rows = await database
    .select({
      userId: createdUsers.userId,
      assignedPodiatristIds: createdUsers.assignedPodiatristIds,
      isEnabled: createdUsers.isEnabled,
    })
    .from(createdUsers)
    .where(eq(createdUsers.role, 'receptionist'));

  return rows
    .filter((r) => r.isEnabled !== false)
    .filter((r) => safeJsonParseArray(r.assignedPodiatristIds).includes(podiatristUserId))
    .map((r) => r.userId);
}

export async function getCheckoutHandoffAccessDeniedReason(
  user: JWTPayload,
  row: { podiatristId: string; clinicId: string | null }
): Promise<string | null> {
  if (user.role === 'super_admin' || user.role === 'admin') return null;

  if (user.role === 'clinic_admin') {
    if (!user.clinicId || row.clinicId !== user.clinicId) {
      return 'No tienes permiso para acceder a este handoff';
    }
    return null;
  }

  if (user.role === 'podiatrist') {
    if (row.podiatristId !== user.userId) {
      return 'No tienes permiso para acceder a este handoff';
    }
    return null;
  }

  if (user.role === 'receptionist') {
    const assigned = await getAssignedPodiatristUserIds(user.userId);
    if (!assigned.includes(row.podiatristId)) {
      return 'No tienes permiso para acceder a este handoff';
    }
    return null;
  }

  return 'No tienes permiso para acceder a este handoff';
}

export async function listAccessiblePodiatristIds(user: JWTPayload): Promise<string[] | 'all'> {
  if (user.role === 'super_admin' || user.role === 'admin') return 'all';
  if (user.role === 'podiatrist') return [user.userId];
  if (user.role === 'receptionist') return getAssignedPodiatristUserIds(user.userId);
  if (user.role === 'clinic_admin' && user.clinicId) {
    const rows = await database
      .select({ userId: createdUsers.userId })
      .from(createdUsers)
      .where(and(eq(createdUsers.clinicId, user.clinicId), eq(createdUsers.role, 'podiatrist')));
    return rows.map((r) => r.userId);
  }
  return [];
}

export async function notifyReceptionistsCheckoutReady(input: {
  handoffId: string;
  podiatristUserId: string;
  podiatristName: string;
  patientId: string;
  patientName: string;
  amountCents: number;
  currency: string;
}): Promise<void> {
  const recipientIds = await getReceptionistUserIdsForPodiatrist(input.podiatristUserId);
  if (recipientIds.length === 0) return;

  const amountLabel = formatAmountLabel(input.amountCents, input.currency);
  await createNotifications(
    recipientIds.map((userId) => ({
      userId,
      type: 'system' as const,
      title: 'Paciente listo para cobrar',
      message: `${input.patientName} — ${amountLabel} (${input.podiatristName})`,
      metadata: {
        checkoutHandoffId: input.handoffId,
        patientId: input.patientId,
        patientName: input.patientName,
        podiatristId: input.podiatristUserId,
        podiatristName: input.podiatristName,
        amountCents: input.amountCents,
        currency: input.currency,
      },
    }))
  );
}

export async function enrichHandoffsWithNames<
  T extends {
    podiatristId: string;
    patientId: string;
  },
>(rows: T[]): Promise<
  (T & {
    patientName: string;
    podiatristName: string;
  })[]
> {
  if (rows.length === 0) return [];

  const patientIds = [...new Set(rows.map((r) => r.patientId))];
  const podiatristIds = [...new Set(rows.map((r) => r.podiatristId))];

  const patientRows =
    patientIds.length > 0
      ? await database
          .select({
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
          })
          .from(patients)
          .where(inArray(patients.id, patientIds))
      : [];

  const podiatristRows =
    podiatristIds.length > 0
      ? await database
          .select({ userId: createdUsers.userId, name: createdUsers.name })
          .from(createdUsers)
          .where(
            or(
              inArray(createdUsers.userId, podiatristIds),
              inArray(createdUsers.id, podiatristIds)
            )
          )
      : [];

  const patientMap = new Map(
    patientRows.map((p) => [p.id, `${p.firstName} ${p.lastName}`.trim()])
  );
  const podiatristMap = new Map<string, string>();
  for (const p of podiatristRows) {
    podiatristMap.set(p.userId, p.name);
  }

  return rows.map((row) => ({
    ...row,
    patientName: patientMap.get(row.patientId) || 'Paciente',
    podiatristName: podiatristMap.get(row.podiatristId) || 'Podólogo',
  }));
}

export function mapCheckoutHandoffRow(row: typeof checkoutHandoffs.$inferSelect) {
  return {
    id: row.id,
    clinicId: row.clinicId ?? null,
    podiatristId: row.podiatristId,
    patientId: row.patientId,
    sessionId: row.sessionId ?? null,
    appointmentId: row.appointmentId ?? null,
    amountCents: row.amountCents ?? null,
    currency: row.currency,
    notes: row.notes ?? '',
    status: row.status as CheckoutHandoffStatus,
    createdBy: row.createdBy,
    paidAt: row.paidAt ?? null,
    paidBy: row.paidBy ?? null,
    paymentMethod: (row.paymentMethod as 'cash' | 'card' | 'transfer' | 'other' | null) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
