import { useState } from "react";
import { useLanguage } from "../../contexts/language-context";
import { useCheckoutAnalytics, useCheckoutAnalyticsPrefs } from "../../hooks/use-checkout-analytics";
import { formatCheckoutAmount, parseAmountToCents } from "../../types/checkout-handoff";
import type { CheckoutAnalyticsPeriod, CheckoutViewMode } from "../../types/checkout-analytics";
import {
  changeTone,
  formatChangePercent,
  type CheckoutPaymentMethod,
} from "../../types/checkout-analytics";
import type { Translations } from "../../i18n/translations";
import { translateSystemScopeLabel } from "../../lib/system-scope-label";
import { formatAnalyticsSeriesLabel } from "../../lib/format-analytics-label";
import { SimpleBarChart } from "./simple-bar-chart";
import { ServiceSalesBreakdown } from "./service-sales-breakdown";

const LOCALE_BY_LANG: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-PT",
  fr: "fr-FR",
};

function periodLabels(t: Translations["checkout"]["analytics"]): Record<CheckoutAnalyticsPeriod, string> {
  return {
    day: t.periodDay,
    week: t.periodWeek,
    month: t.periodMonth,
    year: t.periodYear,
  };
}

function paymentMethodLabel(
  analytics: Translations["checkout"]["analytics"],
  method: string
): string {
  const key = method as CheckoutPaymentMethod;
  const map: Record<CheckoutPaymentMethod, string> = {
    cash: analytics.cash,
    card: analytics.card,
    transfer: analytics.transfer,
    other: analytics.other,
    unknown: analytics.unknown,
  };
  return map[key] ?? method;
}

function MetricCard({
  label,
  value,
  sub,
  change,
  vsPrevious,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number | null;
  vsPrevious: string;
}) {
  const tone = changeTone(change ?? null);
  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-4 min-w-0">
      <p className="text-xs sm:text-sm text-brand-muted mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold text-brand-ink truncate">{value}</p>
      {change != null && (
        <p
          className={`text-xs sm:text-sm font-medium mt-1 ${
            tone === "up"
              ? "text-semantic-success"
              : tone === "down"
                ? "text-semantic-error"
                : "text-brand-muted"
          }`}
        >
          {formatChangePercent(change)} {vsPrevious}
        </p>
      )}
      {sub && <p className="text-xs text-brand-muted mt-1">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-brand-surface rounded-xl border border-brand-border p-4 sm:p-5 space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-brand-ink">{title}</h3>
      {children}
    </section>
  );
}

function SegmentedTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex min-w-max gap-1 p-1 rounded-lg border border-brand-border bg-brand-canvas">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`shrink-0 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[40px] whitespace-nowrap ${
              value === opt.id
                ? "bg-brand-ink text-brand-ink-fg"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  view: CheckoutViewMode;
  isClinicAdmin?: boolean;
  analyticsPodiatristId?: string;
  /** Nombre del podólogo filtrado (solo UI). */
  podiatristFilterLabel?: string;
  /** Al elegir un podólogo desde “Ventas por podólogo”. */
  onSelectPodiatrist?: (podiatristId: string) => void;
};

