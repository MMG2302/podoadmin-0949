import { useState } from "react";
import type { CheckoutPaymentMethod } from "../../types/checkout-analytics";
import { useLanguage } from "../../contexts/language-context";

const METHODS: CheckoutPaymentMethod[] = ["cash", "card", "transfer"];

type Props = {
  patientName: string;
  open: boolean;
  busy: boolean;
  onConfirm: (method: CheckoutPaymentMethod) => void;
  onCancel: () => void;
};

export function MarkPaidDialog({ patientName, open, busy, onConfirm, onCancel }: Props) {
  const { t } = useLanguage();
  const [method, setMethod] = useState<CheckoutPaymentMethod>("cash");

  if (!open) return null;

  const confirmParts = t.checkout.confirmPaid.split("{patient}");

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t.common.close}
        onClick={onCancel}
      />
      <div className="relative w-full sm:max-w-md bg-brand-surface rounded-t-2xl sm:rounded-xl border border-brand-border p-5 pb-safe space-y-4 shadow-xl">
        <h3 className="text-lg font-semibold text-brand-ink">{t.checkout.confirmPaidTitle}</h3>
        <p className="text-sm text-brand-muted">
          {confirmParts[0]}
          <strong className="text-brand-ink">{patientName}</strong>
          {confirmParts[1] ?? ""}
        </p>

        <div>
          <p className="text-sm font-medium text-brand-ink mb-2">{t.checkout.analytics.paymentMethods}</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`px-2 py-2.5 rounded-lg text-xs sm:text-sm font-medium border min-h-[44px] transition-colors ${
                  method === m
                    ? "bg-brand-ink text-brand-ink-fg border-brand-ink"
                    : "bg-brand-canvas text-brand-muted border-brand-border hover:border-brand-ink/40"
                }`}
              >
                {t.checkout.analytics[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-sm font-medium min-h-[44px]"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(method)}
            disabled={busy}
            className="flex-1 px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
          >
            {busy ? t.checkout.analytics.saving : t.checkout.markPaid}
          </button>
        </div>
      </div>
    </div>
  );
}
