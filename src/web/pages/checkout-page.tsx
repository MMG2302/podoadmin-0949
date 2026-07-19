import { useCallback, useEffect, useMemo, useState } from "react";

import { MainLayout } from "../components/layout/main-layout";

import { useLanguage } from "../contexts/language-context";

import { useAuth } from "../contexts/auth-context";

import { usePermissions } from "../hooks/use-permissions";

import { useCheckoutTariffs } from "../hooks/use-checkout-tariffs";

import { api } from "../lib/api-client";

import { CheckoutTariffsEditor } from "../components/checkout/checkout-tariffs-editor";

import { QuickTariffChips } from "../components/checkout/quick-tariff-chips";

import { CheckoutAnalyticsPanel } from "../components/checkout/checkout-analytics-panel";
import { AgendaAnalyticsPanel } from "../components/checkout/agenda-analytics-panel";
import { CheckoutViewTabs } from "../components/checkout/checkout-view-tabs";
import { PremiumUpsellBanner } from "../components/premium/premium-upsell";
import { useEntitlements } from "../hooks/use-entitlements";

import { MarkPaidDialog } from "../components/checkout/mark-paid-dialog";

import type { CheckoutViewMode, CheckoutPaymentMethod } from "../types/checkout-analytics";

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

  const [amount, setAmount] = useState(
    handoff.amountCents != null && handoff.amountCents > 0
      ? (handoff.amountCents / 100).toFixed(2)
      : ""
  );
  const [serviceNote, setServiceNote] = useState(handoff.notes ?? "");
  const [saving, setSaving] = useState(false);

  const applyTariff = (tariff: CheckoutQuickTariff) => {
    setAmount((tariff.amountCents / 100).toFixed(2));
    setServiceNote(tariff.label);
  };

  const handleSave = async () => {
    const amountCents = parseAmountToCents(amount);
    if (amountCents == null || amountCents <= 0) return;
    setSaving(true);
    const res = await api.patch<{ success: boolean }>(`/checkout-handoffs/${handoff.id}`, {
      amountCents,
      notes: serviceNote.trim() || undefined,
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

  const { user, users, ensureVisibleUsers } = useAuth();

  const { isReceptionist, isPodiatrist, isClinicAdmin, hasPermission } = usePermissions();

  const [tab, setTab] = useState<TabId>("pending");

  const [handoffs, setHandoffs] = useState<CheckoutHandoff[]>([]);

  const [loading, setLoading] = useState(true);

  const [podiatristFilter, setPodiatristFilter] = useState<string>("all");

  const [markingId, setMarkingId] = useState<string | null>(null);

  const [requestingId, setRequestingId] = useState<string | null>(null);

  const [requestSentId, setRequestSentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CheckoutViewMode>("operations");
  const [markPaidTarget, setMarkPaidTarget] = useState<CheckoutHandoff | null>(null);



  const canAccess = hasPermission("view_checkout_handoffs");
  const { has: hasFeature } = useEntitlements();
  const showFullAnalytics = isPodiatrist || isClinicAdmin;
  const showAgendaTab = isPodiatrist || isClinicAdmin || isReceptionist;
  const showViewTabs = showFullAnalytics || showAgendaTab;
  const checkoutTabModes: CheckoutViewMode[] | undefined = isReceptionist
    ? ["operations", "agenda"]
    : showFullAnalytics
      ? ["operations", "sales", "collections", "profit", "agenda"]
      : undefined;
  // Pestañas visibles pero bloqueadas por plan (Base): muestran candado y panel de upsell.
  const lockedModes: CheckoutViewMode[] = [
    ...(hasFeature("checkout_analytics") ? [] : (["sales", "collections", "profit"] as CheckoutViewMode[])),
    ...(hasFeature("agenda_analytics") ? [] : (["agenda"] as CheckoutViewMode[])),
  ];
  const viewModeLocked = lockedModes.includes(viewMode);

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
    if (isClinicAdmin || isReceptionist) {
      void ensureVisibleUsers();
    }
  }, [isClinicAdmin, isReceptionist, ensureVisibleUsers]);

  useEffect(() => {
    if (!canAccess) return;

    setLoading(true);
    void loadHandoffs();

    if (viewMode !== "operations") return;

    const interval = setInterval(() => {
      if (!document.hidden) void loadHandoffs();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadHandoffs, canAccess, viewMode]);



  const handoffPodiatristOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of handoffs) {
      if (!map.has(h.podiatristId)) {
        map.set(h.podiatristId, h.podiatristName || h.podiatristId);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [handoffs]);

  const clinicPodiatristOptions = useMemo(() => {
    if (!user?.clinicId) return [];
    return users
      .filter((u) => u.role === "podiatrist" && u.clinicId === user.clinicId)
      .map((u) => ({ id: u.id, name: u.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [user?.clinicId, users]);

  /** Lista de doctores para filtrar: clínica completa (admin) o los que aparecen en cobros (recepción). */
  const doctorFilterOptions = useMemo(() => {
    if (isClinicAdmin && clinicPodiatristOptions.length > 0) {
      return clinicPodiatristOptions;
    }
    if (isReceptionist && user?.assignedPodiatristIds?.length) {
      const assigned = users
        .filter((u) => user.assignedPodiatristIds!.includes(u.id))
        .map((u) => ({ id: u.id, name: u.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "es"));
      if (assigned.length > 0) return assigned;
    }
    return handoffPodiatristOptions;
  }, [
    isClinicAdmin,
    isReceptionist,
    clinicPodiatristOptions,
    handoffPodiatristOptions,
    users,
    user?.assignedPodiatristIds,
  ]);

  const analyticsPodiatristId =
    isClinicAdmin && podiatristFilter !== "all" ? podiatristFilter : undefined;

  const showPodiatristFilter =
    (isClinicAdmin || isReceptionist) && doctorFilterOptions.length > 0;

  const canEditTariffs = isPodiatrist || isClinicAdmin;



  const handleMarkPaid = async (handoff: CheckoutHandoff, paymentMethod: CheckoutPaymentMethod) => {
    setMarkingId(handoff.id);
    const res = await api.patch<{ success: boolean }>(`/checkout-handoffs/${handoff.id}`, {
      status: "paid",
      paymentMethod,
    });
    setMarkingId(null);
    setMarkPaidTarget(null);
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

      <div className={`space-y-6 ${showViewTabs ? "max-w-5xl" : "max-w-3xl"}`}>

        <p className="text-sm text-brand-muted">{subtitle}</p>

        {showViewTabs && (
          <CheckoutViewTabs
            view={viewMode}
            onViewChange={setViewMode}
            modes={checkoutTabModes}
            lockedModes={lockedModes}
          />
        )}
        {showViewTabs && viewMode !== "operations" && (
          <p className="text-xs text-brand-muted -mt-3">
            {viewMode === "agenda"
              ? t.checkout.viewHintAgenda
              : viewMode === "collections"
                ? t.checkout.viewHintCollections
                : viewMode === "profit"
                  ? t.checkout.viewHintProfit
                  : isClinicAdmin
                    ? t.checkout.viewHintClinicSales
                    : t.checkout.viewHintSales}
          </p>
        )}

        {isClinicAdmin && showPodiatristFilter && (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="checkout-doctor-filter" className="text-sm text-brand-muted shrink-0">
              {t.checkout.viewDataOf}
            </label>
            <select
              id="checkout-doctor-filter"
              value={podiatristFilter}
              onChange={(e) => setPodiatristFilter(e.target.value)}
              className="flex-1 min-w-[180px] max-w-md px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg text-brand-ink min-h-[44px]"
            >
              <option value="all">{t.checkout.entireClinic}</option>
              {doctorFilterOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {isReceptionist && showPodiatristFilter && viewMode === "agenda" && (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="checkout-agenda-doctor" className="text-sm text-brand-muted shrink-0">
              {t.checkout.podiatristLabel}
            </label>
            <select
              id="checkout-agenda-doctor"
              value={podiatristFilter === "all" ? doctorFilterOptions[0]?.id ?? "all" : podiatristFilter}
              onChange={(e) => setPodiatristFilter(e.target.value)}
              className="flex-1 min-w-[180px] max-w-md px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg text-brand-ink min-h-[44px]"
            >
              {doctorFilterOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {viewModeLocked && viewMode !== "operations" && (
          <PremiumUpsellBanner
            body={viewMode === "agenda" ? t.premium.agendaAnalyticsLockedBody : undefined}
          />
        )}

        {!viewModeLocked && viewMode === "agenda" && showAgendaTab && (
          <AgendaAnalyticsPanel
            podiatristId={
              isPodiatrist
                ? user?.id
                : podiatristFilter !== "all"
                  ? podiatristFilter
                  : isReceptionist
                    ? doctorFilterOptions[0]?.id
                    : undefined
            }
            canEditSchedule={isPodiatrist || isClinicAdmin}
            canCloseDay={isPodiatrist || isClinicAdmin || isReceptionist}
          />
        )}

        {!viewModeLocked && showFullAnalytics && viewMode !== "operations" && viewMode !== "agenda" && (
          <CheckoutAnalyticsPanel
            view={viewMode}
            isClinicAdmin={isClinicAdmin}
            analyticsPodiatristId={analyticsPodiatristId}
            podiatristFilterLabel={
              analyticsPodiatristId
                ? doctorFilterOptions.find((p) => p.id === analyticsPodiatristId)?.name
                : undefined
            }
            onSelectPodiatrist={isClinicAdmin ? setPodiatristFilter : undefined}
          />
        )}

        {(viewMode === "operations" || !showViewTabs) && (
        <>
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



          {!isClinicAdmin && showPodiatristFilter && (

            <select

              value={podiatristFilter}

              onChange={(e) => setPodiatristFilter(e.target.value)}

              className="px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg text-brand-ink min-h-[44px]"

            >

              <option value="all">{t.checkout.allPodiatrists}</option>

              {doctorFilterOptions.map((p) => (

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

                          onClick={() => setMarkPaidTarget(handoff)}

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

        </>
        )}

        <MarkPaidDialog
          patientName={markPaidTarget?.patientName || markPaidTarget?.patientId || ""}
          open={markPaidTarget != null}
          busy={markingId != null}
          onConfirm={(method) => {
            if (markPaidTarget) void handleMarkPaid(markPaidTarget, method);
          }}
          onCancel={() => setMarkPaidTarget(null)}
        />

      </div>

    </MainLayout>

  );

};



export default CheckoutPage;