export function CheckoutAnalyticsPanel({
  view,
  isClinicAdmin = false,
  analyticsPodiatristId,
  podiatristFilterLabel,
  onSelectPodiatrist,
}: Props) {
  const { t, language } = useLanguage();
  const a = t.checkout.analytics;
  const locale = LOCALE_BY_LANG[language] ?? "es-MX";
  const seriesLabel = (label: string, p: CheckoutAnalyticsPeriod = period) =>
    formatAnalyticsSeriesLabel(label, p, locale, t.checkout.weekBucket);
  const periods = periodLabels(a);
  const [period, setPeriod] = useState<CheckoutAnalyticsPeriod>("month");
  const queryPeriod = view === "sales" ? period : "month";
  const { analytics, loading, error, reload } = useCheckoutAnalytics(
    queryPeriod,
    true,
    analyticsPodiatristId
  );
  const prefsPodiatristScope = isClinicAdmin ? analyticsPodiatristId : undefined;
  const { preferences, editable, scopeLabel, saving, save } = useCheckoutAnalyticsPrefs(
    view === "profit",
    prefsPodiatristScope
  );

  const [goalInput, setGoalInput] = useState("");
  const [expensesInput, setExpensesInput] = useState("");
  const [prefsSaved, setPrefsSaved] = useState(false);

  const fmt = (cents: number) => formatCheckoutAmount(cents, analytics?.currency ?? "MXN");
  const periodLabel = periods[period];
  const periodLabelLower = periodLabel.toLowerCase();

  const handleSavePrefs = async () => {
    const monthlyGoalCents = parseAmountToCents(goalInput);
    const monthlyExpensesCents = parseAmountToCents(expensesInput);
    const ok = await save({
      ...(monthlyGoalCents != null ? { monthlyGoalCents } : {}),
      ...(monthlyExpensesCents != null ? { monthlyExpensesCents } : {}),
    });
    if (ok) {
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
      void reload();
    }
  };

  const scopeText = (() => {
    if (analytics?.scope?.kind === "clinic") return t.checkout.entireClinic;
    if (analytics?.scope?.kind === "podiatrist") {
      if (podiatristFilterLabel) return podiatristFilterLabel;
      const fromScope = translateSystemScopeLabel(analytics.scope.label, t.checkout);
      if (fromScope && fromScope !== analytics.scope.label) return fromScope;
      if (
        analytics.scope.label &&
        analytics.scope.label !== "Mi consulta" &&
        analytics.scope.label !== "Toda la clínica"
      ) {
        return analytics.scope.label;
      }
      return t.checkout.myPractice;
    }
    return (
      translateSystemScopeLabel(scopeLabel, t.checkout) ??
      (podiatristFilterLabel ? podiatristFilterLabel : null)
    );
  })();

  return (
    <div className="space-y-4 sm:space-y-6">
      {scopeText && (
        <p className="text-sm text-brand-muted">
          {a.scope.split("{label}")[0]}
          <span className="font-medium text-brand-ink">{scopeText}</span>
          {a.scope.split("{label}")[1] ?? ""}
          {isClinicAdmin && analyticsPodiatristId && onSelectPodiatrist && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => onSelectPodiatrist("all")}
                className="text-brand-ink underline-offset-2 hover:underline font-medium"
              >
                {t.checkout.entireClinic}
              </button>
            </>
          )}
        </p>
      )}

      {view === "sales" && (
        <>
          <SegmentedTabs
            value={period}
            onChange={setPeriod}
            options={(Object.entries(periods) as [CheckoutAnalyticsPeriod, string][]).map(
              ([id, label]) => ({ id, label })
            )}
          />

          {loading && !analytics ? (
            <p className="text-sm text-brand-muted">{a.loadingSales}</p>
          ) : error ? (
            <div className="rounded-xl border border-semantic-error/30 bg-semantic-error-bg/40 p-4 space-y-2">
              <p className="text-sm text-semantic-error">{error}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
              >
                {a.retry}
              </button>
            </div>
          ) : analytics ? (
            <>
              {analytics.sales.count === 0 && (
                <div className="rounded-xl border border-brand-border bg-brand-canvas p-4 text-sm text-brand-muted">
                  {a.emptyPaidPeriod.replace("{period}", periodLabelLower)}
                </div>
              )}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <MetricCard
                  label={a.salesTitle.replace("{period}", periodLabelLower)}
                  value={fmt(analytics.sales.currentTotalCents)}
                  change={analytics.sales.changePercent}
                  vsPrevious={a.vsPrevious}
                  sub={a.checkoutsCount.replace("{n}", String(analytics.sales.count))}
                />
                <MetricCard
                  label={a.avgSalePerPatient}
                  value={fmt(analytics.sales.averageSalePerPatientCents)}
                  change={analytics.sales.averageSalePerPatientChangePercent}
                  vsPrevious={a.vsPrevious}
                  sub={a.patientsCount.replace("{n}", String(analytics.sales.uniquePatientsCount))}
                />
                <MetricCard
                  label={a.previousPeriod}
                  value={fmt(analytics.sales.previousTotalCents)}
                  vsPrevious={a.vsPrevious}
                  sub={a.checkoutsCount.replace("{n}", String(analytics.sales.previousCount))}
                />
                <MetricCard
                  label={a.weeklyChange}
                  value={formatChangePercent(analytics.profitability.weeklyChangePercent)}
                  vsPrevious={a.vsPrevious}
                />
                <MetricCard
                  label={a.annualChange}
                  value={formatChangePercent(analytics.profitability.annualChangePercent)}
                  vsPrevious={a.vsPrevious}
                />
              </div>

              <SectionCard title={a.avgSalePerPatientChart}>
                {analytics.sales.salesByPatient.length === 0 ? (
                  <p className="text-sm text-brand-muted">{a.emptyAvgByPatient}</p>
                ) : (
                  <>
                    <p className="text-sm text-brand-muted">
                      {a.periodAverageAmong
                        .replace("{avg}", fmt(analytics.sales.averageSalePerPatientCents))
                        .replace("{n}", String(analytics.sales.uniquePatientsCount))}
                    </p>
                    <SimpleBarChart
                      data={analytics.sales.salesByPatient.map((row) => ({
                        label: row.chartLabel,
                        value: row.averageCents,
                      }))}
                      formatValue={fmt}
                      height={200}
                    />
                    <ul className="divide-y divide-brand-border text-sm">
                      {analytics.sales.salesByPatient.map((row) => (
                        <li key={row.patientId} className="flex justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="font-medium text-brand-ink truncate">{row.patientName}</p>
                            <p className="text-xs text-brand-muted">
                              {a.visitsTotal
                                .replace("{n}", String(row.visitCount))
                                .replace("{amount}", fmt(row.totalCents))}
                            </p>
                          </div>
                          <span className="font-semibold text-brand-ink shrink-0">
                            {fmt(row.averageCents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </SectionCard>

              <SectionCard title={a.salesByDay.replace("{period}", periodLabelLower)}>
                <SimpleBarChart
                  data={analytics.sales.series.map((s) => ({
                    label: seriesLabel(s.label),
                    value: s.paidCents,
                  }))}
                  formatValue={fmt}
                />
              </SectionCard>

              <SectionCard title={a.byService}>
                <ServiceSalesBreakdown
                  items={analytics.sales.salesByService ?? []}
                  formatMoney={fmt}
                />
              </SectionCard>

              {analytics.sales.comparisonSeries.length > 0 && (
                <SectionCard title={a.comparisonMonth}>
                  <SimpleBarChart
                    compareMode
                    data={analytics.sales.comparisonSeries.map((s) => ({
                      label: seriesLabel(s.label, "month"),
                      secondaryLabel: seriesLabel(s.previousLabel, "month"),
                      value: s.currentCents,
                      secondaryValue: s.previousCents,
                    }))}
                    formatValue={fmt}
                  />
                </SectionCard>
              )}

              {analytics.sales.salesByPodiatrist.length > 0 && (
                <SectionCard title={a.byPodiatrist}>
                  <SimpleBarChart
                    data={analytics.sales.salesByPodiatrist.map((row) => ({
                      label: (
                        translateSystemScopeLabel(row.podiatristName, t.checkout) ??
                        row.podiatristName
                      )
                        .split(" ")[0],
                      value: row.totalCents,
                    }))}
                    formatValue={fmt}
                    height={200}
                  />
                  <ul className="divide-y divide-brand-border text-sm">
                    {analytics.sales.salesByPodiatrist.map((row) => (
                      <li key={row.podiatristId} className="flex justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          {onSelectPodiatrist ? (
                            <button
                              type="button"
                              onClick={() => onSelectPodiatrist(row.podiatristId)}
                              className="font-medium text-brand-ink text-left hover:underline underline-offset-2"
                            >
                              {translateSystemScopeLabel(row.podiatristName, t.checkout) ??
                                row.podiatristName}
                            </button>
                          ) : (
                            <p className="font-medium text-brand-ink">
                              {translateSystemScopeLabel(row.podiatristName, t.checkout) ??
                                row.podiatristName}
                            </p>
                          )}
                          <p className="text-xs text-brand-muted">
                            {a.checkoutsCount.replace("{n}", String(row.count))} · {a.avgAbbrev}{" "}
                            {fmt(row.averageCents)}
                            {onSelectPodiatrist ? ` · ${a.viewDetail}` : ""}
                          </p>
                        </div>
                        <span className="font-semibold text-brand-ink shrink-0">{fmt(row.totalCents)}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              <SectionCard title={a.growth12m}>
                <SimpleBarChart
                  data={analytics.profitability.growthTrend12Months.map((m) => ({
                    label: seriesLabel(m.month || m.label, "month"),
                    value: m.paidCents,
                  }))}
                  formatValue={fmt}
                  height={200}
                />
              </SectionCard>
            </>
          ) : (
            <div className="rounded-xl border border-brand-border p-4 space-y-2">
              <p className="text-sm text-brand-muted">{a.emptySalesData}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
              >
                {a.retry}
              </button>
            </div>
          )}
        </>
      )}

      {view === "collections" && (
        <>
          {loading && !analytics ? (
            <p className="text-sm text-brand-muted">{a.loadingCollections}</p>
          ) : error ? (
            <p className="text-sm text-semantic-error">{error}</p>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard
                  label={a.paidThisPeriod}
                  value={fmt(analytics.collections.paidTotalCents)}
                  vsPrevious={a.vsPrevious}
                />
                <MetricCard
                  label={a.pending}
                  value={fmt(analytics.collections.pendingTotalCents)}
                  vsPrevious={a.vsPrevious}
                />
                <MetricCard
                  label={a.accountsReceivable}
                  value={fmt(analytics.collections.accountsReceivableCents)}
                  vsPrevious={a.vsPrevious}
                  sub={a.openHandoffs.replace("{n}", String(analytics.collections.pendingCount))}
                />
                <MetricCard
                  label={a.paidVsPending}
                  value={`${analytics.collections.paidCount} / ${analytics.collections.pendingCount}`}
                  vsPrevious={a.vsPrevious}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <SectionCard title={a.paidVsPending}>
                  <div className="space-y-3">
                    {[
                      { label: a.paidLabel, cents: analytics.collections.paidTotalCents, color: "bg-semantic-success" },
                      { label: a.pending, cents: analytics.collections.pendingTotalCents, color: "bg-semantic-warning" },
                    ].map((row) => {
                      const total =
                        analytics.collections.paidTotalCents + analytics.collections.pendingTotalCents;
                      const pct = total > 0 ? (row.cents / total) * 100 : 0;
                      return (
                        <div key={row.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-brand-muted">{row.label}</span>
                            <span className="font-medium text-brand-ink">{fmt(row.cents)}</span>
                          </div>
                          <div className="h-3 rounded-full bg-brand-canvas overflow-hidden">
                            <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard title={a.paymentMethods}>
                  {analytics.collections.byPaymentMethod.length === 0 ? (
                    <p className="text-sm text-brand-muted">{a.paymentMethodsHint}</p>
                  ) : (
                    <ul className="space-y-2">
                      {analytics.collections.byPaymentMethod.map((row) => (
                        <li
                          key={row.method}
                          className="flex items-center justify-between gap-3 text-sm py-2 border-b border-brand-border last:border-0"
                        >
                          <span className="text-brand-ink">{paymentMethodLabel(a, row.method)}</span>
                          <span className="font-medium text-brand-ink">{fmt(row.totalCents)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              <SectionCard title={a.monthlyCashFlow}>
                <SimpleBarChart
                  data={analytics.collections.monthlyCashFlow.map((m) => ({
                    label: seriesLabel(m.month || m.label, "month"),
                    value: m.paidCents,
                  }))}
                  formatValue={fmt}
                  height={180}
                />
              </SectionCard>

              {(analytics.collections.collectionsByPodiatrist?.length ?? 0) > 0 && (
                <SectionCard title={a.collectionsByPodiatrist}>
                  <ul className="divide-y divide-brand-border text-sm">
                    {analytics.collections.collectionsByPodiatrist.map((row) => (
                      <li key={row.podiatristId} className="flex justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          {onSelectPodiatrist ? (
                            <button
                              type="button"
                              onClick={() => onSelectPodiatrist(row.podiatristId)}
                              className="font-medium text-brand-ink text-left hover:underline underline-offset-2"
                            >
                              {translateSystemScopeLabel(row.podiatristName, t.checkout) ??
                                row.podiatristName}
                            </button>
                          ) : (
                            <p className="font-medium text-brand-ink">
                              {translateSystemScopeLabel(row.podiatristName, t.checkout) ??
                                row.podiatristName}
                            </p>
                          )}
                          <p className="text-xs text-brand-muted">
                            {a.collectionsPodiatristRow
                              .replace("{paid}", fmt(row.paidCents))
                              .replace("{paidCount}", String(row.paidCount))
                              .replace("{pending}", fmt(row.pendingCents))
                              .replace("{pendingCount}", String(row.pendingCount))}
                            {onSelectPodiatrist ? ` · ${a.viewDetail}` : ""}
                          </p>
                        </div>
                        <span className="font-semibold text-brand-ink shrink-0">
                          {fmt(row.paidCents + row.pendingCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              <SectionCard title={a.receivablesByPatient}>
                {analytics.collections.receivablesByPatient.length === 0 ? (
                  <p className="text-sm text-brand-muted">{a.noReceivables}</p>
                ) : (
                  <ul className="divide-y divide-brand-border">
                    {analytics.collections.receivablesByPatient.map((row) => (
                      <li key={row.patientId} className="flex justify-between gap-3 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-brand-ink truncate">{row.patientName}</p>
                          <p className="text-xs text-brand-muted">
                            {a.pendingItems.replace("{n}", String(row.count))}
                          </p>
                        </div>
                        <span className="font-semibold text-brand-ink shrink-0">{fmt(row.totalCents)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </>
          ) : null}
        </>
      )}

      {view === "profit" && (
        <>
          {loading && !analytics ? (
            <p className="text-sm text-brand-muted">{a.loadingProfit}</p>
          ) : error ? (
            <p className="text-sm text-semantic-error">{error}</p>
          ) : analytics ? (
            <>
              <SectionCard title={a.goalsAndExpenses}>
                {!editable && (
                  <p className="text-sm text-brand-muted">{a.goalsReadOnlyHint}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm text-brand-muted">{a.monthlyGoal}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      defaultValue={
                        preferences?.monthlyGoalCents
                          ? (preferences.monthlyGoalCents / 100).toFixed(2)
                          : ""
                      }
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder={a.goalPlaceholder}
                      className="mt-1 w-full px-3 py-2.5 text-sm bg-brand-canvas border border-brand-border rounded-lg min-h-[44px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-brand-muted">{a.monthlyExpenses}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      defaultValue={
                        preferences?.monthlyExpensesCents
                          ? (preferences.monthlyExpensesCents / 100).toFixed(2)
                          : ""
                      }
                      onChange={(e) => setExpensesInput(e.target.value)}
                      placeholder={a.expensesPlaceholder}
                      className="mt-1 w-full px-3 py-2.5 text-sm bg-brand-canvas border border-brand-border rounded-lg min-h-[44px]"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={saving || !editable}
                  onClick={() => void handleSavePrefs()}
                  className="px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
                >
                  {saving ? a.saving : prefsSaved ? a.saved : editable ? a.saveGoals : a.readOnly}
                </button>
              </SectionCard>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard
                  label={a.realSales}
                  value={fmt(analytics.profitability.actualSalesCents)}
                  vsPrevious={a.vsPrevious}
                />
                <MetricCard
                  label={a.estimatedProfit}
                  value={fmt(analytics.profitability.estimatedProfitCents)}
                  vsPrevious={a.vsPrevious}
                />
                <MetricCard
                  label={a.goalVsActual}
                  value={
                    analytics.profitability.goalProgressPercent != null
                      ? `${analytics.profitability.goalProgressPercent}%`
                      : a.noGoal
                  }
                  vsPrevious={a.vsPrevious}
                />
                <MetricCard
                  label={a.monthEndProjection}
                  value={fmt(analytics.profitability.monthEndProjectionCents)}
                  vsPrevious={a.vsPrevious}
                />
              </div>

              <SectionCard title={a.expensesVsIncome}>
                <div className="space-y-3 text-sm max-w-md">
                  <div className="flex justify-between">
                    <span className="text-brand-muted">{a.income}</span>
                    <span className="font-semibold text-semantic-success">
                      {fmt(analytics.profitability.actualSalesCents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">{a.expenses}</span>
                    <span className="font-semibold text-semantic-error">
                      {fmt(analytics.profitability.monthlyExpensesCents)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-brand-border font-medium">
                    <span>{a.profit}</span>
                    <span>{fmt(analytics.profitability.estimatedProfitCents)}</span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title={a.marginByService}>
                <ServiceSalesBreakdown
                  items={(analytics.profitability.marginByService ?? []).map((row) => ({
                    label: row.label,
                    totalCents: row.totalCents,
                    count: row.count,
                    sharePercent:
                      analytics.profitability.actualSalesCents > 0
                        ? Math.round(
                            (row.totalCents / analytics.profitability.actualSalesCents) * 1000
                          ) / 10
                        : 0,
                    secondaryLabel: a.marginRow
                      .replace("{pct}", String(row.marginPercent))
                      .replace("{amount}", fmt(row.estimatedProfitCents)),
                  }))}
                  formatMoney={fmt}
                  emptyMessage={a.emptyMonthSales}
                  showSecondary
                />
              </SectionCard>

              <SectionCard title={a.growth12m}>
                <SimpleBarChart
                  data={analytics.profitability.growthTrend12Months.map((m) => ({
                    label: seriesLabel(m.month || m.label, "month"),
                    value: m.paidCents,
                  }))}
                  formatValue={fmt}
                  height={220}
                />
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-3">
                  {analytics.profitability.growthTrend12Months.slice(-6).map((m) => (
                    <li key={m.month} className="text-xs bg-brand-canvas rounded-lg p-2">
                      <p className="text-brand-muted">{seriesLabel(m.month || m.label, "month")}</p>
                      <p className="font-semibold text-brand-ink">{fmt(m.paidCents)}</p>
                      <p
                        className={
                          changeTone(m.changePercent) === "up"
                            ? "text-semantic-success"
                            : changeTone(m.changePercent) === "down"
                              ? "text-semantic-error"
                              : "text-brand-muted"
                        }
                      >
                        {formatChangePercent(m.changePercent)}
                      </p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
