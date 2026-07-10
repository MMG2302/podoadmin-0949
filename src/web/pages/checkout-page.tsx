import { useCallback, useEffect, useMemo, useState } from "react";

import { MainLayout } from "../components/layout/main-layout";

import { useLanguage } from "../contexts/language-context";

import { useAuth } from "../contexts/auth-context";

import { usePermissions } from "../hooks/use-permissions";

import { useCheckoutTariffs } from "../hooks/use-checkout-tariffs";

import { api } from "../lib/api-client";

import { CheckoutTariffsEditor } from "../components/checkout/checkout-tariffs-editor";

import { QuickTariffChips } from "../components/checkout/quick-tariff-chips";

import {

  type CheckoutHandoff,

  formatCheckoutAmount,

  parseAmountToCents,

} from "../types/checkout-handoff";

import type { CheckoutQuickTariff } from "../types/checkout-tariff";



type TabId = "pending" | "paid";



function formatTime(iso: string): string {

  try {

    return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  } catch {

    return "";

  }

}



function HandoffAmountForm({

  handoff,

  tariffs,

  onSaved,

  savingLabel,

  submitLabel,

}: {

  handoff: CheckoutHandoff;

  tariffs: CheckoutQuickTariff[];

  onSaved: () => void;

  savingLabel: string;

  submitLabel: string;

}) {

  const [amount, setAmount] = useState("");

  const [saving, setSaving] = useState(false);



  const applyTariff = (tariff: CheckoutQuickTariff) => {

    setAmount((tariff.amountCents / 100).toFixed(2));

  };



  const handleSave = async () => {

    const amountCents = parseAmountToCents(amount);

    if (amountCents == null || amountCents <= 0) return;

    setSaving(true);

    const res = await api.patch<{ success: boolean }>(`/checkout-handoffs/${handoff.id}`, {

      amountCents,

    });

    setSaving(false);

    if (res.success && res.data?.success) onSaved();

  };



  return (

    <div className="space-y-2 pt-2 border-t border-brand-border mt-3">

      <QuickTariffChips tariffs={tariffs} onSelect={applyTariff} disabled={saving} />

      <div className="flex gap-2">

        <input

          type="text"

          inputMode="decimal"

          value={amount}

          onChange={(e) => setAmount(e.target.value)}

          placeholder="0.00"

          className="flex-1 px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg"

        />

        <button

          type="button"

          onClick={() => void handleSave()}

          disabled={saving}

          className="px-4 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg disabled:opacity-50 shrink-0"

        >

          {saving ? savingLabel : submitLabel}

        </button>

      </div>

    </div>

  );

}



