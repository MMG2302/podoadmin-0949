import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { database } from '../database';
import { appointments as appointmentsTable } from '../database/schema';
import type { ClinicalListScope } from './clinical-list-scope';

export type AppointmentMetricsResult = {
  periodDays: number;
  fromDate: string;
  toDate: string;
  attendedPerDay: Array<{ date: string; count: number }>;
  totals: {
    attended: number;
    noShow: number;
    cancelled: number;
    scheduled: number;
    cancellationRate: number;
    noShowRate: number;
  };
};

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export async function fetchAppointmentMetrics(options: {
  scope: ClinicalListScope;
  clinicId?: string | null;
  podiatristUserId?: string;
  days?: number;
}): Promise<AppointmentMetricsResult> {
  const periodDays = Math.min(Math.max(options.days ?? 30, 7), 90);
  const today = new Date();
  const toDate = formatDate(today);
  const fromDate = formatDate(addDays(today, -(periodDays - 1)));

  const conditions = [
    gte(appointmentsTable.sessionDate, fromDate),
    lte(appointmentsTable.sessionDate, toDate),
  ];

  if (options.podiatristUserId) {
    conditions.push(eq(appointmentsTable.createdBy, options.podiatristUserId));
  } else if (options.scope.mode === 'clinic') {
    conditions.push(eq(appointmentsTable.clinicId, options.scope.clinicId));
  } else if (options.scope.mode === 'podiatrist') {
    conditions.push(eq(appointmentsTable.createdBy, options.scope.createdBy));
  } else if (options.scope.mode === 'receptionist') {
    conditions.push(inArray(appointmentsTable.createdBy, options.scope.createdByIn));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const rows = await database
    .select({
      sessionDate: appointmentsTable.sessionDate,
      status: appointmentsTable.status,
    })
    .from(appointmentsTable)
    .where(where);

  const attendedByDay = new Map<string, number>();
  let attended = 0;
  let noShow = 0;
  let cancelled = 0;
  let scheduled = 0;

  for (const row of rows) {
    if (row.status === 'completed') {
      attended += 1;
      attendedByDay.set(row.sessionDate, (attendedByDay.get(row.sessionDate) ?? 0) + 1);
    } else if (row.status === 'no_show') {
      noShow += 1;
    } else if (row.status === 'cancelled') {
      cancelled += 1;
    } else if (row.status === 'scheduled' || row.status === 'confirmed') {
      scheduled += 1;
    }
  }

  const resolvedTotal = attended + noShow + cancelled;
  const cancellationRate = resolvedTotal > 0 ? Math.round((cancelled / resolvedTotal) * 100) : 0;
  const noShowRate = resolvedTotal > 0 ? Math.round((noShow / resolvedTotal) * 100) : 0;

  const attendedPerDay: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < periodDays; i++) {
    const date = formatDate(addDays(new Date(`${fromDate}T12:00:00`), i));
    attendedPerDay.push({ date, count: attendedByDay.get(date) ?? 0 });
  }

  return {
    periodDays,
    fromDate,
    toDate,
    attendedPerDay,
    totals: {
      attended,
      noShow,
      cancelled,
      scheduled,
      cancellationRate,
      noShowRate,
    },
  };
}
