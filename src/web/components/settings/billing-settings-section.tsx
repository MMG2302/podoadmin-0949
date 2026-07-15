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

interface PricingOverview {
  subjectType: "clinic" | "user";
  podiatristCount: number;
  podiatristLimit: number;
  plan: {
    planKey: string;
    label: string;
    description: string;
    amountUsd: number;
    stripeConfigured: boolean;
  };
  atPodiatristLimit: boolean;
  overIncludedPodiatrists: boolean;
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
      trialEligibility?: TrialEligibility;
      trialVerification?: TrialVerification;
    }>("/subscriptions/me");
    if (me.success && me.data) {
      setSubscription(me.data.subscription ?? null);
      setStripeEnabled(Boolean(me.data.stripeEnabled));
      setCanManageBilling(Boolean(me.data.canManageBilling));
      if (me.data.pricing) setPricing(me.data.pricing);
      if (me.data.trialEligibility) setTrialEligibility(me.data.trialEligibility);
      else setTrialEligibility(null);
      if (me.data.trialVerification) setTrialVerification(me.data.trialVerification);
      else setTrialVerification(null);
      if (typeof me.data.systemAccess === "boolean") {
        updateUser({ systemAccess: me.data.systemAccess });
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

  const startCheckout = async () => {
    setBusy(true);
    setMessage("");
    const res = await api.post<{ url?: string; message?: string }>("/subscriptions/stripe/checkout");
    setBusy(false);
    if (res.success && res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    setMessage(res.message || res.error || t.settings.billing.checkoutError);
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
            <p className="text-base sm:text-lg font-semibold text-brand-ink">
              {pricing?.plan.label ??
                (pricing?.subjectType === "clinic" ? t.settings.billing.clinicPlan : t.settings.billing.independentPlan)}
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
                <button
                  type="button"
                  disabled={busy || !pricing?.plan.stripeConfigured || checkoutBlocked}
                  onClick={startCheckout}
                  className="w-full py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
                >
                  {t.settings.billing.subscribe.replace("{amount}", String(pricing?.plan.amountUsd ?? ""))}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={openPortal}
                  className="w-full py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50 min-h-[44px]"
                >
                  {t.settings.billing.manageStripe}
                </button>
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
