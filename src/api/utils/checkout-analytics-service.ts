import { and, eq, gte, inArray, isNotNull } from 'drizzle-orm';
import { database } from '../database';
import { checkoutHandoffs, clinics, createdUsers, patients, professionalInfo } from '../database/schema';
import { resolveCheckoutTariffs, parseCheckoutTariffsJson, DEFAULT_CHECKOUT_TARIFFS } from './checkout-tariffs';

export type CheckoutAnalyticsPeriod = 'day' | 'week' | 'month' | 'year';
export type CheckoutPaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface CheckoutAnalyticsPrefs {
  monthlyGoalCents: number;
  monthlyExpensesCents: number;
  defaultMarginPercent: number;
}

const DEFAULT_PREFS: CheckoutAnalyticsPrefs = {
  monthlyGoalCents: 0,
  monthlyExpensesCents: 0,
  defaultMarginPercent: 65,
};

export function parseCheckoutAnalyticsPrefs(json: string | null | undefined): CheckoutAnalyticsPrefs {
  if (!json) return { ...DEFAULT_PREFS };
  try {
    const parsed = JSON.parse(json) as Partial<CheckoutAnalyticsPrefs>;
    return {
      monthlyGoalCents: Math.max(0, Number(parsed.monthlyGoalCents) || 0),
      monthlyExpensesCents: Math.max(0, Number(parsed.monthlyExpensesCents) || 0),
      defaultMarginPercent: Math.min(
        100,
        Math.max(0, Number(parsed.defaultMarginPercent) || DEFAULT_PREFS.defaultMarginPercent)
      ),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return startOfDay(addDays(d, diff));
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function periodRange(period: CheckoutAnalyticsPeriod, anchor: Date): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
  const to = new Date(anchor);
  if (period === 'day') {
    const from = startOfDay(anchor);
    const prevTo = addDays(from, -1);
    return { from, to, prevFrom: startOfDay(prevTo), prevTo: new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate(), 23, 59, 59, 999) };
  }
  if (period === 'week') {
    const from = startOfWeek(anchor);
    const prevTo = addDays(from, -1);
    const prevFrom = startOfWeek(prevTo);
    return { from, to, prevFrom, prevTo: new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate(), 23, 59, 59, 999) };
  }
  if (period === 'month') {
    const from = startOfMonth(anchor);
    const prevTo = addDays(from, -1);
    return { from, to, prevFrom: startOfMonth(prevTo), prevTo };
  }
  const from = startOfYear(anchor);
  const prevTo = addDays(from, -1);
  return { from, to, prevFrom: startOfYear(prevTo), prevTo };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function aggregateByPatient(rows: HandoffRow): Map<string, { totalCents: number; count: number }> {
  const map = new Map<string, { totalCents: number; count: number }>();
  for (const r of rows) {
    const prev = map.get(r.patientId) ?? { totalCents: 0, count: 0 };
    map.set(r.patientId, {
      totalCents: prev.totalCents + (r.amountCents ?? 0),
      count: prev.count + 1,
    });
  }
  return map;
}

function truncatePatientLabel(name: string, max = 10): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  const first = trimmed.split(/\s+/)[0] ?? trimmed;
  return first.length <= max ? first : `${first.slice(0, max - 1)}…`;
}

