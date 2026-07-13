import type { CheckoutViewMode } from "../../types/checkout-analytics";

const VIEW_LABELS: Record<CheckoutViewMode, string> = {
  operations: "Operación",
  sales: "Ventas",
  collections: "Cobranza",
  profit: "Utilidad",
};

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
  onViewChange: (view: CheckoutViewMode) => void;
};

export function CheckoutViewTabs({ view, onViewChange }: Props) {
  return (
    <SegmentedTabs
      value={view}
      onChange={onViewChange}
      options={(Object.entries(VIEW_LABELS) as [CheckoutViewMode, string][]).map(([id, label]) => ({
        id,
        label,
      }))}
    />
  );
}
