import { inArray, sql, type SQL } from 'drizzle-orm';
import { database } from '../database';
import { clinicalSessions as sessionsTable, patients as patientsTable } from '../database/schema';

/** Días sin cita para considerar un paciente "recuperado". */
export const RECOVERED_GAP_DAYS = 180;

export const INACTIVE_3M_DAYS = 90;
export const INACTIVE_6M_DAYS = 180;

export type PatientSegment = 'new' | 'recurrent' | 'recovered';
export type PatientInactiveFilter = '3m' | '6m';

export function inactiveDaysForFilter(inactive: PatientInactiveFilter): number {
  return inactive === '3m' ? INACTIVE_3M_DAYS : INACTIVE_6M_DAYS;
}

/** Días desde la última sesión; null si nunca tuvo. */
export function daysSinceLastSession(
  lastSessionDate: string | null | undefined,
  today: Date = new Date()
): number | null {
  if (!lastSessionDate?.trim()) return null;
  const last = new Date(`${lastSessionDate.trim()}T12:00:00`);
  if (Number.isNaN(last.getTime())) return null;
  const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  return Math.max(0, Math.round((todayNoon.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Inactivo: sin sesiones, o última sesión hace >= thresholdDays. */
export function isPatientInactive(
  stats: { sessionCount: number; lastSessionDate: string | null },
  thresholdDays: number,
  today: Date = new Date()
): boolean {
  if (stats.sessionCount <= 0 || !stats.lastSessionDate) return true;
  const days = daysSinceLastSession(stats.lastSessionDate, today);
  return days == null || days >= thresholdDays;
}

export function computeAgeYears(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth?.trim()) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 130 ? age : null;
}

export function daysBetweenDates(earlier: string, later: string): number {
  const d1 = new Date(`${earlier}T12:00:00`);
  const d2 = new Date(`${later}T12:00:00`);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  return Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function computePatientSegment(
  sessionCount: number,
  lastSessionDate: string | null,
  previousSessionDate: string | null
): PatientSegment {
  if (sessionCount <= 1) return 'new';
  if (previousSessionDate && lastSessionDate) {
    const gap = daysBetweenDates(previousSessionDate, lastSessionDate);
    if (gap >= RECOVERED_GAP_DAYS) return 'recovered';
  }
  return 'recurrent';
}

/** Expresión SQLite para edad en años a partir de date_of_birth. */
export function sqlPatientAgeYears(): SQL {
  return sql`(CAST(strftime('%Y', 'now') AS INTEGER) - CAST(strftime('%Y', ${patientsTable.dateOfBirth}) AS INTEGER) - CASE WHEN strftime('%m-%d', 'now') < strftime('%m-%d', ${patientsTable.dateOfBirth}) THEN 1 ELSE 0 END)`;
}

export function sqlSegmentFromStats(): SQL {
  return sql`CASE
    WHEN COALESCE(ss.session_count, 0) <= 1 THEN 'new'
    WHEN ss.session_count >= 2
      AND ss.previous_session IS NOT NULL
      AND (julianday(ss.last_session) - julianday(ss.previous_session)) >= ${RECOVERED_GAP_DAYS}
      THEN 'recovered'
    WHEN ss.session_count >= 2 THEN 'recurrent'
    ELSE 'new'
  END`;
}

export function buildAgeRangeCondition(ageMin?: number, ageMax?: number): SQL | undefined {
  const parts: SQL[] = [];
  if (ageMin !== undefined) {
    parts.push(sql`${sqlPatientAgeYears()} >= ${ageMin}`);
  }
  if (ageMax !== undefined) {
    parts.push(sql`${sqlPatientAgeYears()} <= ${ageMax}`);
  }
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return sql`${parts[0]} AND ${parts[1]}`;
}

export function buildSegmentCondition(segment: PatientSegment): SQL {
  return sql`${sqlSegmentFromStats()} = ${segment}`;
}

export type PatientSessionStats = {
  sessionCount: number;
  lastSessionDate: string | null;
  previousSessionDate: string | null;
};

export async function fetchSessionStatsByPatientIds(
  patientIds: string[]
): Promise<Map<string, PatientSessionStats>> {
  const result = new Map<string, PatientSessionStats>();
  if (patientIds.length === 0) return result;

  const rows = await database
    .select({
      patientId: sessionsTable.patientId,
      sessionCount: sql<number>`count(*)`,
      lastSessionDate: sql<string | null>`max(${sessionsTable.sessionDate})`,
    })
    .from(sessionsTable)
    .where(inArray(sessionsTable.patientId, patientIds))
    .groupBy(sessionsTable.patientId);

  for (const row of rows) {
    result.set(row.patientId, {
      sessionCount: Number(row.sessionCount),
      lastSessionDate: row.lastSessionDate ?? null,
      previousSessionDate: null,
    });
  }

  const needsPrevious = [...result.entries()].filter(([, s]) => s.sessionCount >= 2).map(([id]) => id);
  if (needsPrevious.length > 0) {
    const sessionRows = await database
      .select({
        patientId: sessionsTable.patientId,
        sessionDate: sessionsTable.sessionDate,
      })
      .from(sessionsTable)
      .where(inArray(sessionsTable.patientId, needsPrevious))
      .orderBy(sessionsTable.patientId, sessionsTable.sessionDate);

    const byPatient = new Map<string, string[]>();
    for (const row of sessionRows) {
      const list = byPatient.get(row.patientId) ?? [];
      list.push(row.sessionDate);
      byPatient.set(row.patientId, list);
    }
    for (const [patientId, dates] of byPatient) {
      const stats = result.get(patientId);
      if (!stats || dates.length < 2) continue;
      stats.previousSessionDate = dates[dates.length - 2] ?? null;
    }
  }

  return result;
}

export type DemographicsSummary = {
  new: number;
  recurrent: number;
  recovered: number;
  total: number;
  withAge: number;
  inactive3m: number;
  inactive6m: number;
  ageBuckets: Array<{ label: string; min: number; max: number; count: number }>;
};

const AGE_BUCKETS = [
  { label: '0-17', min: 0, max: 17 },
  { label: '18-35', min: 18, max: 35 },
  { label: '36-55', min: 36, max: 55 },
  { label: '56+', min: 56, max: 130 },
] as const;

export function buildDemographicsSummary(
  patients: Array<{ id: string; dateOfBirth: string }>,
  sessionStats: Map<string, PatientSessionStats>
): DemographicsSummary {
  const today = new Date();
  const summary: DemographicsSummary = {
    new: 0,
    recurrent: 0,
    recovered: 0,
    total: patients.length,
    withAge: 0,
    inactive3m: 0,
    inactive6m: 0,
    ageBuckets: AGE_BUCKETS.map((b) => ({ ...b, count: 0 })),
  };

  for (const patient of patients) {
    const stats = sessionStats.get(patient.id) ?? {
      sessionCount: 0,
      lastSessionDate: null,
      previousSessionDate: null,
    };
    const segment = computePatientSegment(
      stats.sessionCount,
      stats.lastSessionDate,
      stats.previousSessionDate
    );
    summary[segment] += 1;

    if (isPatientInactive(stats, INACTIVE_3M_DAYS, today)) summary.inactive3m += 1;
    if (isPatientInactive(stats, INACTIVE_6M_DAYS, today)) summary.inactive6m += 1;

    const age = computeAgeYears(patient.dateOfBirth);
    if (age != null) {
      summary.withAge += 1;
      for (const bucket of summary.ageBuckets) {
        if (age >= bucket.min && age <= bucket.max) {
          bucket.count += 1;
          break;
        }
      }
    }
  }

  return summary;
}

export function patientMatchesDemographicsFilters(
  dateOfBirth: string,
  stats: PatientSessionStats,
  filters: {
    segment?: PatientSegment;
    ageMin?: number;
    ageMax?: number;
    inactive?: PatientInactiveFilter;
    minVisits?: number;
    maxVisits?: number;
  }
): boolean {
  if (filters.segment) {
    const segment = computePatientSegment(
      stats.sessionCount,
      stats.lastSessionDate,
      stats.previousSessionDate
    );
    if (segment !== filters.segment) return false;
  }
  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    const age = computeAgeYears(dateOfBirth);
    if (age == null) return false;
    if (filters.ageMin !== undefined && age < filters.ageMin) return false;
    if (filters.ageMax !== undefined && age > filters.ageMax) return false;
  }
  if (filters.inactive) {
    if (!isPatientInactive(stats, inactiveDaysForFilter(filters.inactive))) return false;
  }
  if (filters.minVisits !== undefined && stats.sessionCount < filters.minVisits) return false;
  if (filters.maxVisits !== undefined && stats.sessionCount > filters.maxVisits) return false;
  return true;
}