async function loadPatientNameMap(patientIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (patientIds.length === 0) return map;
  const patientRows = await database
    .select({ id: patients.id, firstName: patients.firstName, lastName: patients.lastName })
    .from(patients)
    .where(inArray(patients.id, patientIds));
  for (const p of patientRows) {
    map.set(p.id, `${p.firstName} ${p.lastName}`.trim());
  }
  return map;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Clave estable YYYY-MM; el cliente formatea según idioma. */
function monthLabel(key: string): string {
  return key;
}

type HandoffRow = {
  amountCents: number | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
  paymentMethod: string | null;
  patientId: string;
  podiatristId: string;
  notes: string | null;
};

type PaidIndexed = HandoffRow & { paidTs: number };

const ANALYTICS_CACHE_TTL_MS = 20_000;
const analyticsCache = new Map<string, { expiresAt: number; data: Record<string, unknown> }>();

function buildAnalyticsCacheKey(scope: CheckoutAnalyticsScope, period: CheckoutAnalyticsPeriod): string {
  if (scope.kind === 'podiatrist') {
    return `p:${scope.podiatristId}:${period}`;
  }
  return `c:${scope.clinicId}:${[...scope.podiatristIds].sort().join(',')}:${period}`;
}

function indexPaidRows(rows: HandoffRow[]): PaidIndexed[] {
  const out: PaidIndexed[] = [];
  for (const r of rows) {
    if (!r.paidAt) continue;
    out.push({ ...r, paidTs: new Date(r.paidAt).getTime() });
  }
  return out;
}

function sumCountPaidIn(paidRows: PaidIndexed[], start: Date, end: Date): { total: number; count: number } {
  const fromTs = start.getTime();
  const toTs = end.getTime();
  let total = 0;
  let count = 0;
  for (const r of paidRows) {
    if (r.paidTs >= fromTs && r.paidTs <= toTs) {
      total += r.amountCents ?? 0;
      count += 1;
    }
  }
  return { total, count };
}

function filterPaidIn(paidRows: PaidIndexed[], start: Date, end: Date): PaidIndexed[] {
  const fromTs = start.getTime();
  const toTs = end.getTime();
  return paidRows.filter((r) => r.paidTs >= fromTs && r.paidTs <= toTs);
}

export type CheckoutAnalyticsScope =
  | { kind: 'podiatrist'; podiatristId: string; clinicId: string | null; label: string }
  | { kind: 'clinic'; clinicId: string; podiatristIds: string[]; label: string };

async function resolveTariffsForScope(scope: CheckoutAnalyticsScope): Promise<
  Awaited<ReturnType<typeof resolveCheckoutTariffs>>
> {
  const byKey = new Map<string, Awaited<ReturnType<typeof resolveCheckoutTariffs>>[number]>();
  const addTariffs = (items: Awaited<ReturnType<typeof resolveCheckoutTariffs>>) => {
    for (const t of items) {
      byKey.set(`${t.amountCents}:${t.label}`, t);
    }
  };

  if (scope.kind === 'clinic') {
    const [clinicRows, proRows] = await Promise.all([
      database
        .select({ checkoutTariffsJson: clinics.checkoutTariffsJson })
        .from(clinics)
        .where(eq(clinics.clinicId, scope.clinicId))
        .limit(1),
      scope.podiatristIds.length > 0
        ? database
            .select({
              userId: professionalInfo.userId,
              checkoutTariffsJson: professionalInfo.checkoutTariffsJson,
            })
            .from(professionalInfo)
            .where(inArray(professionalInfo.userId, scope.podiatristIds))
        : Promise.resolve([]),
    ]);

    const clinicFallback =
      clinicRows[0]?.checkoutTariffsJson?.trim()
        ? parseCheckoutTariffsJson(clinicRows[0].checkoutTariffsJson)
        : [...DEFAULT_CHECKOUT_TARIFFS];
    addTariffs(clinicFallback);

    for (const row of proRows) {
      if (row.checkoutTariffsJson?.trim()) {
        addTariffs(parseCheckoutTariffsJson(row.checkoutTariffsJson));
      }
    }
  } else {
    addTariffs(await resolveCheckoutTariffs(scope.podiatristId, scope.clinicId));
  }

  return [...byKey.values()];
}

async function loadPrefsForScope(scope: CheckoutAnalyticsScope): Promise<CheckoutAnalyticsPrefs> {
  if (scope.kind === 'clinic') {
    const row = await database
      .select({ checkoutAnalyticsJson: clinics.checkoutAnalyticsJson })
      .from(clinics)
      .where(eq(clinics.clinicId, scope.clinicId))
      .limit(1);
    return parseCheckoutAnalyticsPrefs(row[0]?.checkoutAnalyticsJson);
  }
  const row = await database
    .select({ checkoutAnalyticsJson: professionalInfo.checkoutAnalyticsJson })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, scope.podiatristId))
    .limit(1);
  return parseCheckoutAnalyticsPrefs(row[0]?.checkoutAnalyticsJson);
}

export async function getCheckoutAnalytics(
  scope: CheckoutAnalyticsScope,
  period: CheckoutAnalyticsPeriod
): Promise<Record<string, unknown>> {
  const cacheKey = buildAnalyticsCacheKey(scope, period);
  const cached = analyticsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const data = await computeCheckoutAnalytics(scope, period);
  analyticsCache.set(cacheKey, { expiresAt: Date.now() + ANALYTICS_CACHE_TTL_MS, data });
  return data;
}

