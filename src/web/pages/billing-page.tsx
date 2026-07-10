import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { api } from "../lib/api-client";

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

const BillingPage = () => {
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
    if (success === "1") setMessage("Pago recibido. La suscripción se activará en unos segundos.");
    if (cancelled === "1") setMessage("Pago cancelado. Puedes intentarlo de nuevo cuando quieras.");
  }, [success, cancelled]);

  useEffect(() => {
    const completeCard = async () => {
      if (trialCard !== "success" || !trialCardSessionId) return;
      setBusy(true);
      const res = await api.post("/trial/card/complete", { sessionId: trialCardSessionId });
      setBusy(false);
      if (res.success) {
        setMessage("Tarjeta verificada correctamente.");
        load();
        setLocation("/billing");
      } else {
        setMessage(res.message || res.error || "Error al verificar la tarjeta.");
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
        setMessage("Tarjeta mock verificada (solo desarrollo).");
        load();
        setLocation("/billing");
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
    setMessage(res.message || res.error || "No se pudo iniciar verificación de tarjeta.");
  };

  const activateTrial = async () => {
    setBusy(true);
    setMessage("");
    const res = await api.post<{ systemAccess?: boolean; message?: string }>("/trial/activate");
    setBusy(false);
    if (res.success) {
      setMessage(res.data?.message || "Periodo de prueba activado.");
      if (typeof res.data?.systemAccess === "boolean") {
        updateUser({ systemAccess: res.data.systemAccess });
      }
      load();
    } else {
      setMessage(res.message || res.error || "No se pudo activar la prueba.");
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
    setMessage(res.message || res.error || "No se pudo iniciar el pago.");
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
    setMessage(res.message || res.error || "No se pudo abrir el portal de facturación.");
  };

  if (isSuperAdmin || isAdmin) {
    return (
      <MainLayout title="Facturación">
        <p className="text-gray-600">Los administradores de plataforma no requieren suscripción.</p>
      </MainLayout>
    );
  }

  if (isReceptionist) {
    return (
      <MainLayout title="Facturación">
        <p className="text-gray-600">
          La suscripción de la clínica la gestiona el administrador de la clínica.
        </p>
      </MainLayout>
    );
  }

  const statusLabel: Record<string, string> = {
    active: "Activa",
    trial: "Periodo de prueba",
    past_due: "Pago pendiente",
    cancelled: "Cancelada",
  };

  const checkoutBlocked = pricing?.overIncludedPodiatrists && pricing.subjectType === "clinic";

  return (
    <MainLayout title="Facturación y suscripción">
      <div className="max-w-lg mx-auto space-y-6">
        {message && (
          <div className="p-3 rounded-lg bg-blue-50 text-blue-900 text-sm">{message}</div>
        )}

        {trialEligibility && !trialEligibility.eligible && trialEligibility.message && !subscription?.hasStripeBilling && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            {trialEligibility.message}
          </div>
        )}

        {trialEligibility?.eligible &&
          !subscription?.hasStripeBilling &&
          !(subscription?.status === "trial" && subscription.isActive) &&
          trialVerification && (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4 text-sm">
              <p className="font-semibold text-brand-ink">Activar prueba gratuita (1 mes)</p>
              <p className="text-gray-600">
                Verifica tu correo y tarjeta. Una cuenta, una tarjeta y una conexión (IP) solo pueden
                usarse una vez para la prueba.
              </p>

              <div className="space-y-2">
                <p className="font-medium">
                  1. Correo verificado {trialVerification.emailVerified ? "✓" : ""}
                </p>
                {!trialVerification.emailVerified && trialVerification.emailRequired && (
                  <p className="text-gray-600 text-xs">
                    Revisa tu bandeja de entrada
                    {trialVerification.email ? ` (${trialVerification.email})` : ""} y confirma el enlace
                    de verificación. Si no lo recibiste, cierra sesión y vuelve a solicitarlo al
                    registrarte.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-medium">
                  2. Tarjeta {trialVerification.cardVerified ? "✓" : ""}
                </p>
                {!trialVerification.cardVerified && trialVerification.cardRequired && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={startCardSetup}
                    className="w-full py-2 bg-brand-ink text-brand-ink-fg rounded-lg"
                  >
                    Verificar tarjeta (sin cobro hoy)
                  </button>
                )}
              </div>

              {trialVerification.ready && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={activateTrial}
                  className="w-full py-2.5 bg-emerald-700 text-white rounded-lg font-medium"
                >
                  Activar prueba de 1 mes
                </button>
              )}
            </div>
          )}

        {trialEligibility?.eligible && subscription?.status === "trial" && subscription.isActive && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
            Periodo de prueba de 1 mes activo. Disfruta del acceso completo hasta{" "}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
          </div>
        )}

        {checkoutBlocked && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            Tu clínica tiene <strong>{pricing?.podiatristCount}</strong> podólogos activos, por encima
            del plan en línea (hasta {pricing?.podiatristLimit}). Contacta a PodoAdmin para ampliar tu
            capacidad y la facturación.
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Cargando…</p>
        ) : (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Suscripción PodoAdmin</p>
              <p className="text-lg font-semibold text-brand-ink">
                {pricing?.plan.label ??
                  (pricing?.subjectType === "clinic" ? "Plan clínica" : "Plan podólogo independiente")}
              </p>
              {pricing?.plan.description && (
                <p className="text-xs text-gray-500 mt-1">{pricing.plan.description}</p>
              )}
            </div>

            {pricing?.subjectType === "clinic" && (
              <div className="text-sm bg-brand-canvas rounded-lg p-3 space-y-1">
                <p>
                  <span className="text-gray-500">Podólogos activos:</span>{" "}
                  <strong>
                    {pricing.podiatristCount} / {pricing.podiatristLimit}
                  </strong>
                </p>
              </div>
            )}

            {subscription && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estado</span>
                  <span
                    className={`font-medium ${
                      subscription.isActive ? "text-green-700" : "text-amber-700"
                    }`}
                  >
                    {statusLabel[subscription.status] || subscription.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fin del periodo</span>
                  <span>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              </>
            )}

            {!stripeEnabled && (
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                Stripe no está configurado. Define STRIPE_PRICE_CLINIC_MONTHLY_STANDARD y
                STRIPE_PRICE_INDEPENDENT_MONTHLY en el servidor.
              </p>
            )}

            {stripeEnabled && canManageBilling && (
              <div className="flex flex-col gap-2 pt-2">
                {!subscription?.hasStripeBilling ? (
                  <button
                    type="button"
                    disabled={busy || !pricing?.plan.stripeConfigured || checkoutBlocked}
                    onClick={startCheckout}
                    className="w-full py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {`Suscribirse — $${pricing?.plan.amountUsd ?? ""} USD/mes`}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={openPortal}
                    className="w-full py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Gestionar facturación en Stripe
                  </button>
                )}
              </div>
            )}

            {stripeEnabled && !canManageBilling && user?.role === "podiatrist" && user?.clinicId && (
              <p className="text-sm text-gray-600">
                La suscripción de tu clínica la gestiona el administrador de la clínica.
              </p>
            )}

            <button
              type="button"
              className="text-sm text-gray-500 underline"
              onClick={() => setLocation("/")}
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BillingPage;
