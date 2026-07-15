import { and, desc, eq, gte, inArray, lte, or } from 'drizzle-orm';
import { database } from '../database';
import { checkoutHandoffs, dailySalesCloses, createdUsers } from '../database/schema';
import type { JWTPayload } from './jwt';
import { getAssignedPodiatristUserIds } from './tenant-isolation';
import { listAccessiblePodiatristIds } from './checkout-handoffs-service';

export type DailyCloseSnapshot = {
  id: string;
  closeDate: string;
  podiatristId: string;
  clinicId: string | null;
  paidCents: number;
  paidCount: number;
  pendingCents: number;
  pendingCount: number;
  byMethod: Record<string, { totalCents: number; count: number }>;
  notes: string | null;
  closedBy: string;
  closedAt: string;
};

export type LiveDayTotals = {
  closeDate: string;
  paidCents: number;
  paidCount: number;
  pendingCents: number;
  pendingCount: number;
  byMethod: Record<string, { totalCents: number; count: number }>;
  paidAfterCloseCents: number;
};

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayBounds(ymd: string): { fromIso: string; toIso: string } {
  return {
    fromIso: `${ymd}T00:00:00.000Z`,
    toIso: `${ymd}T23:59:59.999Z`,
  };
}

export async function assertCanManageDailyClose(
  user: JWTPayload,
  podiatristId: string
): Promise<string | null> {
  if (user.role === 'podiatrist') {
    return user.userId === podiatristId ? null : 'No autorizado';
  }
  if (user.role === 'clinic_admin') {
    if (!user.clinicId) return 'Sin clínica asignada';
    const row = await database
      .select({ clinicId: createdUsers.clinicId, role: createdUsers.role })
      .from(createdUsers)
      .where(eq(createdUsers.userId, podiatristId))
      .limit(1);
    if (row[0]?.role !== 'podiatrist' || row[0].clinicId !== user.clinicId) {
      return 'No autorizado';
    }
    return null;
  }
  if (user.role === 'receptionist') {
    const assigned = await getAssignedPodiatristUserIds(user.userId);
    return assigned.includes(podiatristId) ? null : 'No autorizado';
  }
  return 'No autorizado';
}

async function resolveClinicId(podiatristId: string): Promise<string | null> {
  const row = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, podiatristId))
    .limit(1);
  return row[0]?.clinicId ?? null;
}

export async function computeLiveDayTotals(
  podiatristId: string,
  closeDate: string
): Promise<LiveDayTotals> {
  const { fromIso, toIso } = dayBounds(closeDate);

  const paidRows = await database
    .select({
      amountCents: checkoutHandoffs.amountCents,
      paymentMethod: checkoutHandoffs.paymentMethod,
      paidAt: checkoutHandoffs.paidAt,
    })
    .from(checkoutHandoffs)
    .where(
      and(
        eq(checkoutHandoffs.podiatristId, podiatristId),
        eq(checkoutHandoffs.status, 'paid'),
        gte(checkoutHandoffs.paidAt, fromIso),
        lte(checkoutHandoffs.paidAt, toIso)
      )
    );

  const pendingRows = await database
    .select({
      amountCents: checkoutHandoffs.amountCents,
    })
    .from(checkoutHandoffs)
    .where(
      and(
        eq(checkoutHandoffs.podiatristId, podiatristId),
        or(
          eq(checkoutHandoffs.status, 'awaiting_amount'),
          eq(checkoutHandoffs.status, 'ready_for_payment')
        )
      )
    );

  const byMethod: Record<string, { totalCents: number; count: number }> = {};
  let paidCents = 0;
  for (const r of paidRows) {
    const cents = r.amountCents ?? 0;
    paidCents += cents;
    const method = r.paymentMethod || 'unknown';
    const prev = byMethod[method] ?? { totalCents: 0, count: 0 };
    byMethod[method] = { totalCents: prev.totalCents + cents, count: prev.count + 1 };
  }

  let pendingCents = 0;
  for (const r of pendingRows) {
    pendingCents += r.amountCents ?? 0;
  }

  return {
    closeDate,
    paidCents,
    paidCount: paidRows.length,
    pendingCents,
    pendingCount: pendingRows.length,
    byMethod,
    paidAfterCloseCents: 0,
  };
}

function mapClose(row: typeof dailySalesCloses.$inferSelect): DailyCloseSnapshot {
  let byMethod: Record<string, { totalCents: number; count: number }> = {};
  if (row.byMethodJson) {
    try {
      byMethod = JSON.parse(row.byMethodJson) as typeof byMethod;
    } catch {
      byMethod = {};
    }
  }
  return {
    id: row.id,
    closeDate: row.closeDate,
    podiatristId: row.podiatristId,
    clinicId: row.clinicId,
    paidCents: row.paidCents,
    paidCount: row.paidCount,
    pendingCents: row.pendingCents,
    pendingCount: row.pendingCount,
    byMethod,
    notes: row.notes,
    closedBy: row.closedBy,
    closedAt: row.closedAt,
  };
}