async function computeCheckoutAnalytics(
  scope: CheckoutAnalyticsScope,
  period: CheckoutAnalyticsPeriod
): Promise<Record<string, unknown>> {
  const now = new Date();
  const { from, to, prevFrom, prevTo } = periodRange(period, now);
  const lookback = new Date(now);
  lookback.setMonth(lookback.getMonth() - 13);

  const podiatristIds =
    scope.kind === 'clinic' ? scope.podiatristIds : [scope.podiatristId];
  const podiatristFilter = inArray(
    checkoutHandoffs.podiatristId,
    podiatristIds.length > 0 ? podiatristIds : ['__none__']
  );
  const clinicFilter =
    scope.kind === 'clinic' ? eq(checkoutHandoffs.clinicId, scope.clinicId) : undefined;

  const handoffSelect = {
    amountCents: checkoutHandoffs.amountCents,
    status: checkoutHandoffs.status,
    paidAt: checkoutHandoffs.paidAt,
    createdAt: checkoutHandoffs.createdAt,
    paymentMethod: checkoutHandoffs.paymentMethod,
    patientId: checkoutHandoffs.patientId,
    podiatristId: checkoutHandoffs.podiatristId,
    notes: checkoutHandoffs.notes,
  };

  const paidWhere = clinicFilter
    ? and(
        podiatristFilter,
        clinicFilter,
        eq(checkoutHandoffs.status, 'paid'),
        isNotNull(checkoutHandoffs.paidAt),
        gte(checkoutHandoffs.paidAt, lookback.toISOString())
      )
    : and(
        podiatristFilter,
        eq(checkoutHandoffs.status, 'paid'),
        isNotNull(checkoutHandoffs.paidAt),
        gte(checkoutHandoffs.paidAt, lookback.toISOString())
      );

  const pendingWhere = clinicFilter
    ? and(
        podiatristFilter,
        clinicFilter,
        inArray(checkoutHandoffs.status, ['awaiting_amount', 'ready_for_payment'])
      )
    : and(
        podiatristFilter,
        inArray(checkoutHandoffs.status, ['awaiting_amount', 'ready_for_payment'])
      );

  const [paidRowsRaw, pendingRows, prefs, tariffs] = await Promise.all([
    database.select(handoffSelect).from(checkoutHandoffs).where(paidWhere),
    database.select(handoffSelect).from(checkoutHandoffs).where(pendingWhere),
    loadPrefsForScope(scope),
    resolveTariffsForScope(scope),
  ]);

  const paidRows = indexPaidRows(paidRowsRaw);
  const sumPaidIn = (start: Date, end: Date) => sumCountPaidIn(paidRows, start, end).total;
  const countPaidIn = (start: Date, end: Date) => sumCountPaidIn(paidRows, start, end).count;

  const currentPeriod = sumCountPaidIn(paidRows, from, to);
  const previousPeriod = sumCountPaidIn(paidRows, prevFrom, prevTo);
  const currentTotalCents = currentPeriod.total;
  const previousTotalCents = previousPeriod.total;

  const paidInPeriod = filterPaidIn(paidRows, from, to);
  const paidInPrevPeriod = filterPaidIn(paidRows, prevFrom, prevTo);
  const currentByPatient = aggregateByPatient(paidInPeriod);
  const previousByPatient = aggregateByPatient(paidInPrevPeriod);
  const uniquePatientsCount = currentByPatient.size;
  const previousUniquePatientsCount = previousByPatient.size;
  const averageSalePerPatientCents =
    uniquePatientsCount > 0 ? Math.round(currentTotalCents / uniquePatientsCount) : 0;
  const previousAverageSalePerPatientCents =
    previousUniquePatientsCount > 0
      ? Math.round(previousTotalCents / previousUniquePatientsCount)
      : 0;

  const series: { label: string; paidCents: number; count: number }[] = [];

  if (period === 'day') {
    for (let h = 0; h < 24; h += 3) {
      const bucketStart = new Date(from);
      bucketStart.setHours(h, 0, 0, 0);
      const bucketEnd = new Date(from);
      bucketEnd.setHours(h + 2, 59, 59, 999);
      const bucket = sumCountPaidIn(paidRows, bucketStart, bucketEnd);
      series.push({
        label: `${String(h).padStart(2, '0')}:00`,
        paidCents: bucket.total,
        count: bucket.count,
      });
    }
  } else if (period === 'week') {
    for (let i = 0; i < 7; i++) {
      const dayStart = addDays(from, i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const bucket = sumCountPaidIn(paidRows, dayStart, dayEnd);
      series.push({
        label: toIsoDate(dayStart),
        paidCents: bucket.total,
        count: bucket.count,
      });
    }
  } else if (period === 'month') {
    const daysInMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
    for (let w = 0; w < 5; w++) {
      const weekStart = addDays(from, w * 7);
      if (weekStart.getMonth() !== from.getMonth() && weekStart > from) break;
      const weekEnd = addDays(weekStart, 6);
      weekEnd.setHours(23, 59, 59, 999);
      const bucket = sumCountPaidIn(paidRows, weekStart, weekEnd);
      series.push({
        label: `W${w + 1}`,
        paidCents: bucket.total,
        count: bucket.count,
      });
      if (weekStart.getDate() + 7 > daysInMonth) break;
    }
  } else {
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(from.getFullYear(), m, 1);
      const monthEnd = new Date(from.getFullYear(), m + 1, 0, 23, 59, 59, 999);
      const bucket = sumCountPaidIn(paidRows, monthStart, monthEnd);
      series.push({
        label: monthKey(monthStart),
        paidCents: bucket.total,
        count: bucket.count,
      });
    }
  }

  const comparisonSeries: {
    label: string;
    previousLabel: string;
    currentCents: number;
    previousCents: number;
  }[] = [];
  if (period === 'month') {
    for (let m = 0; m < 6; m++) {
      const curStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const curEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59, 999);
      const prevStart = new Date(curStart);
      prevStart.setMonth(prevStart.getMonth() - 1);
      const prevEnd = new Date(curEnd);
      prevEnd.setMonth(prevEnd.getMonth() - 1);
      comparisonSeries.unshift({
        label: monthLabel(monthKey(curStart)),
        previousLabel: monthLabel(monthKey(prevStart)),
        currentCents: sumPaidIn(curStart, curEnd),
        previousCents: sumPaidIn(prevStart, prevEnd),
      });
    }
  }

  const pendingTotalCents = pendingRows.reduce((a, r) => a + (r.amountCents ?? 0), 0);
  const paidAllTimeCents = paidRows.reduce((a, r) => a + (r.amountCents ?? 0), 0);

  const methodTotals = new Map<string, { totalCents: number; count: number }>();
  for (const r of paidInPeriod) {
    const method = r.paymentMethod || 'unknown';
    const prev = methodTotals.get(method) ?? { totalCents: 0, count: 0 };
    methodTotals.set(method, {
      totalCents: prev.totalCents + (r.amountCents ?? 0),
      count: prev.count + 1,
    });
  }

  const patientPending = new Map<string, { totalCents: number; count: number }>();
  for (const r of pendingRows) {
    if ((r.amountCents ?? 0) <= 0) continue;
    const prev = patientPending.get(r.patientId) ?? { totalCents: 0, count: 0 };
    patientPending.set(r.patientId, {
      totalCents: prev.totalCents + (r.amountCents ?? 0),
      count: prev.count + 1,
    });
  }

  const patientIdsForNames = [
    ...new Set([...currentByPatient.keys(), ...patientPending.keys()]),
  ];
  const patientNameMap = await loadPatientNameMap(patientIdsForNames);

  const salesByPatient = [...currentByPatient.entries()]
    .map(([patientId, data]) => ({
      patientId,
      patientName: patientNameMap.get(patientId) || 'Paciente',
      chartLabel: truncatePatientLabel(patientNameMap.get(patientId) || 'Paciente'),
      totalCents: data.totalCents,
      visitCount: data.count,
      averageCents: data.count > 0 ? Math.round(data.totalCents / data.count) : 0,
    }))
    .sort((a, b) => b.averageCents - a.averageCents)
    .slice(0, 10);

  const receivablesByPatient = [...patientPending.entries()]
    .map(([patientId, data]) => ({
      patientId,
      patientName: patientNameMap.get(patientId) || 'Paciente',
      totalCents: data.totalCents,
      count: data.count,
    }))
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 10);

  const monthlyCashFlow: { month: string; label: string; paidCents: number }[] = [];
  for (let m = 11; m >= 0; m--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59, 999);
    const key = monthKey(monthStart);
    monthlyCashFlow.push({
      month: key,
      label: monthLabel(key),
      paidCents: sumPaidIn(monthStart, monthEnd),
    });
  }

  const accountsReceivableCents = pendingTotalCents;

  const monthStart = startOfMonth(now);
  const actualSalesCents = sumPaidIn(monthStart, now);
  const daysElapsed = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthEndProjectionCents = Math.round((actualSalesCents / daysElapsed) * daysInMonth);
  const estimatedProfitCents = actualSalesCents - Math.round(
    (prefs.monthlyExpensesCents / daysInMonth) * daysElapsed
  );
  const goalProgressPercent =
    prefs.monthlyGoalCents > 0
      ? Math.round((actualSalesCents / prefs.monthlyGoalCents) * 1000) / 10
      : null;

  const tariffByAmount = new Map<number, string>();
  const tariffLabels = new Set<string>();
  for (const t of tariffs) {
    tariffLabels.add(t.label);
    if (!tariffByAmount.has(t.amountCents)) {
      tariffByAmount.set(t.amountCents, t.label);
    }
  }

  const resolveServiceLabel = (amountCents: number, notes: string | null | undefined): string => {
    const note = notes?.trim();
    if (note && tariffLabels.has(note)) return note;
    const byAmount = tariffByAmount.get(amountCents);
    if (byAmount) return byAmount;
    if (note) return note;
    return 'Otros servicios';
  };

  const aggregateByService = (rows: PaidIndexed[]) => {
    const map = new Map<string, { totalCents: number; count: number }>();
    for (const r of rows) {
      const amount = r.amountCents ?? 0;
      const label = resolveServiceLabel(amount, r.notes);
      const prev = map.get(label) ?? { totalCents: 0, count: 0 };
      map.set(label, { totalCents: prev.totalCents + amount, count: prev.count + 1 });
    }
    return map;
  };

  const salesByServiceMap = aggregateByService(paidInPeriod);
  const salesByService = [...salesByServiceMap.entries()]
    .map(([label, data]) => ({
      label,
      totalCents: data.totalCents,
      count: data.count,
      sharePercent:
        currentTotalCents > 0
          ? Math.round((data.totalCents / currentTotalCents) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents);

  const marginByServiceMap = aggregateByService(filterPaidIn(paidRows, monthStart, now));
  const marginByService = [...marginByServiceMap.entries()]
    .map(([label, data]) => ({
      label,
      totalCents: data.totalCents,
      count: data.count,
      marginPercent: prefs.defaultMarginPercent,
      estimatedProfitCents: Math.round(data.totalCents * (prefs.defaultMarginPercent / 100)),
    }))
    .sort((a, b) => b.totalCents - a.totalCents);

  const growthTrend12Months = monthlyCashFlow.map((entry, idx, arr) => {
    const prev = idx > 0 ? arr[idx - 1].paidCents : 0;
    return {
      month: entry.month,
      label: entry.label,
      paidCents: entry.paidCents,
      changePercent: pctChange(entry.paidCents, prev),
    };
  });

  let salesByPodiatrist: {
    podiatristId: string;
    podiatristName: string;
    totalCents: number;
    count: number;
    averageCents: number;
  }[] = [];

  let collectionsByPodiatrist: {
    podiatristId: string;
    podiatristName: string;
    paidCents: number;
    paidCount: number;
    pendingCents: number;
    pendingCount: number;
  }[] = [];

  if (scope.kind === 'clinic' && scope.podiatristIds.length > 0) {
    const podPaid = new Map<string, { totalCents: number; count: number }>();
    for (const r of paidInPeriod) {
      const amount = r.amountCents ?? 0;
      const prev = podPaid.get(r.podiatristId) ?? { totalCents: 0, count: 0 };
      podPaid.set(r.podiatristId, {
        totalCents: prev.totalCents + amount,
        count: prev.count + 1,
      });
    }
    const podPending = new Map<string, { totalCents: number; count: number }>();
    for (const r of pendingRows) {
      const amount = r.amountCents ?? 0;
      const prev = podPending.get(r.podiatristId) ?? { totalCents: 0, count: 0 };
      podPending.set(r.podiatristId, {
        totalCents: prev.totalCents + amount,
        count: prev.count + 1,
      });
    }
    const allPodIds = [...new Set([...podPaid.keys(), ...podPending.keys()])];
    const podNameRows =
      allPodIds.length > 0
        ? await database
            .select({ userId: createdUsers.userId, name: createdUsers.name })
            .from(createdUsers)
            .where(inArray(createdUsers.userId, allPodIds))
        : [];
    const podNameMap = new Map(podNameRows.map((r) => [r.userId, r.name]));

    salesByPodiatrist = [...podPaid.entries()]
      .map(([podiatristId, data]) => ({
        podiatristId,
        podiatristName: podNameMap.get(podiatristId) || 'Podólogo',
        totalCents: data.totalCents,
        count: data.count,
        averageCents: data.count > 0 ? Math.round(data.totalCents / data.count) : 0,
      }))
      .sort((a, b) => b.totalCents - a.totalCents);

    collectionsByPodiatrist = allPodIds
      .map((podiatristId) => {
        const paid = podPaid.get(podiatristId) ?? { totalCents: 0, count: 0 };
        const pending = podPending.get(podiatristId) ?? { totalCents: 0, count: 0 };
        return {
          podiatristId,
          podiatristName: podNameMap.get(podiatristId) || 'Podólogo',
          paidCents: paid.totalCents,
          paidCount: paid.count,
          pendingCents: pending.totalCents,
          pendingCount: pending.count,
        };
      })
      .sort((a, b) => b.paidCents + b.pendingCents - (a.paidCents + a.pendingCents));
  }

  return {
    period,
    currency: 'MXN',
    scope: {
      kind: scope.kind,
      label: scope.label,
      clinicId: scope.kind === 'clinic' ? scope.clinicId : scope.clinicId,
      podiatristId: scope.kind === 'podiatrist' ? scope.podiatristId : null,
    },
    sales: {
      currentTotalCents,
      previousTotalCents,
      changePercent: pctChange(currentTotalCents, previousTotalCents),
      count: currentPeriod.count,
      previousCount: previousPeriod.count,
      uniquePatientsCount,
      previousUniquePatientsCount,
      averageSalePerPatientCents,
      previousAverageSalePerPatientCents,
      averageSalePerPatientChangePercent: pctChange(
        averageSalePerPatientCents,
        previousAverageSalePerPatientCents
      ),
      salesByPatient,
      salesByService,
      salesByPodiatrist,
      series,
      comparisonSeries,
    },
    collections: {
      paidTotalCents: currentTotalCents,
      pendingTotalCents,
      paidCount: currentPeriod.count,
      pendingCount: pendingRows.length,
      byPaymentMethod: [...methodTotals.entries()].map(([method, data]) => ({
        method,
        ...data,
      })),
      receivablesByPatient,
      monthlyCashFlow,
      accountsReceivableCents,
      paidAllTimeCents,
      collectionsByPodiatrist,
    },
    profitability: {
      monthlyGoalCents: prefs.monthlyGoalCents,
      monthlyExpensesCents: prefs.monthlyExpensesCents,
      defaultMarginPercent: prefs.defaultMarginPercent,
      actualSalesCents,
      estimatedProfitCents,
      goalProgressPercent,
      monthEndProjectionCents,
      marginByService,
      growthTrend12Months,
      weeklyChangePercent: pctChange(
        sumPaidIn(startOfWeek(now), now),
        sumPaidIn(startOfWeek(addDays(startOfWeek(now), -1)), addDays(startOfWeek(now), -1))
      ),
      annualChangePercent: pctChange(
        sumPaidIn(startOfYear(now), now),
        sumPaidIn(startOfYear(addDays(startOfYear(now), -1)), addDays(startOfYear(now), -1))
      ),
    },
  };
}

export async function saveCheckoutAnalyticsPrefs(
  target: { kind: 'podiatrist'; podiatristId: string } | { kind: 'clinic'; clinicId: string },
  prefs: Partial<CheckoutAnalyticsPrefs>
): Promise<CheckoutAnalyticsPrefs> {
  const current =
    target.kind === 'clinic'
      ? parseCheckoutAnalyticsPrefs(
          (
            await database
              .select({ checkoutAnalyticsJson: clinics.checkoutAnalyticsJson })
              .from(clinics)
              .where(eq(clinics.clinicId, target.clinicId))
              .limit(1)
          )[0]?.checkoutAnalyticsJson
        )
      : parseCheckoutAnalyticsPrefs(
          (
            await database
              .select({ checkoutAnalyticsJson: professionalInfo.checkoutAnalyticsJson })
              .from(professionalInfo)
              .where(eq(professionalInfo.userId, target.podiatristId))
              .limit(1)
          )[0]?.checkoutAnalyticsJson
        );

  const merged: CheckoutAnalyticsPrefs = {
    monthlyGoalCents:
      prefs.monthlyGoalCents !== undefined
        ? Math.max(0, Math.round(prefs.monthlyGoalCents))
        : current.monthlyGoalCents,
    monthlyExpensesCents:
      prefs.monthlyExpensesCents !== undefined
        ? Math.max(0, Math.round(prefs.monthlyExpensesCents))
        : current.monthlyExpensesCents,
    defaultMarginPercent:
      prefs.defaultMarginPercent !== undefined
        ? Math.min(100, Math.max(0, Math.round(prefs.defaultMarginPercent)))
        : current.defaultMarginPercent,
  };

  if (target.kind === 'clinic') {
    await database
      .update(clinics)
      .set({ checkoutAnalyticsJson: JSON.stringify(merged) })
      .where(eq(clinics.clinicId, target.clinicId));
  } else {
    await database
      .update(professionalInfo)
      .set({ checkoutAnalyticsJson: JSON.stringify(merged) })
      .where(eq(professionalInfo.userId, target.podiatristId));
  }

  analyticsCache.clear();

  return merged;
}

export async function getCheckoutAnalyticsPrefs(
  target: { kind: 'podiatrist'; podiatristId: string } | { kind: 'clinic'; clinicId: string }
): Promise<CheckoutAnalyticsPrefs> {
  if (target.kind === 'clinic') {
    const row = await database
      .select({ checkoutAnalyticsJson: clinics.checkoutAnalyticsJson })
      .from(clinics)
      .where(eq(clinics.clinicId, target.clinicId))
      .limit(1);
    return parseCheckoutAnalyticsPrefs(row[0]?.checkoutAnalyticsJson);
  }
  const row = await database
    .select({ checkoutAnalyticsJson: professionalInfo.checkoutAnalyticsJson })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, target.podiatristId))
    .limit(1);
  return parseCheckoutAnalyticsPrefs(row[0]?.checkoutAnalyticsJson);
}

