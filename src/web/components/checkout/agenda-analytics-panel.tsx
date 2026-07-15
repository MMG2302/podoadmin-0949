import { useEffect, useState } from "react";
import { useLanguage } from "../../contexts/language-context";
import { formatCheckoutAmount } from "../../types/checkout-handoff";
import { useCheckoutTariffs } from "../../hooks/use-checkout-tariffs";
import {
  useAgendaSettings,
  useAppointmentAgendaMetrics,
  useDailySalesClose,
} from "../../hooks/use-agenda-analytics";
import { translateSystemScopeLabel } from "../../lib/system-scope-label";
import { SimpleBarChart } from "./simple-bar-chart";
import type { AgendaSettings } from "../../types/agenda";

const LOCALE_BY_LANG: Record<string, string> = {
  es: "es-MX",
  en: "en-US",
  pt: "pt-PT",
  fr: "fr-FR",
};

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-4 min-w-0">
      <p className="text-xs sm:text-sm text-brand-muted mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold text-brand-ink truncate">{value}</p>
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

function hourOptions() {
  return Array.from({ length: 24 }, (_, h) => ({
    value: h,
    label: `${String(h).padStart(2, "0")}:00`,
  }));
}

function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

type Props = {
  podiatristId?: string;
  canEditSchedule?: boolean;
  canCloseDay?: boolean;
};

