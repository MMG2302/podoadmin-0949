import { useState } from "react";
import { useLanguage } from "../../contexts/language-context";
import { useCheckoutTariffs } from "../../hooks/use-checkout-tariffs";
import { formatTariffAmount, type CheckoutQuickTariff } from "../../types/checkout-tariff";
import { parseAmountToCents } from "../../types/checkout-handoff";

interface CheckoutTariffsEditorProps {
  podiatristId?: string;
  canEdit: boolean;
}

export function CheckoutTariffsEditor({ podiatristId, canEdit }: CheckoutTariffsEditorProps) {
  const { t } = useLanguage();
  const { tariffs, saveTariffs, loading } = useCheckoutTariffs(podiatristId);
  const [draft, setDraft] = useState<CheckoutQuickTariff[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);
  /** Texto libre mientras el usuario escribe; evita reformatear a .toFixed(2) en cada tecla. */
  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});

  const rows = draft ?? tariffs;

  const formatAmountDisplay = (amountCents: number) =>
    amountCents > 0 ? (amountCents / 100).toFixed(2) : "";

  const sanitizeAmountInput = (value: string) => value.replace(/[^\d.,]/g, "");

  const flushEditingAmount = (row: CheckoutQuickTariff): CheckoutQuickTariff => {
    const text = editingAmounts[row.id];
    if (text === undefined) return row;
    const cents = parseAmountToCents(text);
    return { ...row, amountCents: cents ?? 0 };
  };

  const updateRow = (index: number, patch: Partial<CheckoutQuickTariff>) => {
    setDraft((prev) => {
      const base = prev ?? tariffs;
      return base.map((row, i) => (i === index ? { ...row, ...patch } : row));
    });
    setSaved(false);
  };

  const addRow = () => {
    setDraft((prev) => {
      const base = prev ?? tariffs;
      if (base.length >= 12) return base;
      return [
        ...base,
        { id: `tarifa_${Date.now()}`, label: "", amountCents: 0 },
      ];
    });
  };

  const removeRow = (index: number) => {
    setDraft((prev) => {
      const base = prev ?? tariffs;
      if (base.length <= 1) return base;
      return base.filter((_, i) => i !== index);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const flushedRows = rows.map(flushEditingAmount);
    const normalized = flushedRows.map((row) => ({
      ...row,
      amountCents: row.amountCents > 0 ? row.amountCents : 0,
    }));
    const ok = await saveTariffs(normalized);
    setSaving(false);
    if (ok) {
      setDraft(null);
      setEditingAmounts({});
      setSaved(true);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-brand-canvas hover:bg-brand-border/20 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-brand-ink">{t.checkout.tariffsTitle}</span>
        <svg
          className={`w-4 h-4 text-brand-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="p-4 border-t border-brand-border space-y-3">
          <p className="text-xs text-brand-muted">{t.checkout.tariffsHint}</p>

          <ul className="space-y-2">
            {rows.map((row, index) => (
              <li key={row.id} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={row.label}
                  disabled={!canEdit}
                  onChange={(e) => updateRow(index, { label: e.target.value })}
                  placeholder={t.checkout.tariffLabelPlaceholder}
                  className="flex-1 min-w-[120px] px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={!canEdit}
                  value={
                    editingAmounts[row.id] !== undefined
                      ? editingAmounts[row.id]
                      : formatAmountDisplay(row.amountCents)
                  }
                  onFocus={() => {
                    setEditingAmounts((prev) => ({
                      ...prev,
                      [row.id]:
                        prev[row.id] ?? formatAmountDisplay(row.amountCents),
                    }));
                  }}
                  onChange={(e) => {
                    const text = sanitizeAmountInput(e.target.value);
                    setEditingAmounts((prev) => ({ ...prev, [row.id]: text }));
                    const cents = parseAmountToCents(text);
                    updateRow(index, { amountCents: cents ?? 0 });
                  }}
                  onBlur={() => {
                    const text = editingAmounts[row.id];
                    if (text !== undefined) {
                      const cents = parseAmountToCents(text);
                      updateRow(index, { amountCents: cents ?? 0 });
                    }
                    setEditingAmounts((prev) => {
                      const next = { ...prev };
                      delete next[row.id];
                      return next;
                    });
                  }}
                  placeholder="0.00"
                  className="w-28 px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg"
                />
                {canEdit && rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="p-2 text-brand-muted hover:text-semantic-error rounded-lg"
                    aria-label={t.common.delete}
                  >
                    ×
                  </button>
                )}
                {!canEdit && (
                  <span className="text-sm text-brand-muted">{formatTariffAmount(row.amountCents)}</span>
                )}
              </li>
            ))}
          </ul>

          {canEdit && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1.5 text-sm border border-brand-border rounded-lg hover:bg-brand-canvas"
              >
                {t.checkout.addTariff}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="px-4 py-1.5 text-sm bg-brand-ink text-brand-ink-fg rounded-lg disabled:opacity-50"
              >
                {saving ? t.checkout.saving : t.checkout.saveTariffs}
              </button>
              {saved && (
                <span className="text-sm text-semantic-success self-center">{t.checkout.tariffsSaved}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
