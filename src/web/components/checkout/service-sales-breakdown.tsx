import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../contexts/language-context";

export type ServiceSalesItem = {
  label: string;
  totalCents: number;
  count: number;
  sharePercent: number;
  /** Extra line under the row (e.g. estimated margin in profit view). */
  secondaryLabel?: string;
};

type MetricMode = "count" | "revenue";

const CHART_TOP_N = 8;
const LIST_PAGE_SIZE = 20;
const MAX_SELECTED = 8;

type HorizontalBarPoint = {
  label: string;
  fullLabel: string;
  value: number;
  mute?: boolean;
};

function HorizontalBarChart({
  data,
  formatValue,
  emptyLabel,
  className = "",
}: {
  data: HorizontalBarPoint[];
  formatValue: (value: number) => string;
  emptyLabel: string;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-sm text-brand-muted py-8 ${className}`}>
        {emptyLabel}
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className={`space-y-2.5 ${className}`}>
      {data.map((point) => {
        const pct = Math.max(2, Math.round((point.value / max) * 100));
        return (
          <li
            key={point.fullLabel}
            className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] sm:grid-cols-[minmax(0,11rem)_1fr_auto] gap-2 sm:gap-3 items-center"
          >
            <span
              className="text-xs sm:text-sm text-brand-ink truncate font-medium"
              title={point.fullLabel}
            >
              {point.label}
            </span>
            <div className="h-2.5 sm:h-3 rounded-full bg-brand-canvas overflow-hidden min-w-0">
              <div
                className={`h-full rounded-full transition-all ${
                  point.mute ? "bg-brand-border" : "bg-brand-ink"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-brand-ink tabular-nums shrink-0 text-right min-w-[3.5rem]">
              {formatValue(point.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function buildChartRows(
  filtered: ServiceSalesItem[],
  selected: string[],
  metricMode: MetricMode,
  otherCountLabel: (n: number) => string,
  otherServicesLabel: (n: number) => string
): HorizontalBarPoint[] {
  const valueOf = (item: ServiceSalesItem) =>
    metricMode === "count" ? item.count : item.totalCents;

  if (selected.length > 0) {
    const selectedSet = new Set(selected);
    return filtered
      .filter((item) => selectedSet.has(item.label))
      .sort((a, b) => valueOf(b) - valueOf(a))
      .map((item) => ({
        label: item.label,
        fullLabel: item.label,
        value: valueOf(item),
      }));
  }

  const sorted = [...filtered].sort((a, b) => valueOf(b) - valueOf(a));
  if (sorted.length <= CHART_TOP_N) {
    return sorted.map((item) => ({
      label: item.label,
      fullLabel: item.label,
      value: valueOf(item),
    }));
  }

  const top = sorted.slice(0, CHART_TOP_N);
  const rest = sorted.slice(CHART_TOP_N);
  const restValue = rest.reduce((sum, item) => sum + valueOf(item), 0);
  const rows: HorizontalBarPoint[] = top.map((item) => ({
    label: item.label,
    fullLabel: item.label,
    value: valueOf(item),
  }));
  if (restValue > 0) {
    rows.push({
      label: otherCountLabel(rest.length),
      fullLabel: otherServicesLabel(rest.length),
      value: restValue,
      mute: true,
    });
  }
  return rows;
}

type Props = {
  items: ServiceSalesItem[];
  formatMoney: (cents: number) => string;
  emptyMessage?: string;
  /** When true, list shows secondaryLabel (e.g. margin). */
  showSecondary?: boolean;
};

export function ServiceSalesBreakdown({
  items,
  formatMoney,
  emptyMessage,
  showSecondary = false,
}: Props) {
  const { t } = useLanguage();
  const a = t.checkout.analytics;
  const resolvedEmpty = emptyMessage ?? a.emptyServicesBreakdown;
  const [query, setQuery] = useState("");
  const [metricMode, setMetricMode] = useState<MetricMode>("revenue");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [listVisibleCount, setListVisibleCount] = useState(LIST_PAGE_SIZE);

  useEffect(() => {
    setListVisibleCount(LIST_PAGE_SIZE);
    setSelectedLabels((prev) => prev.filter((label) => items.some((i) => i.label === label)));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const chartRows = useMemo(
    () =>
      buildChartRows(
        filtered,
        selectedLabels,
        metricMode,
        (n) => a.otherCount.replace("{n}", String(n)),
        (n) => a.otherServices.replace("{n}", String(n))
      ),
    [filtered, selectedLabels, metricMode, a.otherCount, a.otherServices]
  );

  const listItems = useMemo(() => {
    const valueOf = (item: ServiceSalesItem) =>
      metricMode === "count" ? item.count : item.totalCents;
    return [...filtered].sort((aItem, b) => valueOf(b) - valueOf(aItem));
  }, [filtered, metricMode]);

  const visibleList = listItems.slice(0, listVisibleCount);
  const hasMore = listItems.length > listVisibleCount;

  const toggleSelect = (label: string) => {
    setSelectedLabels((prev) => {
      if (prev.includes(label)) return prev.filter((l) => l !== label);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, label];
    });
  };

  const clearSelection = () => setSelectedLabels([]);

  const formatChartValue = (value: number) =>
    metricMode === "count" ? String(value) : formatMoney(value);

  if (items.length === 0) {
    return <p className="text-sm text-brand-muted">{resolvedEmpty}</p>;
  }

  const showingMeta = (() => {
    const base = a.showingServices
      .replace("{filtered}", String(filtered.length))
      .replace("{total}", String(items.length));
    if (selectedLabels.length > 0) {
      return `${base} · ${a.selectedCount.replace("{n}", String(selectedLabels.length))}`;
    }
    if (filtered.length > CHART_TOP_N) {
      return `${base} · ${a.chartTopN.replace("{n}", String(CHART_TOP_N))}`;
    }
    return base;
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="inline-flex gap-1 p-1 rounded-lg border border-brand-border bg-brand-canvas w-fit">
          <button
            type="button"
            onClick={() => setMetricMode("revenue")}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium min-h-[36px] transition-colors ${
              metricMode === "revenue"
                ? "bg-brand-ink text-brand-ink-fg"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            {a.metricRevenue}
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("count")}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium min-h-[36px] transition-colors ${
              metricMode === "count"
                ? "bg-brand-ink text-brand-ink-fg"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            {a.metricSalesCount}
          </button>
        </div>

        <div className="relative flex-1 min-w-0">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setListVisibleCount(LIST_PAGE_SIZE);
            }}
            placeholder={a.searchService}
            className="w-full pl-9 pr-3 py-2 text-sm bg-brand-canvas border border-brand-border rounded-lg text-brand-ink min-h-[40px] placeholder:text-brand-muted"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-brand-muted">
        <p>{showingMeta}</p>
        {selectedLabels.length > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="font-medium text-brand-ink underline-offset-2 hover:underline"
          >
            {a.clearSelection}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-brand-muted py-4">
          {a.noServiceMatch.replace("{q}", query.trim())}
        </p>
      ) : (
        <>
          <div className="rounded-lg border border-brand-border/60 bg-brand-canvas/40 p-3 sm:p-4">
            <p className="text-xs text-brand-muted mb-3">
              {selectedLabels.length > 0
                ? a.compareSelected
                : metricMode === "revenue"
                  ? a.revenueByService
                  : a.salesByServiceChart}
            </p>
            <HorizontalBarChart
              data={chartRows}
              formatValue={formatChartValue}
              emptyLabel={a.noChartData}
            />
          </div>

          <p className="text-xs text-brand-muted">
            {a.clickToPin.replace("{max}", String(MAX_SELECTED))}
          </p>

          <div className="max-h-80 overflow-y-auto overscroll-contain rounded-lg border border-brand-border divide-y divide-brand-border">
            {visibleList.map((row, idx) => {
              const selected = selectedLabels.includes(row.label);
              const atLimit = selectedLabels.length >= MAX_SELECTED && !selected;
              return (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => toggleSelect(row.label)}
                  disabled={atLimit}
                  title={
                    atLimit
                      ? a.maxServicesTitle.replace("{max}", String(MAX_SELECTED))
                      : selected
                        ? a.removeFromCompare
                        : a.addToCompare
                  }
                  className={`w-full text-left px-3 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected ? "bg-brand-canvas" : "hover:bg-brand-canvas/70"
                  }`}
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-ink truncate">
                        <span className="text-brand-muted font-normal mr-1.5">#{idx + 1}</span>
                        {row.label}
                        {selected && (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-brand-ink border border-brand-border rounded px-1.5 py-0.5">
                            {a.onChart}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {a.saleCountRow.replace("{n}", String(row.count))} ·{" "}
                        {formatMoney(row.totalCents)} · {row.sharePercent}%
                      </p>
                      {showSecondary && row.secondaryLabel && (
                        <p className="text-xs text-brand-muted mt-0.5">{row.secondaryLabel}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-brand-ink shrink-0 tabular-nums">
                      {metricMode === "count" ? row.count : formatMoney(row.totalCents)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-brand-canvas overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-ink/80"
                      style={{ width: `${Math.max(2, Math.min(100, row.sharePercent))}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={() => setListVisibleCount((n) => n + LIST_PAGE_SIZE)}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-brand-ink border border-brand-border rounded-lg hover:bg-brand-canvas min-h-[40px]"
            >
              {a.showMoreRemaining.replace(
                "{n}",
                String(listItems.length - listVisibleCount)
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
