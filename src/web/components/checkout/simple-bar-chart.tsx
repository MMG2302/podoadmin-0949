import { useLanguage } from "../../contexts/language-context";

type BarPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
  /** Etiqueta del periodo anterior (visible en compareMode). */
  secondaryLabel?: string;
};

type Props = {
  data: BarPoint[];
  formatValue?: (value: number) => string;
  compareMode?: boolean;
  height?: number;
  className?: string;
};

export function SimpleBarChart({
  data,
  formatValue = (v) => String(v),
  compareMode = false,
  height = 160,
  className = "",
}: Props) {
  const { t } = useLanguage();
  const a = t.checkout.analytics;

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center text-sm text-brand-muted ${className}`} style={{ height }}>
        {a.emptyPeriod}
      </div>
    );
  }

  const max = Math.max(
    ...data.flatMap((d) => (compareMode ? [d.value, d.secondaryValue ?? 0] : [d.value])),
    1
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className="flex items-end gap-1 sm:gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height }}
      >
        {data.map((point) => {
          const primaryPct = Math.max(4, Math.round((point.value / max) * 100));
          const secondaryPct = compareMode
            ? Math.max(4, Math.round(((point.secondaryValue ?? 0) / max) * 100))
            : 0;

          return (
            <div
              key={point.label}
              className={`flex flex-col items-center justify-end flex-1 h-full gap-1 ${
                compareMode && point.secondaryLabel
                  ? "min-w-[56px] sm:min-w-[72px]"
                  : "min-w-[36px] sm:min-w-[44px]"
              }`}
              title={`${
                compareMode && point.secondaryLabel
                  ? `${point.secondaryLabel} / ${point.label}`
                  : point.label
              }: ${formatValue(point.value)}${
                compareMode && point.secondaryValue != null
                  ? ` / ${a.prevShort}: ${formatValue(point.secondaryValue)}`
                  : ""
              }`}
            >
              <div className="flex items-end justify-center gap-0.5 w-full h-[calc(100%-1.25rem)]">
                {compareMode ? (
                  <>
                    <div
                      className="w-[42%] rounded-t bg-brand-border/70 transition-all"
                      style={{ height: `${secondaryPct}%` }}
                    />
                    <div
                      className="w-[42%] rounded-t bg-brand-ink transition-all"
                      style={{ height: `${primaryPct}%` }}
                    />
                  </>
                ) : (
                  <div
                    className="w-[70%] rounded-t bg-brand-ink transition-all"
                    style={{ height: `${primaryPct}%` }}
                  />
                )}
              </div>
              <span className="text-[10px] sm:text-xs text-brand-muted w-full text-center leading-tight truncate">
                {compareMode && point.secondaryLabel ? (
                  <>
                    <span className="opacity-80">{point.secondaryLabel}</span>
                    <span className="mx-0.5 opacity-50">·</span>
                    <span className="text-brand-ink/80">{point.label}</span>
                  </>
                ) : (
                  point.label
                )}
              </span>
            </div>
          );
        })}
      </div>
      {compareMode && (
        <div className="flex flex-wrap gap-3 text-xs text-brand-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-brand-ink" />
            {a.currentPeriod}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-brand-border/70" />
            {a.previousPeriodLegend}
          </span>
        </div>
      )}
    </div>
  );
}

type LinePoint = { label: string; value: number };

export function SimpleTrendChart({
  data,
  formatValue = (v) => String(v),
  height = 120,
  className = "",
}: {
  data: LinePoint[];
  formatValue?: (value: number) => string;
  height?: number;
  className?: string;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 100;
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const points = data
    .map((d, i) => {
      const x = i * step;
      const y = height - (d.value / max) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-brand-ink"
          points={points}
        />
        {data.map((d, i) => {
          const x = i * step;
          const y = height - (d.value / max) * (height - 8) - 4;
          return <circle key={d.label} cx={x} cy={y} r="2.5" className="fill-brand-ink" />;
        })}
      </svg>
      <div className="flex justify-between gap-1 mt-1 overflow-x-auto text-[10px] sm:text-xs text-brand-muted">
        {data.map((d) => (
          <span key={d.label} className="shrink-0" title={formatValue(d.value)}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
