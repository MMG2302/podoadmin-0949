import { and, eq, gte, inArray, isNotNull, lte } from 'drizzle-orm';
import { database } from '../database';
import { appointments as appointmentsTable, patients as patientsTable } from '../database/schema';
import type { ClinicalListScope } from './clinical-list-scope';

export type SatisfactionSummary = {
  periodDays: number;
  fromDate: string;
  toDate: string;
  totals: { good: number; regular: number; bad: number; total: number; satisfactionRate: number };
  comments: Array<{
    appointmentId: string;
    rating: 'good' | 'regular' | 'bad';
    comment: string;
    patientName: string | null; // null cuando el paciente pidió anonimato
    date: string;
    createdAt: string | null;
  }>;
};

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function fetchSatisfactionSummary(options: {
  scope: ClinicalListScope;
  podiatristUserId?: string;
  days?: number;
}): Promise<SatisfactionSummary> {
  const periodDays = Math.min(Math.max(options.days ?? 30, 7), 365);
  const today = new Date();
  const toDate = formatDate(today);
  const from = new Date(today);
  from.setDate(from.getDate() - (periodDays - 1));
  const fromDate = formatDate(from);

  const empty: SatisfactionSummary = {
    periodDays,
    fromDate,
    toDate,
    totals: { good: 0, regular: 0, bad: 0, total: 0, satisfactionRate: 0 },
    comments: [],
  };
  if (options.scope.mode === 'none') return empty;

  const conditions = [
    gte(appointmentsTable.sessionDate, fromDate),
    lte(appointmentsTable.sessionDate, toDate),
    isNotNull(appointmentsTable.satisfactionRating),
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

  const rows = await database
    .select({
      id: appointmentsTable.id,
      patientId: appointmentsTable.patientId,
      pendingPatientName: appointmentsTable.pendingPatientName,
      sessionDate: appointmentsTable.sessionDate,
      rating: appointmentsTable.satisfactionRating,
      comment: appointmentsTable.satisfactionComment,
      anonymous: appointmentsTable.satisfactionAnonymous,
      respondedAt: appointmentsTable.satisfactionRespondedAt,
    })
    .from(appointmentsTable)
    .where(and(...conditions));

  const totals = { good: 0, regular: 0, bad: 0 };
  for (const r of rows) {
    if (r.rating === 'good') totals.good++;
    else if (r.rating === 'regular') totals.regular++;
    else if (r.rating === 'bad') totals.bad++;
  }
  const total = totals.good + totals.regular + totals.bad;
  const satisfactionRate = total > 0 ? Math.round((totals.good / total) * 100) : 0;

  // Resolver nombres solo para comentarios NO anónimos.
  const namedPatientIds = [
    ...new Set(rows.filter((r) => r.comment && !r.anonymous && r.patientId).map((r) => r.patientId as string)),
  ];
  const nameById = new Map<string, string>();
  if (namedPatientIds.length > 0) {
    const pRows = await database
      .select({ id: patientsTable.id, firstName: patientsTable.firstName, lastName: patientsTable.lastName })
      .from(patientsTable)
      .where(inArray(patientsTable.id, namedPatientIds));
    for (const p of pRows) nameById.set(p.id, `${p.firstName} ${p.lastName}`.trim());
  }

  const comments = rows
    .filter((r) => r.comment && r.comment.trim())
    .map((r) => {
      let patientName: string | null = null;
      if (!r.anonymous) {
        patientName = (r.patientId ? nameById.get(r.patientId) : null) || r.pendingPatientName?.trim() || null;
      }
      return {
        appointmentId: r.id,
        rating: r.rating as 'good' | 'regular' | 'bad',
        comment: r.comment!.trim(),
        patientName,
        date: r.sessionDate,
        createdAt: r.respondedAt ?? null,
      };
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return {
    periodDays,
    fromDate,
    toDate,
    totals: { ...totals, total, satisfactionRate },
    comments,
  };
}
