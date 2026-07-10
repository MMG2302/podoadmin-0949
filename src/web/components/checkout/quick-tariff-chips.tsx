import { formatTariffAmount, type CheckoutQuickTariff } from "../../types/checkout-tariff";

interface QuickTariffChipsProps {
  tariffs: CheckoutQuickTariff[];
  onSelect: (tariff: CheckoutQuickTariff) => void;
  disabled?: boolean;
}

export function QuickTariffChips({ tariffs, onSelect, disabled }: QuickTariffChipsProps) {
  if (tariffs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tariffs.map((tariff) => (
        <button
          key={tariff.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(tariff)}
          className="px-3 py-1.5 text-sm rounded-lg border border-brand-border bg-brand-canvas text-brand-ink hover:bg-brand-ink hover:text-brand-ink-fg transition-colors disabled:opacity-50"
        >
          {tariff.label} ({formatTariffAmount(tariff.amountCents)})
        </button>
      ))}
    </div>
  );
}
