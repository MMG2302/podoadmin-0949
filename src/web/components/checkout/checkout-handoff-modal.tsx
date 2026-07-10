import { useState } from "react";

import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from "../ui/app-modal";

import { useLanguage } from "../../contexts/language-context";

import { useAuth } from "../../contexts/auth-context";

import { api } from "../../lib/api-client";

import { useCheckoutTariffs } from "../../hooks/use-checkout-tariffs";

import { QuickTariffChips } from "./quick-tariff-chips";

import { parseAmountToCents } from "../../types/checkout-handoff";

import type { CheckoutQuickTariff } from "../../types/checkout-tariff";



export interface CheckoutHandoffModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  sessionId?: string;
  onSuccess?: () => void;
  zIndex?: number;
}



export function CheckoutHandoffModal({
  open,
  onClose,
  patientId,
  patientName,
  sessionId,
  onSuccess,
  zIndex,
}: CheckoutHandoffModalProps) {

  const { t } = useLanguage();

  const { user } = useAuth();

  const { tariffs } = useCheckoutTariffs(user?.role === "podiatrist" ? user.id : undefined);

  const [amount, setAmount] = useState("");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const reset = () => {

    setAmount("");

    setNotes("");

    setError(null);

  };



  const handleSkip = async () => {

    setSaving(true);

    await api.post("/checkout-handoffs", {

      patientId,

      sessionId,

      amountCents: 0,

      currency: "MXN",

    });

    setSaving(false);

    reset();

    onClose();

  };



  const applyTariff = (tariff: CheckoutQuickTariff) => {

    setAmount((tariff.amountCents / 100).toFixed(2));

    if (!notes.trim()) setNotes(tariff.label);

  };



  const handleSubmit = async () => {

    const amountCents = parseAmountToCents(amount);

    if (amountCents == null || amountCents <= 0) {

      setError(t.checkout.invalidAmount);

      return;

    }



    setSaving(true);

    setError(null);



    const res = await api.post<{ success: boolean; error?: string; message?: string }>(

      "/checkout-handoffs",

      {

        patientId,

        sessionId,

        amountCents,

        currency: "MXN",

        notes: notes.trim() || undefined,

      }

    );



    setSaving(false);



    if (res.success && res.data?.success) {

      reset();

      onSuccess?.();

      onClose();

      return;

    }



    setError(res.message || res.data?.error || t.checkout.saveFailed);

  };



  return (

    <AppModal open={open} onClose={() => void handleSkip()} maxWidth="md" panelId="checkout-handoff-modal" zIndex={zIndex}>

      <AppModalHeader>

        <div className="flex items-start justify-between gap-3">

          <div>

            <h2 className="text-lg font-semibold text-brand-ink">{t.checkout.modalTitle}</h2>

            <p className="text-sm text-brand-muted mt-0.5">

              {t.checkout.modalSubtitle.replace("{patient}", patientName)}

            </p>

          </div>

          <button

            type="button"

            onClick={() => void handleSkip()}

            disabled={saving}

            className="p-2 text-brand-muted hover:text-brand-ink rounded-lg disabled:opacity-50"

            aria-label={t.common.close}

          >

            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>

              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />

            </svg>

          </button>

        </div>

      </AppModalHeader>

      <AppModalBody>

        <p className="text-sm text-brand-muted mb-4">{t.checkout.modalHint}</p>



        <div className="space-y-4">

          <div>

            <label className="block text-sm font-medium text-brand-ink mb-2">

              {t.checkout.quickTariffs}

            </label>

            <QuickTariffChips tariffs={tariffs} onSelect={applyTariff} disabled={saving} />

          </div>



          <div>

            <label className="block text-sm font-medium text-brand-ink mb-1">

              {t.checkout.amountLabel}

            </label>

            <div className="relative">

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-sm">$</span>

              <input

                type="text"

                inputMode="decimal"

                value={amount}

                onChange={(e) => setAmount(e.target.value)}

                placeholder="800.00"

                autoFocus

                className="w-full pl-8 pr-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent"

              />

            </div>

          </div>



          <div>

            <label className="block text-sm font-medium text-brand-ink mb-1">

              {t.checkout.notesLabel}

            </label>

            <input

              type="text"

              value={notes}

              onChange={(e) => setNotes(e.target.value)}

              placeholder={t.checkout.notesPlaceholder}

              className="w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent"

            />

          </div>



          {error && <p className="text-sm text-semantic-error">{error}</p>}

        </div>

      </AppModalBody>

      <AppModalFooter>

        <button

          type="button"

          onClick={() => void handleSkip()}

          disabled={saving}

          className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg font-medium hover:bg-brand-border/30 transition-colors disabled:opacity-50"

        >

          {t.checkout.skipForNow}

        </button>

        <button

          type="button"

          onClick={handleSubmit}

          disabled={saving}

          className="flex-1 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50"

        >

          {saving ? t.checkout.saving : t.checkout.sendToReception}

        </button>

      </AppModalFooter>

    </AppModal>

  );

}