export function AgendaAnalyticsPanel({
  podiatristId,
  canEditSchedule = false,
  canCloseDay = true,
}: Props) {
  const { t, language } = useLanguage();
  const aa = t.checkout.agendaAnalytics;
  const { metrics, loading, error, reload } = useAppointmentAgendaMetrics(true, podiatristId);
  const {
    settings,
    editable,
    scopeLabel,
    saving,
    save,
  } = useAgendaSettings(true, podiatristId);
  const { today, history, closing, error: closeError, closeDay, reload: reloadClose } =
    useDailySalesClose(true, podiatristId);
  const { tariffs } = useCheckoutTariffs(podiatristId);

  const [draft, setDraft] = useState<AgendaSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  const fmt = (cents: number) => formatCheckoutAmount(cents, "MXN");
  const scheduleEditable = canEditSchedule && editable;
  const hours = hourOptions();
  const locale = LOCALE_BY_LANG[language] ?? "es-MX";
  const translatedScopeLabel = translateSystemScopeLabel(scopeLabel, t.checkout);

  const weekdayLabel = (weekday: number) => {
    // JS: 0=Sun … create a fixed reference week (2024-01-07 = Sunday)
    const d = new Date(Date.UTC(2024, 0, 7 + weekday));
    return d.toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" });
  };

  const demandDayLabel = (isoDate: string, fallback: string) => {
    try {
      return new Date(`${isoDate}T12:00:00`).toLocaleDateString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    } catch {
      return fallback;
    }
  };

  const durationRows = (() => {
    const real = metrics?.avgDurationByReason ?? [];
    const rows: Array<{
      label: string;
      guidedMinutes: number | null;
      avgMinutes: number | null;
      count: number;
    }> = [];

    for (const tariff of tariffs) {
      const match = real.find(
        (r) =>
          normalizeLabel(r.reason).includes(normalizeLabel(tariff.label)) ||
          normalizeLabel(tariff.label).includes(normalizeLabel(r.reason))
      );
      rows.push({
        label: tariff.label,
        guidedMinutes: tariff.durationMinutes ?? null,
        avgMinutes: match?.avgMinutes ?? null,
        count: match?.count ?? 0,
      });
    }

    for (const r of real) {
      const already = rows.some(
        (row) =>
          normalizeLabel(row.label).includes(normalizeLabel(r.reason)) ||
          normalizeLabel(r.reason).includes(normalizeLabel(row.label))
      );
      if (!already) {
        rows.push({
          label: r.reason,
          guidedMinutes: null,
          avgMinutes: r.avgMinutes,
          count: r.count,
        });
      }
    }

    return rows.slice(0, 12);
  })();

  const handleSaveSchedule = async () => {
    if (!draft) return;
    const ok = await save(draft);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      void reload();
    }
  };

  if (loading && !metrics) {
    return <p className="text-sm text-brand-muted">{aa.loading}</p>;
  }

  if (error && !metrics) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-semantic-error">{error}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="text-sm font-medium text-brand-ink underline-offset-2 hover:underline"
        >
          {t.checkout.analytics.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {translatedScopeLabel && (
        <p className="text-sm text-brand-muted">
          {aa.scheduleScope.split("{label}")[0]}
          <span className="font-medium text-brand-ink">{translatedScopeLabel}</span>
          {aa.scheduleScope.split("{label}")[1] ?? ""}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label={t.dashboard.agendaOccupancy}
          value={`${metrics?.occupancy.percent ?? 0}%`}
          sub={aa.occupiedAvailable
            .replace("{occ}", String(metrics?.occupancy.occupiedMinutes ?? 0))
            .replace("{avail}", String(metrics?.occupancy.availableMinutes ?? 0))}
        />
        <MetricCard
          label={aa.demand30d}
          value={String(metrics?.totals.demand ?? 0)}
          sub={aa.demandHint}
        />
        <MetricCard
          label={aa.noShow}
          value={`${metrics?.totals.noShowRate ?? 0}%`}
          sub={aa.appointmentsCount.replace("{n}", String(metrics?.totals.noShow ?? 0))}
        />
        <MetricCard
          label={aa.peakHour}
          value={metrics?.topBusyHours[0]?.label ?? "—"}
          sub={
            metrics?.topBusyHours[0]
              ? aa.appointmentsCount.replace("{n}", String(metrics.topBusyHours[0].count))
              : aa.noData
          }
        />
      </div>

      <SectionCard title={aa.busiestHours}>
        <SimpleBarChart
          data={(metrics?.busyHours ?? [])
            .filter((h) => h.count > 0)
            .map((h) => ({ label: h.label, value: h.count }))}
          height={180}
        />
        {(metrics?.topBusyHours?.length ?? 0) > 0 && (
          <ul className="text-sm text-brand-muted space-y-1">
            {metrics!.topBusyHours.map((h) => (
              <li key={h.hour} className="flex justify-between gap-3">
                <span>{h.label}</span>
                <span className="font-medium text-brand-ink">
                  {aa.appointmentsCount.replace("{n}", String(h.count))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={aa.topDemandDays}>
        <p className="text-xs text-brand-muted -mt-2">
          {aa.demandTotalLine.replace("{n}", String(metrics?.totals.demand ?? 0))}
        </p>
        <SimpleBarChart
          data={(metrics?.demandByWeekday ?? []).map((d) => ({
            label: weekdayLabel(d.weekday),
            value: d.count,
          }))}
          height={160}
        />
        {(metrics?.topDemandDays?.length ?? 0) > 0 && (
          <ul className="divide-y divide-brand-border text-sm">
            {metrics!.topDemandDays.slice(0, 5).map((d) => (
              <li key={d.date} className="flex justify-between gap-3 py-2">
                <span className="text-brand-ink">{demandDayLabel(d.date, d.label)}</span>
                <span className="font-medium text-brand-ink">{d.count}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={aa.timeByService}>
        <p className="text-xs text-brand-muted -mt-2">{aa.durationHint}</p>
        {durationRows.length === 0 ? (
          <p className="text-sm text-brand-muted">{aa.noDurationData}</p>
        ) : (
          <ul className="divide-y divide-brand-border text-sm">
            {durationRows.map((row) => (
              <li key={row.label} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span className="font-medium text-brand-ink min-w-0 truncate">{row.label}</span>
                <span className="text-brand-muted shrink-0">
                  {row.guidedMinutes != null
                    ? aa.guidedMinutes.replace("{n}", String(row.guidedMinutes))
                    : aa.noGuided}
                  {" · "}
                  {row.avgMinutes != null
                    ? aa.realMinutes
                        .replace("{n}", String(row.avgMinutes))
                        .replace("{count}", String(row.count))
                    : aa.noReal}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={aa.workSchedule}>
        {!draft ? (
          <p className="text-sm text-brand-muted">{aa.loadingSchedule}</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="text-xs text-brand-muted space-y-1">
                <span>{aa.start}</span>
                <select
                  disabled={!scheduleEditable}
                  value={draft.workdayStartHour}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, workdayStartHour: Number(e.target.value) } : d
                    )
                  }
                  className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface"
                >
                  {hours.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-brand-muted space-y-1">
                <span>{aa.end}</span>
                <select
                  disabled={!scheduleEditable}
                  value={draft.workdayEndHour}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, workdayEndHour: Number(e.target.value) } : d
                    )
                  }
                  className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface"
                >
                  {hours.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-brand-muted space-y-1">
                <span>{aa.overtimeFrom}</span>
                <select
                  disabled={!scheduleEditable || !draft.allowOvertime}
                  value={draft.overtimeStartHour}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, overtimeStartHour: Number(e.target.value) } : d
                    )
                  }
                  className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface"
                >
                  {hours.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-brand-muted space-y-1">
                <span>{aa.overtimeCap}</span>
                <select
                  disabled={!scheduleEditable || !draft.allowOvertime}
                  value={draft.overtimeEndHour}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, overtimeEndHour: Number(e.target.value) } : d
                    )
                  }
                  className="w-full px-2 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface"
                >
                  {hours.map((h) => (
                    <option key={h.value} value={h.value}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-brand-ink">
              <input
                type="checkbox"
                disabled={!scheduleEditable}
                checked={draft.allowOvertime}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, allowOvertime: e.target.checked } : d))
                }
              />
              {aa.allowOvertime}
            </label>
            {!scheduleEditable && (
              <p className="text-xs text-brand-muted">{aa.scheduleReadOnlyHint}</p>
            )}
            {scheduleEditable && (
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveSchedule()}
                  className="px-4 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg disabled:opacity-50"
                >
                  {saving ? aa.savingSchedule : aa.saveSchedule}
                </button>
                {saved && <span className="text-sm text-semantic-success">{aa.saved}</span>}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard title={aa.dailyCloseTitle}>
        {closeError && <p className="text-sm text-semantic-error">{closeError}</p>}
        {!today ? (
          <p className="text-sm text-brand-muted">{aa.loadingClose}</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label={aa.paidToday}
                value={fmt(today.live.paidCents)}
                sub={aa.checkoutsCount.replace("{n}", String(today.live.paidCount))}
              />
              <MetricCard
                label={aa.pendingOpen}
                value={fmt(today.live.pendingCents)}
                sub={aa.pendingCountSub.replace("{n}", String(today.live.pendingCount))}
              />
            </div>
            {today.closed && today.close ? (
              <div className="text-sm space-y-1">
                <p className="text-semantic-success font-medium">
                  {aa.closedAt.replace(
                    "{time}",
                    new Date(today.close.closedAt).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  )}
                </p>
                <p className="text-brand-muted">
                  {aa.snapshotLine
                    .replace("{paid}", fmt(today.close.paidCents))
                    .replace("{pending}", fmt(today.close.pendingCents))}
                </p>
                {today.live.paidAfterCloseCents > 0 && (
                  <p className="text-brand-muted">
                    {aa.paidAfterClose.replace("{amount}", fmt(today.live.paidAfterCloseCents))}
                  </p>
                )}
              </div>
            ) : canCloseDay ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder={aa.notes}
                  className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface"
                />
                <button
                  type="button"
                  disabled={closing}
                  onClick={() => void closeDay(closeNotes.trim() || undefined)}
                  className="px-4 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg disabled:opacity-50"
                >
                  {closing ? aa.closing : aa.closeDay}
                </button>
              </div>
            ) : (
              <p className="text-sm text-brand-muted">{aa.dayStillOpen}</p>
            )}

            {history.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-medium text-brand-muted mb-2">{aa.history}</p>
                <ul className="divide-y divide-brand-border text-sm">
                  {history.slice(0, 7).map((c) => (
                    <li key={c.id} className="flex justify-between gap-3 py-2">
                      <span className="text-brand-ink">{c.closeDate}</span>
                      <span className="text-brand-muted">{fmt(c.paidCents)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                void reload();
                void reloadClose();
              }}
              className="text-xs text-brand-muted hover:text-brand-ink"
            >
              {aa.refresh}
            </button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
