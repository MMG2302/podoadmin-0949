import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { database } from '../database';
import { checkoutHandoffs } from '../database/schema';

export type PatientLtvPeriod = 'day' | 'week' | 'month' | 'year' | 'lifetime';

export type PatientLtvStats = {
  ltvCents: number;
  ltvPaidCount: number;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Lunes 00:00 de la semana del ancla (ISO-ish lokal). */
function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff));
}

function periodPaidAtRange(period: PatientLtvPeriod): { fromIso: string; toIso: string } | null {
  if (period === 'lifetime') return null;
  const now = new Date();
  let from: Date;
  if (period === 'day') {
    from = startOfDay(now);
  } else if (period === 'week') {
    from = startOfWeek(now);
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return {
    fromIso: from.toISOString(),
    toIso: now.toISOString(),
  };
}

export function parsePatientLtvPeriod(raw: string | undefined | null): PatientLtvPeriod {
  if (raw === 'day' || raw === 'week' || raw === 'month' || raw === 'year' || raw === 'lifetime') {
    return raw;
  }
  return 'lifetime';
}

/**
 * Suma de cobros pagados por paciente en el periodo, restringido al alcance de podólogos.
 */
export async function fetchPatientLtvMap(options: {
  patientIds: string[];
  period: PatientLtvPeriod;
  allowedPodiatristIds: string[] | 'all';
}): Promise<Map<string, PatientLtvStats>> {
  const map = new Map<string, PatientLtvStats>();
  const ids = [...new Set(options.patientIds.filter(Boolean))];
  if (ids.length === 0) return map;
  if (options.allowedPodiatristIds !== 'all' && options.allowedPodiatristIds.length === 0) {
    return map;
  }

  const range = periodPaidAtRange(options.period);
  const conditions = [
    inArray(checkoutHandoffs.patientId, ids),
    eq(checkoutHandoffs.status, 'paid'),
  ];

  if (options.allowedPodiatristIds !== 'all') {
    conditions.push(inArray(checkoutHandoffs.podiatristId, options.allowedPodiatristIds));
  }
  if (range) {
    conditions.push(gte(checkoutHandoffs.paidAt, range.fromIso));
    conditions.push(lte(checkoutHandoffs.paidAt, range.toIso));
  }

  const rows = await database
    .select({
      patientId: checkoutHandoffs.patientId,
      ltvCents: sql<number>`coalesce(sum(${checkoutHandoffs.amountCents}), 0)`,
      ltvPaidCount: sql<number>`count(*)`,
    })
    .from(checkoutHandoffs)
    .where(and(...conditions))
    .groupBy(checkoutHandoffs.patientId);

  for (const row of rows) {
    map.set(row.patientId, {
      ltvCents: Math.round(Number(row.ltvCents) || 0),
      ltvPaidCount: Math.round(Number(row.ltvPaidCount) || 0),
    });
  }

  return map;
}