export async function resolveCheckoutAnalyticsScope(
  user: { userId: string; role: string; clinicId?: string | null },
  podiatristIdParam?: string | null
): Promise<CheckoutAnalyticsScope | { error: string; status: 403 | 400 }> {
  if (user.role === 'podiatrist') {
    return {
      kind: 'podiatrist',
      podiatristId: user.userId,
      clinicId: user.clinicId ?? null,
      label: 'Mi consulta',
    };
  }

  if (user.role === 'clinic_admin') {
    if (!user.clinicId) {
      return { error: 'Sin clínica asignada', status: 400 };
    }
    const { listAccessiblePodiatristIds } = await import('./checkout-handoffs-service');
    const allowed = await listAccessiblePodiatristIds(user as Parameters<typeof listAccessiblePodiatristIds>[0]);
    const ids = allowed === 'all' ? [] : allowed;

    const filterId = podiatristIdParam?.trim();
    if (filterId) {
      if (!ids.includes(filterId)) {
        return { error: 'No autorizado para ese podólogo', status: 403 };
      }
      const nameRow = await database
        .select({ name: createdUsers.name })
        .from(createdUsers)
        .where(eq(createdUsers.userId, filterId))
        .limit(1);
      return {
        kind: 'podiatrist',
        podiatristId: filterId,
        clinicId: user.clinicId,
        label: nameRow[0]?.name?.trim() || 'Podólogo',
      };
    }

    return {
      kind: 'clinic',
      clinicId: user.clinicId,
      podiatristIds: ids,
      label: 'Toda la clínica',
    };
  }

  return { error: 'No autorizado', status: 403 };
}
