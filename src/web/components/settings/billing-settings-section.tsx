import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../contexts/auth-context";
import { useLanguage } from "../../contexts/language-context";
import { usePermissions } from "../../hooks/use-permissions";
import { api } from "../../lib/api-client";
import { BILLING_SETTINGS_PATH } from "../../lib/billing-settings-path";
import {
  semanticAlertInfoClass,
  semanticAlertSuccessClass,
  semanticAlertWarningClass,
} from "../../lib/form-field-classes";

interface SubscriptionInfo {
  id: string;
  status: string;
  planId: string;
  daysRemaining: number;
  isActive: boolean;
  hasStripeBilling?: boolean;
  currentPeriodEnd: number;
}

interface TrialEligibility {
  eligible: boolean;
  reason: string;
  message?: string;
  expiresAt?: number;
}

interface PlanOption {
  tier: "base" | "premium";
  planKey: string;
  label: string;
  description: string;
  amountUsd: number;
  stripeConfigured: boolean;
}

interface PricingOverview {
  subjectType: "clinic" | "user";
  podiatristCount: number;
  podiatristLimit: number;
  tier?: "base" | "premium";
  plan: {
    planKey: string;
    label: string;
    description: string;
    amountUsd: number;
    stripeConfigured: boolean;
  };
  plans?: {
    base: PlanOption;
    premium: PlanOption;
  };
  atPodiatristLimit: boolean;
  overIncludedPodiatrists: boolean;
  includedPodiatrists?: number;
  extraPodiatristSeats?: number;
  extraSeatPriceUsd?: number;
  extraSeatStripeConfigured?: boolean;
}

interface TrialVerification {
  emailRequired: boolean;
  cardRequired: boolean;
  emailVerified: boolean;
  cardVerified: boolean;
  email: string | null;
  ready: boolean;
}