export async function getDailyClose(
  podiatristId: string,
  closeDate: string
): Promise<DailyCloseSnapshot | null> {
  const rows = await database
    .select()
    .from(dailySalesCloses)
    .where(
      and(eq(dailySalesCloses.podiatristId, podiatristId), eq(dailySalesCloses.closeDate, closeDate))
    )
    .limit(1);
  return rows[0] ? mapClose(rows[0]) : null;
}

export async function getTodayCloseStatus(
  podiatristId: string
): Promise<{
  closeDate: string;
  closed: boolean;
  close: DailyCloseSnapshot | null;
  live: LiveDayTotals;
}> {
  const closeDate = todayYmd();
  const close = await getDailyClose(podiatristId, closeDate);
  const live = await computeLiveDayTotals(podiatristId, closeDate);

  if (close) {
    live.paidAfterCloseCents = Math.max(0, live.paidCents - close.paidCents);
  }

  return {
    closeDate,
    closed: Boolean(close),
    close,
    live,
  };
}

export async function createDailyClose(input: {
  user: JWTPayload;
  podiatristId: string;
  closeDate?: string;
  notes?: string;
}): Promise<{ close: DailyCloseSnapshot } | { error: string; status: number }> {
  const deny = await assertCanManageDailyClose(input.user, input.podiatristId);
  if (deny) return { error: deny, status: 403 };

  const closeDate = input.closeDate?.trim() || todayYmd();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(closeDate)) {
    return { error: 'Fecha inválida', status: 400 };
  }

  const existing = await getDailyClose(input.podiatristId, closeDate);
  if (existing) {
    return { error: 'El día ya está cerrado', status: 409 };
  }

  const live = await computeLiveDayTotals(input.podiatristId, closeDate);
  const clinicId = await resolveClinicId(input.podiatristId);
  const id = `dsc_${crypto.randomUUID().replace(/-/g, '')}`;
  const closedAt = new Date().toISOString();

  await database.insert(dailySalesCloses).values({
    id,
    closeDate,
    podiatristId: input.podiatristId,
    clinicId,
    paidCents: live.paidCents,
    paidCount: live.paidCount,
    pendingCents: live.pendingCents,
    pendingCount: live.pendingCount,
    byMethodJson: JSON.stringify(live.byMethod),
    notes: input.notes?.trim() || null,
    closedBy: input.user.userId,
    closedAt,
  });

  const close = await getDailyClose(input.podiatristId, closeDate);
  if (!close) return { error: 'Error al guardar el cierre', status: 500 };
  return { close };
}

export async function listDailyCloses(input: {
  user: JWTPayload;
  podiatristId?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<DailyCloseSnapshot[]> {
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 90);
  const allowed = await listAccessiblePodiatristIds(input.user);

  let podiatristIds: string[];
  if (input.podiatristId) {
    const deny = await assertCanManageDailyClose(input.user, input.podiatristId);
    if (deny) return [];
    podiatristIds = [input.podiatristId];
  } else if (allowed === 'all') {
    // super_admin unlikely on checkout; treat as empty without filter
    return [];
  } else {
    podiatristIds = allowed;
  }

  if (podiatristIds.length === 0) return [];

  const conditions = [inArray(dailySalesCloses.podiatristId, podiatristIds)];
  if (input.from) conditions.push(gte(dailySalesCloses.closeDate, input.from));
  if (input.to) conditions.push(lte(dailySalesCloses.closeDate, input.to));

  const rows = await database
    .select()
    .from(dailySalesCloses)
    .where(and(...conditions))
    .orderBy(desc(dailySalesCloses.closeDate))
    .limit(limit);

  return rows.map(mapClose);
}

/** Resolve default podiatrist scope for "today" endpoints. */
export async function resolveDefaultClosePodiatristId(
  user: JWTPayload,
  queryPodiatristId?: string
): Promise<string | null> {
  if (user.role === 'podiatrist') return user.userId;
  if (queryPodiatristId) {
    const deny = await assertCanManageDailyClose(user, queryPodiatristId);
    return deny ? null : queryPodiatristId;
  }
  if (user.role === 'receptionist') {
    const assigned = await getAssignedPodiatristUserIds(user.userId);
    return assigned[0] ?? null;
  }
  if (user.role === 'clinic_admin' && user.clinicId) {
    const row = await database
      .select({ userId: createdUsers.userId })
      .from(createdUsers)
      .where(
        and(eq(createdUsers.clinicId, user.clinicId), eq(createdUsers.role, 'podiatrist'))
      )
      .limit(1);
    return row[0]?.userId ?? null;
  }
  return null;
}
