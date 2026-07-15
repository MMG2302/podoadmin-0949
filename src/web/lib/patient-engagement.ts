/** Filtros de engagement/demografía compartidos (clínica + lista pacientes). */

export type PatientSegmentFilter = "new" | "recurrent" | "recovered";
export type PatientInactiveFilter = "3m" | "6m";
export type PatientLtvPeriod = "day" | "week" | "month" | "year" | "lifetime";

export type PatientEngagementLabels = {
  segmentNew: string;
  segmentRecurrent: string;
  segmentRecovered: string;
  inactive3m: string;
  inactive6m: string;
  ageAll: string;
  age0_17: string;
  age18_35: string;
  age36_55: string;
  age56Plus: string;
  ltvDay: string;
  ltvWeek: string;
  ltvMonth: string;
  ltvYear: string;
  ltvLifetime: string;
  visitSingular: string;
  visitPlural: string;
  paymentSingular: string;
  paymentPlural: string;
  noSessions: string;
  daysInactive: string;
  daysWithoutVisit: string;
  lastAgoDays: string;
};

export const LTV_PERIOD_STORAGE_KEY = "podoadmin.patients.ltvPeriod";

export function parseStoredLtvPeriod(raw: string | null | undefined): PatientLtvPeriod {
  if (raw === "day" || raw === "week" || raw === "month" || raw === "year" || raw === "lifetime") {
    return raw;
  }
  return "lifetime";
}

/** Rangos de edad (ids estables); el label se resuelve con i18n. */
export const AGE_RANGE_OPTIONS = [
  { id: "all" as const },
  { id: "0-17" as const, ageMin: 0, ageMax: 17 },
  { id: "18-35" as const, ageMin: 18, ageMax: 35 },
  { id: "36-55" as const, ageMin: 36, ageMax: 55 },
  { id: "56+" as const, ageMin: 56, ageMax: 130 },
] as const;

export type AgeRangeId = (typeof AGE_RANGE_OPTIONS)[number]["id"];

export type DemographicsSummary = {
  new: number;
  recurrent: number;
  recovered: number;
  total: number;
  withAge?: number;
  inactive3m?: number;
  inactive6m?: number;
  ageBuckets?: Array<{ label: string; min: number; max: number; count: number }>;
};

export function segmentLabel(labels: PatientEngagementLabels, segment: PatientSegmentFilter): string {
  const map = {
    new: labels.segmentNew,
    recurrent: labels.segmentRecurrent,
    recovered: labels.segmentRecovered,
  } as const;
  return map[segment];
}

export function inactiveLabel(labels: PatientEngagementLabels, key: PatientInactiveFilter): string {
  return key === "3m" ? labels.inactive3m : labels.inactive6m;
}

export function ltvPeriodLabel(labels: PatientEngagementLabels, key: PatientLtvPeriod): string {
  const map = {
    day: labels.ltvDay,
    week: labels.ltvWeek,
    month: labels.ltvMonth,
    year: labels.ltvYear,
    lifetime: labels.ltvLifetime,
  } as const;
  return map[key];
}

export function ageRangeLabel(labels: PatientEngagementLabels, id: AgeRangeId): string {
  const map: Record<AgeRangeId, string> = {
    all: labels.ageAll,
    "0-17": labels.age0_17,
    "18-35": labels.age18_35,
    "36-55": labels.age36_55,
    "56+": labels.age56Plus,
  };
  return map[id];
}

export function buildPatientListFilters(opts: {
  q?: string;
  createdBy?: string;
  segment?: "all" | PatientSegmentFilter;
  ageRangeId?: AgeRangeId;
  inactive?: "all" | PatientInactiveFilter;
  minVisits?: string;
  maxVisits?: string;
  ltvPeriod?: PatientLtvPeriod;
}): Record<string, string | undefined> {
  const filters: Record<string, string | undefined> = {};
  if (opts.q) filters.q = opts.q;
  if (opts.createdBy && opts.createdBy !== "all") filters.createdBy = opts.createdBy;
  if (opts.segment && opts.segment !== "all") filters.segment = opts.segment;
  const ageRange = AGE_RANGE_OPTIONS.find((o) => o.id === (opts.ageRangeId ?? "all"));
  if (ageRange && ageRange.id !== "all" && "ageMin" in ageRange) {
    filters.ageMin = String(ageRange.ageMin);
    filters.ageMax = String(ageRange.ageMax);
  }
  if (opts.inactive && opts.inactive !== "all") filters.inactive = opts.inactive;
  if (opts.minVisits?.trim()) filters.minVisits = opts.minVisits.trim();
  if (opts.maxVisits?.trim()) filters.maxVisits = opts.maxVisits.trim();
  if (opts.ltvPeriod) filters.ltvPeriod = opts.ltvPeriod;
  return filters;
}

export function formatVisitCount(
  count: number | undefined | null,
  labels: Pick<PatientEngagementLabels, "visitSingular" | "visitPlural">
): string {
  const n = count ?? 0;
  return `${n} ${n === 1 ? labels.visitSingular : labels.visitPlural}`;
}

export function formatLtvPaidCount(
  count: number | undefined | null,
  labels: Pick<PatientEngagementLabels, "paymentSingular" | "paymentPlural">
): string {
  const n = count ?? 0;
  return `${n} ${n === 1 ? labels.paymentSingular : labels.paymentPlural}`;
}

export function formatInactivityHint(
  daysSinceLastSession: number | null | undefined,
  sessionCount: number | undefined,
  labels: Pick<
    PatientEngagementLabels,
    "noSessions" | "daysInactive" | "daysWithoutVisit" | "lastAgoDays"
  >
): string {
  if ((sessionCount ?? 0) <= 0) return labels.noSessions;
  if (daysSinceLastSession == null) return labels.noSessions;
  const n = String(daysSinceLastSession);
  if (daysSinceLastSession >= 180) return labels.daysInactive.replace("{n}", n);
  if (daysSinceLastSession >= 90) return labels.daysWithoutVisit.replace("{n}", n);
  return labels.lastAgoDays.replace("{n}", n);
}
