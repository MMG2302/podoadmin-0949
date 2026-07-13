import { useState } from "react";
import { useCheckoutAnalytics, useCheckoutAnalyticsPrefs } from "../../hooks/use-checkout-analytics";
import { formatCheckoutAmount, parseAmountToCents } from "../../types/checkout-handoff";
import type { CheckoutAnalyticsPeriod, CheckoutViewMode } from "../../types/checkout-analytics";
import {
  PAYMENT_METHOD_LABELS,
  changeTone,
  formatChangePercent,
  type CheckoutPaymentMethod,
} from "../../types/checkout-analytics";
import { SimpleBarChart } from "./simple-bar-chart";

const PERIOD_LABELS: Record<CheckoutAnalyticsPeriod, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
  year: "Año",
};

function MetricCard({
  label,
  value,
  sub,
  change,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number | null;
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
          {formatChangePercent(change)} vs periodo anterior
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

  const scopeText =
    analytics?.scope?.label ??
    scopeLabel ??
    (podiatristFilterLabel ? podiatristFilterLabel : null);

  return (
    <div className="space-y-4 sm:space-y-6">
      {scopeText && (
        <p className="text-sm text-brand-muted">
          Alcance: <span className="font-medium text-brand-ink">{scopeText}</span>
          {isClinicAdmin && analyticsPodiatristId && onSelectPodiatrist && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => onSelectPodiatrist("all")}
                className="text-brand-ink underline-offset-2 hover:underline font-medium"
              >
                Ver toda la clínica
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
            options={(Object.entries(PERIOD_LABELS) as [CheckoutAnalyticsPeriod, string][]).map(
              ([id, label]) => ({ id, label })
            )}
          />

          {loading && !analytics ? (
            <p className="text-sm text-brand-muted">Cargando ventas…</p>
          ) : error ? (
            <p className="text-sm text-semantic-error">{error}</p>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <MetricCard
                  label={`Ventas (${PERIOD_LABELS[period].toLowerCase()})`}
                  value={fmt(analytics.sales.currentTotalCents)}
                  change={analytics.sales.changePercent}
                  sub={`${analytics.sales.count} cobros`}
                />
                <MetricCard
                  label="Venta prom. por paciente"
                  value={fmt(analytics.sales.averageSalePerPatientCents)}
                  change={analytics.sales.averageSalePerPatientChangePercent}
                  sub={`${analytics.sales.uniquePatientsCount} pacientes`}
                />
                <MetricCard
                  label="Periodo anterior"
                  value={fmt(analytics.sales.previousTotalCents)}
                  sub={`${analytics.sales.previousCount} cobros`}
                />
                <MetricCard
                  label="Variación semanal"
                  value={formatChangePercent(analytics.profitability.weeklyChangePercent)}
                />
                <MetricCard
                  label="Variación anual"
                  value={formatChangePercent(analytics.profitability.annualChangePercent)}
                />
              </div>

              <SectionCard title="Venta promedio por paciente">
                {analytics.sales.salesByPatient.length === 0 ? (
                  <p className="text-sm text-brand-muted">
                    No hay cobros en este periodo para calcular promedios por paciente.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-brand-muted">
                      Promedio del periodo:{" "}
                      <strong className="text-brand-ink">
                        {fmt(analytics.sales.averageSalePerPatientCents)}
                      </strong>{" "}
                      entre {analytics.sales.uniquePatientsCount} paciente
                      {analytics.sales.uniquePatientsCount === 1 ? "" : "s"}.
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
                              {row.visitCount} visita{row.visitCount === 1 ? "" : "s"} · Total{" "}
                              {fmt(row.totalCents)}
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

              <SectionCard title={`Ventas por ${PERIOD_LABELS[period].toLowerCase()}`}>
                <SimpleBarChart
                  data={analytics.sales.series.map((s) => ({
                    label: s.label,
                    value: s.paidCents,
                  }))}
                  formatValue={fmt}
                />
              </SectionCard>

              {analytics.sales.comparisonSeries.length > 0 && (
                <SectionCard title="Comparativo mes a mes">
                  <SimpleBarChart
                    compareMode
                    data={analytics.sales.comparisonSeries.map((s) => ({
                      label: s.label,
                      value: s.currentCents,
                      secondaryValue: s.previousCents,
                    }))}
                    formatValue={fmt}
                  />
                </SectionCard>
              )}

              {analytics.sales.salesByPodiatrist.length > 0 && (
                <SectionCard title="Ventas por podólogo">
                  <SimpleBarChart
                    data={analytics.sales.salesByPodiatrist.map((row) => ({
                      label: row.podiatristName.split(" ")[0] ?? row.podiatristName,
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
                              {row.podiatristName}
                            </button>
                          ) : (
                            <p className="font-medium text-brand-ink">{row.podiatristName}</p>
                          )}
                          <p className="text-xs text-brand-muted">
                            {row.count} cobro{row.count === 1 ? "" : "s"} · Prom. {fmt(row.averageCents)}
                            {onSelectPodiatrist ? " · Ver detalle" : ""}
                          </p>
                        </div>
                        <span className="font-semibold text-brand-ink shrink-0">{fmt(row.totalCents)}</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              )}

              <SectionCard title="Tendencia últimos 12 meses">
                <SimpleBarChart
                  data={analytics.profitability.growthTrend12Months.map((m) => ({
                    label: m.label,
                    value: m.paidCents,
                  }))}
                  formatValue={fmt}
                  height={200}
                />
              </SectionCard>
            </>
          ) : null}
        </>
      )}

      {view === "collections" && (
        <>
          {loading && !analytics ? (
            <p className="text-sm text-brand-muted">Cargando cobranza…</p>
          ) : error ? (
            <p className="text-sm text-semantic-error">{error}</p>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard label="Cobrado (mes)" value={fmt(analytics.collections.paidTotalCents)} />
                <MetricCard label="Pendiente" value={fmt(analytics.collections.pendingTotalCents)} />
                <MetricCard
                  label="Cuentas por cobrar"
                  value={fmt(analytics.collections.accountsReceivableCents)}
                  sub={`${analytics.collections.pendingCount} handoffs abiertos`}
                />
                <MetricCard label="Cobrado vs pendiente" value={`${analytics.collections.paidCount} / ${analytics.collections.pendingCount}`} />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <SectionCard title="Cobrado vs pendiente">
                  <div className="space-y-3">
                    {[
                      { label: "Cobrado", cents: analytics.collections.paidTotalCents, color: "bg-semantic-success" },
                      { label: "Pendiente", cents: analytics.collections.pendingTotalCents, color: "bg-semantic-warning" },
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

                <SectionCard title="Formas de pago">
                  {analytics.collections.byPaymentMethod.length === 0 ? (
                    <p className="text-sm text-brand-muted">
                      Al marcar cobrado, selecciona efectivo, tarjeta o transferencia para ver el desglose.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {analytics.collections.byPaymentMethod.map((row) => (
                        <li
                          key={row.method}
                          className="flex items-center justify-between gap-3 text-sm py-2 border-b border-brand-border last:border-0"
                        >
                          <span className="text-brand-ink">
                            {PAYMENT_METHOD_LABELS[row.method as CheckoutPaymentMethod] ?? row.method}
                          </span>
                          <span className="font-medium text-brand-ink">{fmt(row.totalCents)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              <SectionCard title="Flujo de efectivo mensual">
                <SimpleBarChart
                  data={analytics.collections.monthlyCashFlow.map((m) => ({
                    label: m.label,
                    value: m.paidCents,
                  }))}
                  formatValue={fmt}
                  height={180}
                />
              </SectionCard>

              {(analytics.collections.collectionsByPodiatrist?.length ?? 0) > 0 && (
                <SectionCard title="Cobranza por podólogo">
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
                              {row.podiatristName}
                            </button>
                          ) : (
                            <p className="font-medium text-brand-ink">{row.podiatristName}</p>
                          )}
                          <p className="text-xs text-brand-muted">
                            Cobrado {fmt(row.paidCents)} ({row.paidCount}) · Pendiente{" "}
                            {fmt(row.pendingCents)} ({row.pendingCount})
                            {onSelectPodiatrist ? " · Ver detalle" : ""}
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

              <SectionCard title="Adeudos por paciente">
                {analytics.collections.receivablesByPatient.length === 0 ? (
                  <p className="text-sm text-brand-muted">No hay adeudos pendientes.</p>
                ) : (
                  <ul className="divide-y divide-brand-border">
                    {analytics.collections.receivablesByPatient.map((row) => (
                      <li key={row.patientId} className="flex justify-between gap-3 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-brand-ink truncate">{row.patientName}</p>
                          <p className="text-xs text-brand-muted">{row.count} pendiente(s)</p>
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
            <p className="text-sm text-brand-muted">Cargando utilidad…</p>
          ) : error ? (
            <p className="text-sm text-semantic-error">{error}</p>
          ) : analytics ? (
            <>
              <SectionCard title="Metas y gastos mensuales">
                {!editable && (
                  <p className="text-sm text-brand-muted">
                    Metas del podólogo seleccionado (solo lectura). Para editar metas de la clínica, elige
                    &quot;Toda la clínica&quot;.
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm text-brand-muted">Meta mensual (MXN)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      defaultValue={
                        preferences?.monthlyGoalCents
                          ? (preferences.monthlyGoalCents / 100).toFixed(2)
                          : ""
                      }
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="Ej. 50000"
                      className="mt-1 w-full px-3 py-2.5 text-sm bg-brand-canvas border border-brand-border rounded-lg min-h-[44px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-brand-muted">Gastos mensuales (MXN)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      defaultValue={
                        preferences?.monthlyExpensesCents
                          ? (preferences.monthlyExpensesCents / 100).toFixed(2)
                          : ""
                      }
                      onChange={(e) => setExpensesInput(e.target.value)}
                      placeholder="Ej. 15000"
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
                  {saving ? "Guardando…" : prefsSaved ? "Guardado" : editable ? "Guardar metas" : "Solo lectura"}
                </button>
              </SectionCard>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard label="Ventas reales" value={fmt(analytics.profitability.actualSalesCents)} />
                <MetricCard label="Utilidad estimada" value={fmt(analytics.profitability.estimatedProfitCents)} />
                <MetricCard
                  label="Meta vs real"
                  value={
                    analytics.profitability.goalProgressPercent != null
                      ? `${analytics.profitability.goalProgressPercent}%`
                      : "Sin meta"
                  }
                />
                <MetricCard
                  label="Proyección cierre"
                  value={fmt(analytics.profitability.monthEndProjectionCents)}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <SectionCard title="Gastos vs ingresos">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Ingresos</span>
                      <span className="font-semibold text-semantic-success">
                        {fmt(analytics.profitability.actualSalesCents)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-muted">Gastos</span>
                      <span className="font-semibold text-semantic-error">
                        {fmt(analytics.profitability.monthlyExpensesCents)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-brand-border font-medium">
                      <span>Utilidad</span>
                      <span>{fmt(analytics.profitability.estimatedProfitCents)}</span>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Margen por servicio">
                  {analytics.profitability.marginByService.length === 0 ? (
                    <p className="text-sm text-brand-muted">Sin cobros este mes.</p>
                  ) : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto text-sm">
                      {analytics.profitability.marginByService.map((row) => (
                        <li key={row.label} className="flex justify-between gap-2 py-1 border-b border-brand-border last:border-0">
                          <div className="min-w-0">
                            <span className="text-brand-ink">{row.label}</span>
                            <p className="text-xs text-brand-muted">
                              {fmt(row.totalCents)} ingreso · {row.marginPercent}% margen
                            </p>
                          </div>
                          <span className="text-brand-muted shrink-0">{fmt(row.estimatedProfitCents)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              <SectionCard title="Tendencia 12 meses">
                <SimpleBarChart
                  data={analytics.profitability.growthTrend12Months.map((m) => ({
                    label: m.label,
                    value: m.paidCents,
                  }))}
                  formatValue={fmt}
                  height={220}
                />
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-3">
                  {analytics.profitability.growthTrend12Months.slice(-6).map((m) => (
                    <li key={m.month} className="text-xs bg-brand-canvas rounded-lg p-2">
                      <p className="text-brand-muted">{m.label}</p>
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