const CheckoutPage = () => {

  const { t } = useLanguage();

  const { user } = useAuth();

  const { isReceptionist, isPodiatrist, isClinicAdmin, hasPermission } = usePermissions();

  const [tab, setTab] = useState<TabId>("pending");

  const [handoffs, setHandoffs] = useState<CheckoutHandoff[]>([]);

  const [loading, setLoading] = useState(true);

  const [podiatristFilter, setPodiatristFilter] = useState<string>("all");

  const [markingId, setMarkingId] = useState<string | null>(null);

  const [requestingId, setRequestingId] = useState<string | null>(null);

  const [requestSentId, setRequestSentId] = useState<string | null>(null);



  const canAccess = hasPermission("view_checkout_handoffs");

  const tariffPodiatristId =

    podiatristFilter !== "all"

      ? podiatristFilter

      : isPodiatrist

        ? user?.id

        : undefined;

  const { tariffs } = useCheckoutTariffs(tariffPodiatristId);



  const loadHandoffs = useCallback(async () => {

    if (!canAccess) return;

    const status = tab === "pending" ? "awaiting_amount,ready_for_payment" : "paid";

    const params = new URLSearchParams({ status, limit: "100" });

    if (podiatristFilter !== "all") params.set("podiatristId", podiatristFilter);



    const res = await api.get<{ success: boolean; handoffs?: CheckoutHandoff[] }>(

      `/checkout-handoffs?${params.toString()}`

    );

    if (res.success && res.data?.handoffs) {

      setHandoffs(res.data.handoffs);

    }

    setLoading(false);

  }, [canAccess, tab, podiatristFilter]);



  useEffect(() => {

    setLoading(true);

    void loadHandoffs();

    const interval = setInterval(() => {
      if (!document.hidden) void loadHandoffs();
    }, 5000);

    return () => clearInterval(interval);

  }, [loadHandoffs]);



  const podiatristOptions = useMemo(() => {

    const map = new Map<string, string>();

    for (const h of handoffs) {

      if (!map.has(h.podiatristId)) {

        map.set(h.podiatristId, h.podiatristName || h.podiatristId);

      }

    }

    return [...map.entries()].map(([id, name]) => ({ id, name }));

  }, [handoffs]);



  const showPodiatristFilter = (isReceptionist || isClinicAdmin) && podiatristOptions.length > 1;

  const canEditTariffs = isPodiatrist || isClinicAdmin;



  const handleMarkPaid = async (handoff: CheckoutHandoff) => {

    if (!confirm(t.checkout.confirmPaid.replace("{patient}", handoff.patientName || ""))) return;

    setMarkingId(handoff.id);

    const res = await api.patch<{ success: boolean }>(`/checkout-handoffs/${handoff.id}`, {

      status: "paid",

    });

    setMarkingId(null);

    if (res.success && res.data?.success) void loadHandoffs();

  };



  const handleRequestAmount = async (handoff: CheckoutHandoff) => {

    setRequestingId(handoff.id);

    const res = await api.post<{ success: boolean }>(

      `/checkout-handoffs/${handoff.id}/request-amount`,

      {}

    );

    setRequestingId(null);

    if (res.success && res.data?.success) {

      setRequestSentId(handoff.id);

      setTimeout(() => setRequestSentId(null), 4000);

    }

  };



  const statusLabel = (status: CheckoutHandoff["status"]) => {

    switch (status) {

      case "awaiting_amount":

        return t.checkout.statusAwaiting;

      case "ready_for_payment":

        return t.checkout.statusReady;

      case "paid":

        return t.checkout.statusPaid;

      default:

        return status;

    }

  };



  if (!canAccess) {

    return (

      <MainLayout title={t.checkout.title}>

        <p className="text-brand-muted">Acceso denegado</p>

      </MainLayout>

    );

  }



  const subtitle = isReceptionist

    ? t.checkout.receptionHint

    : isPodiatrist

      ? t.checkout.podiatristHint

      : t.checkout.adminHint;



  return (

    <MainLayout title={t.checkout.title}>

      <div className="space-y-6 max-w-3xl">

        <p className="text-sm text-brand-muted">{subtitle}</p>



        {canEditTariffs && (

          <CheckoutTariffsEditor

            podiatristId={isPodiatrist ? user?.id : podiatristFilter !== "all" ? podiatristFilter : undefined}

            canEdit={canEditTariffs}

          />

        )}



        <div className="flex flex-wrap items-center gap-3">

          <div className="inline-flex rounded-lg border border-brand-border overflow-hidden">

            <button

              type="button"

              onClick={() => setTab("pending")}

              className={`px-4 py-2 text-sm font-medium transition-colors ${

                tab === "pending"

                  ? "bg-brand-ink text-brand-ink-fg"

                  : "bg-brand-surface text-brand-muted hover:bg-brand-canvas"

              }`}

            >

              {t.checkout.tabPending}

            </button>

            <button

              type="button"

              onClick={() => setTab("paid")}

              className={`px-4 py-2 text-sm font-medium transition-colors ${

                tab === "paid"

                  ? "bg-brand-ink text-brand-ink-fg"

                  : "bg-brand-surface text-brand-muted hover:bg-brand-canvas"

              }`}

            >

              {t.checkout.tabPaid}

            </button>

          </div>



          {showPodiatristFilter && (

            <select

              value={podiatristFilter}

              onChange={(e) => setPodiatristFilter(e.target.value)}

              className="px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg text-brand-ink"

            >

              <option value="all">{t.checkout.allPodiatrists}</option>

              {podiatristOptions.map((p) => (

                <option key={p.id} value={p.id}>

                  {p.name}

                </option>

              ))}

            </select>

          )}

        </div>



        {loading && handoffs.length === 0 ? (

          <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center text-brand-muted">

            {t.common.loading}

          </div>

        ) : handoffs.length === 0 ? (

          <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center">

            <p className="text-brand-muted">

              {tab === "pending" ? t.checkout.emptyPending : t.checkout.emptyPaid}

            </p>

          </div>

        ) : (

          <ul className="space-y-3">

            {handoffs.map((handoff) => (

              <li

                key={handoff.id}

                className="bg-brand-surface rounded-xl border border-brand-border p-4 sm:p-5"

              >

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2 mb-1">

                      <h3 className="font-semibold text-brand-ink truncate">

                        {handoff.patientName || handoff.patientId}

                      </h3>

                      <span

                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${

                          handoff.status === "ready_for_payment"

                            ? "bg-semantic-success-bg text-semantic-success"

                            : handoff.status === "awaiting_amount"

                              ? "bg-semantic-warning-bg text-semantic-warning"

                              : "bg-brand-canvas text-brand-muted"

                        }`}

                      >

                        {statusLabel(handoff.status)}

                      </span>

                    </div>



                    {(isReceptionist || isClinicAdmin) && (

                      <p className="text-sm text-brand-muted">{handoff.podiatristName}</p>

                    )}



                    <p className="text-2xl font-semibold text-brand-ink mt-2">

                      {formatCheckoutAmount(handoff.amountCents, handoff.currency)}

                    </p>



                    {handoff.notes && (

                      <p className="text-sm text-brand-muted mt-1">{handoff.notes}</p>

                    )}



                    <p className="text-xs text-brand-muted mt-2">

                      {formatTime(handoff.createdAt)}

                      {handoff.paidAt && tab === "paid" && (

                        <> · {t.checkout.paidAt} {formatTime(handoff.paidAt)}</>

                      )}

                    </p>



                    {tab === "pending" &&

                      handoff.status === "awaiting_amount" &&

                      isPodiatrist &&

                      handoff.podiatristId === user?.id && (

                        <HandoffAmountForm

                          handoff={handoff}

                          tariffs={tariffs}

                          onSaved={() => void loadHandoffs()}

                          savingLabel={t.checkout.saving}

                          submitLabel={t.checkout.setAmount}

                        />

                      )}

                  </div>



                  {tab === "pending" && (

                    <div className="flex flex-col gap-2 shrink-0">

                      {handoff.status === "ready_for_payment" && (

                        <button

                          type="button"

                          onClick={() => void handleMarkPaid(handoff)}

                          disabled={markingId === handoff.id}

                          className="px-5 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50 min-h-[44px]"

                        >

                          {markingId === handoff.id ? t.checkout.saving : t.checkout.markPaid}

                        </button>

                      )}

                      {handoff.status === "awaiting_amount" &&

                        (isReceptionist || isClinicAdmin) && (

                          <button

                            type="button"

                            onClick={() => void handleRequestAmount(handoff)}

                            disabled={requestingId === handoff.id}

                            className="px-5 py-2.5 border border-brand-border text-brand-ink rounded-lg text-sm font-medium hover:bg-brand-canvas transition-colors disabled:opacity-50 min-h-[44px]"

                          >

                            {requestingId === handoff.id

                              ? t.checkout.saving

                              : requestSentId === handoff.id

                                ? t.checkout.requestAmountSent

                                : t.checkout.requestAmount}

                          </button>

                        )}

                    </div>

                  )}

                </div>

              </li>

            ))}

          </ul>

        )}

      </div>

    </MainLayout>

  );

};



export default CheckoutPage;