export function BillingSettingsSection() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const { isSuperAdmin, isAdmin, isReceptionist } = usePermissions();
  const [, setLocation] = useLocation();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [pricing, setPricing] = useState<PricingOverview | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [trialEligibility, setTrialEligibility] = useState<TrialEligibility | null>(null);
  const [trialVerification, setTrialVerification] = useState<TrialVerification | null>(null);
  const [seatsDraft, setSeatsDraft] = useState<number | null>(null);

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const success = params.get("success");
  const cancelled = params.get("cancelled");
  const trialCard = params.get("trial_card");
  const trialCardSessionId = params.get("session_id");
  const trialCardMock = params.get("trial_card_mock");

  const load = useCallback(async () => {
    setLoading(true);
    const me = await api.get<{
      subscription?: SubscriptionInfo | null;
      stripeEnabled?: boolean;
      canManageBilling?: boolean;
      pricing?: PricingOverview;
      systemAccess?: boolean;
      planTier?: "base" | "premium";
      entitlements?: Record<string, boolean>;
      trialEligibility?: TrialEligibility;
      trialVerification?: TrialVerification;
    }>("/subscriptions/me");
    if (me.success && me.data) {
      setSubscription(me.data.subscription ?? null);
      setStripeEnabled(Boolean(me.data.stripeEnabled));
      setCanManageBilling(Boolean(me.data.canManageBilling));
      if (me.data.pricing) {
        setPricing(me.data.pricing);
        setSeatsDraft(me.data.pricing.extraPodiatristSeats ?? 0);
      }
      if (me.data.trialEligibility) setTrialEligibility(me.data.trialEligibility);
      else setTrialEligibility(null);
      if (me.data.trialVerification) setTrialVerification(me.data.trialVerification);
      else setTrialVerification(null);
      if (typeof me.data.systemAccess === "boolean") {
        // Sincroniza también el plan y sus entitlements (fuente: servidor).
        updateUser({
          systemAccess: me.data.systemAccess,
          ...(me.data.planTier ? { planTier: me.data.planTier } : {}),
          ...(me.data.entitlements ? { entitlements: me.data.entitlements } : {}),
        });
      }
    }
    setLoading(false);
  }, [updateUser]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (success === "1") setMessage(t.settings.billing.paymentReceived);
    if (cancelled === "1") setMessage(t.settings.billing.paymentCancelled);
  }, [success, cancelled]);

  useEffect(() => {
    const completeCard = async () => {
      if (trialCard !== "success" || !trialCardSessionId) return;
      setBusy(true);
      const res = await api.post("/trial/card/complete", { sessionId: trialCardSessionId });
      setBusy(false);
      if (res.success) {
        setMessage(t.settings.billing.cardVerified);
        load();
        setLocation(BILLING_SETTINGS_PATH);
      } else {
        setMessage(res.message || res.error || t.settings.billing.cardVerifyError);
      }
    };
    void completeCard();
  }, [trialCard, trialCardSessionId, load, setLocation]);

  useEffect(() => {
    const mockCard = async () => {
      if (trialCardMock !== "1") return;
      setBusy(true);
      const res = await api.post("/trial/card/mock");
      setBusy(false);
      if (res.success) {
        setMessage(t.settings.billing.cardMockVerified);
        load();
        setLocation(BILLING_SETTINGS_PATH);
      }
    };
    void mockCard();
  }, [trialCardMock, load, setLocation]);

  const startCardSetup = async () => {
    setBusy(true);
    setMessage("");
    const res = await api.post<{ url?: string }>("/trial/card/setup");
    setBusy(false);
    if (res.success && res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    setMessage(res.message || res.error || t.settings.billing.cardSetupError);
  };

  const activateTrial = async () => {
    setBusy(true);
    setMessage("");
    const res = await api.post<{ systemAccess?: boolean; message?: string }>("/trial/activate");
    setBusy(false);
    if (res.success) {
      setMessage(res.data?.message || t.settings.billing.trialActivated);
      if (typeof res.data?.systemAccess === "boolean") {
        updateUser({ systemAccess: res.data.systemAccess });
      }
      load();
    } else {
      setMessage(res.message || res.error || t.settings.billing.trialActivateError);
    }
  };

  const startCheckout = async (tier: "base" | "premium" = "base") => {
    setBusy(true);
    setMessage("");
    const res = await api.post<{ url?: string; message?: string }>("/subscriptions/stripe/checkout", {
      tier,
    });
    setBusy(false);
    if (res.success && res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    setMessage(res.message || res.error || t.settings.billing.checkoutError);
  };

  const upgradeToPremium = async () => {
    setBusy(true);
    setMessage("");
    const res = await api.post<{ success?: boolean; message?: string }>(
      "/subscriptions/stripe/upgrade",
      { tier: "premium" }
    );
    setBusy(false);
    if (res.success) {
      setMessage(t.premium.upgradeSuccess);
      load();
      return;
    }
    setMessage(res.message || res.error || t.settings.billing.checkoutError);
  };

  const saveSeats = async () => {
    if (seatsDraft == null) return;
    setBusy(true);
    setMessage("");
    const res = await api.post<{ pricing?: PricingOverview; message?: string }>(
      "/subscriptions/stripe/seats",
      { seats: seatsDraft }
    );
    setBusy(false);
    if (res.success) {
      setMessage(t.settings.billing.extraSeatsSaved);
      if (res.data?.pricing) {
        setPricing(res.data.pricing);
        setSeatsDraft(res.data.pricing.extraPodiatristSeats ?? seatsDraft);
      }
      load();
      return;
    }
    setMessage(res.message || res.error || t.settings.billing.extraSeatsError);
  };

  const openPortal = async () => {
    setBusy(true);
    setMessage("");
    const res = await api.post<{ url?: string; message?: string }>("/subscriptions/stripe/portal");
    setBusy(false);
    if (res.success && res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    setMessage(res.message || res.error || t.settings.billing.portalError);
  };

  if (isSuperAdmin || isAdmin) {
    return (
      <p className="text-brand-muted text-sm sm:text-base">
        {t.settings.billing.adminNoSub}
      </p>
    );
  }

  if (isReceptionist) {
    return (
      <p className="text-brand-muted text-sm sm:text-base">
        {t.settings.billing.receptionistHint}
      </p>
    );
  }

  const statusLabel: Record<string, string> = {
    active: t.settings.billing.statusActive,
    trial: t.settings.billing.trialPeriod,
    past_due: t.settings.billing.statusPastDue,
    cancelled: t.settings.billing.statusCancelled,
  };

  const checkoutBlocked = pricing?.overIncludedPodiatrists && pricing.subjectType === "clinic";

  return (
    <div className="space-y-4 sm:space-y-6">
      {message && (
        <div className={`${semanticAlertInfoClass} !p-3 text-sm`}>{message}</div>
      )}

      {trialEligibility && !trialEligibility.eligible && trialEligibility.message && !subscription?.hasStripeBilling && (
        <div className={`${semanticAlertWarningClass} !p-3 text-sm`}>
          {trialEligibility.message}
        </div>
      )}

      {trialEligibility?.eligible &&
        !subscription?.hasStripeBilling &&
        !(subscription?.status === "trial" && subscription.isActive) &&
        trialVerification && (
          <div className="p-4 sm:p-5 rounded-xl border border-brand-border bg-brand-canvas space-y-4 text-sm">
            <p className="font-semibold text-brand-ink">{t.settings.billing.activateTrialTitle}</p>
            <p className="text-brand-muted">
              {t.settings.billing.activateTrialHint}
            </p>

            <div className="space-y-2">
              <p className="font-medium text-brand-ink">
                {t.settings.billing.stepEmail} {trialVerification.emailVerified ? "✓" : ""}
              </p>
              {!trialVerification.emailVerified && trialVerification.emailRequired && (
                <p className="text-brand-muted text-xs">
                  {t.settings.billing.emailVerifyHint.replace(
                    "{email}",
                    trialVerification.email ? ` (${trialVerification.email})` : ""
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-medium text-brand-ink">
                {t.settings.billing.stepCard} {trialVerification.cardVerified ? "✓" : ""}
              </p>
              {!trialVerification.cardVerified && trialVerification.cardRequired && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={startCardSetup}
                  className="w-full py-2.5 sm:py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium min-h-[44px]"
                >
                  {t.settings.billing.verifyCard}
                </button>
              )}
            </div>

            {trialVerification.ready && (
              <button
                type="button"
                disabled={busy}
                onClick={activateTrial}
                className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium min-h-[44px]"
              >
                {t.settings.billing.activateMonthTrial}
              </button>
            )}
          </div>
        )}

      {trialEligibility?.eligible && subscription?.status === "trial" && subscription.isActive && (
        <div className={`${semanticAlertSuccessClass} !p-3 text-sm`}>
          {t.settings.billing.trialActive.replace(
            "{date}",
            new Date(subscription.currentPeriodEnd).toLocaleDateString()
          )}
        </div>
      )}

      {checkoutBlocked && (
        <div className={`${semanticAlertWarningClass} !p-3 text-sm`}>
          {t.settings.billing.overLimit
            .replace("{count}", String(pricing?.podiatristCount ?? ""))
            .replace("{limit}", String(pricing?.podiatristLimit ?? ""))}
        </div>
      )}

      {loading ? (
        <p className="text-brand-muted text-sm">{t.settings.billing.loading}</p>
      ) : (
        <div className="bg-brand-surface rounded-xl border border-brand-border p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-sm text-brand-muted">{t.settings.billing.subscriptionTitle}</p>
            <p className="text-base sm:text-lg font-semibold text-brand-ink flex items-center gap-2 flex-wrap">
              {pricing?.plan.label ??
                (pricing?.subjectType === "clinic" ? t.settings.billing.clinicPlan : t.settings.billing.independentPlan)}
              {pricing?.tier && (
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    pricing.tier === "premium"
                      ? "bg-brand-ink text-brand-ink-fg"
                      : "border border-brand-border text-brand-muted"
                  }`}
                >
                  {pricing.tier === "premium" ? t.premium.badge : t.premium.baseBadge}
                </span>
              )}
            </p>
            {pricing?.plan.description && (
              <p className="text-xs text-brand-muted mt-1">{pricing.plan.description}</p>
            )}
          </div>

          {pricing?.subjectType === "clinic" && (
            <div className="text-sm bg-brand-canvas rounded-lg p-3 space-y-1">
              <p>
                <span className="text-brand-muted">{t.settings.billing.activePodiatrists}</span>{" "}
                <strong className="text-brand-ink">
                  {pricing.podiatristCount} / {pricing.podiatristLimit}
                </strong>
              </p>
              {pricing.includedPodiatrists != null && (
                <p className="text-xs text-brand-muted">
                  {t.settings.billing.extraSeatsBreakdown
                    .replace("{included}", String(pricing.includedPodiatrists))
                    .replace("{seats}", String(pricing.extraPodiatristSeats ?? 0))}
                </p>
              )}
            </div>
          )}

          {pricing?.subjectType === "clinic" && canManageBilling && (
            <div className="rounded-xl border border-brand-border p-4 space-y-3">
              <p className="text-sm font-semibold text-brand-ink">
                {t.settings.billing.extraSeatsTitle}
              </p>
              <p className="text-xs text-brand-muted">
                {t.settings.billing.extraSeatsHint
                  .replace("{included}", String(pricing.includedPodiatrists ?? ""))
                  .replace("{price}", String(pricing.extraSeatPriceUsd ?? 10))}
              </p>
              {!subscription?.hasStripeBilling ? (
                <p className="text-sm text-brand-muted">{t.settings.billing.extraSeatsNeedSub}</p>
              ) : (
                (() => {
                  const included = pricing.includedPodiatrists ?? 0;
                  const currentSeats = pricing.extraPodiatristSeats ?? 0;
                  const draft = seatsDraft ?? currentSeats;
                  const minSeats = Math.max(0, pricing.podiatristCount - included);
                  const price = pricing.extraSeatPriceUsd ?? 10;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-brand-muted">
                          {t.settings.billing.extraSeatsLabel}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busy || draft <= minSeats}
                            onClick={() => setSeatsDraft(Math.max(minSeats, draft - 1))}
                            className="w-9 h-9 rounded-lg border border-brand-border text-brand-ink font-semibold disabled:opacity-40"
                            aria-label="-"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-semibold text-brand-ink">{draft}</span>
                          <button
                            type="button"
                            disabled={busy || draft >= 200}
                            onClick={() => setSeatsDraft(draft + 1)}
                            className="w-9 h-9 rounded-lg border border-brand-border text-brand-ink font-semibold disabled:opacity-40"
                            aria-label="+"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-brand-muted">
                        {t.settings.billing.extraSeatsTotal
                          .replace("{seats}", String(draft))
                          .replace("{price}", String(price))
                          .replace("{total}", String(draft * price))}
                      </p>
                      {draft !== currentSeats && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={saveSeats}
                          className="w-full py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
                        >
                          {t.settings.billing.extraSeatsSave}
                        </button>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {pricing?.subjectType === "user" && canManageBilling && (
            <div className="rounded-xl border border-brand-border p-4 space-y-2">
              <p className="text-sm font-semibold text-brand-ink">
                {t.settings.billing.growthTitle}
              </p>
              <p className="text-xs text-brand-muted">{t.settings.billing.growthHint}</p>
              <p className="text-xs text-brand-muted">{t.settings.billing.growthClinicBullet}</p>
              <a
                href={`mailto:soporte@podoadmin.com?subject=${encodeURIComponent("Cambio a plan Clínica - PodoAdmin")}`}
                className="inline-flex items-center justify-center w-full py-2.5 rounded-lg border border-brand-border text-sm font-medium text-brand-ink hover:bg-brand-canvas min-h-[44px]"
              >
                {t.settings.billing.growthContact}
              </a>
            </div>
          )}

          {subscription && (
            <>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-brand-muted shrink-0">{t.settings.billing.status}</span>
                <span
                  className={`font-medium text-right ${
                    subscription.isActive ? "text-semantic-success" : "text-semantic-warning"
                  }`}
                >
                  {statusLabel[subscription.status] || subscription.status}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-brand-muted shrink-0">{t.settings.billing.trialEnd}</span>
                <span className="text-brand-ink text-right">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            </>
          )}

          {!stripeEnabled && (
            <p className={`${semanticAlertWarningClass} !p-3 text-sm`}>
              {t.settings.billing.stripeNotConfigured}
            </p>
          )}

          {stripeEnabled && canManageBilling && (
            <div className="flex flex-col gap-2 pt-2">
              {!subscription?.hasStripeBilling ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["base", "premium"] as const).map((tierKey) => {
                    const option = pricing?.plans?.[tierKey];
                    const label = tierKey === "premium" ? t.premium.planPremium : t.premium.planBase;
                    const configured = option ? option.stripeConfigured : Boolean(pricing?.plan.stripeConfigured);
                    return (
                      <div
                        key={tierKey}
                        className={`rounded-xl border p-4 space-y-2 ${
                          tierKey === "premium" ? "border-brand-ink" : "border-brand-border"
                        }`}
                      >
                        <p className="text-sm font-semibold text-brand-ink">{label}</p>
                        {option?.description && (
                          <p className="text-xs text-brand-muted">{option.description}</p>
                        )}
                        <button
                          type="button"
                          disabled={busy || !configured || checkoutBlocked}
                          onClick={() => startCheckout(tierKey)}
                          className="w-full py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
                        >
                          {t.settings.billing.subscribe.replace(
                            "{amount}",
                            String(option?.amountUsd ?? pricing?.plan.amountUsd ?? "")
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {pricing?.tier === "base" && (
                    <button
                      type="button"
                      disabled={busy || !pricing?.plans?.premium.stripeConfigured}
                      onClick={upgradeToPremium}
                      className="w-full py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
                    >
                      {t.premium.upgradeButton}
                      {pricing?.plans?.premium
                        ? ` — $${pricing.plans.premium.amountUsd} USD/mes`
                        : ""}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={openPortal}
                    className="w-full py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
                  >
                    {t.settings.billing.manageStripe}
                  </button>
                </>
              )}
            </div>
          )}

          {stripeEnabled && !canManageBilling && user?.role === "podiatrist" && user?.clinicId && (
            <p className="text-sm text-brand-muted">
              {t.settings.billing.clinicManagedByAdmin}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
