import { useAuth } from "../contexts/auth-context";

export type FeatureKey =
  | "checkout_analytics"
  | "agenda_analytics"
  | "clinical_tools"
  | "whatsapp_campaigns";

export type PlanTier = "base" | "premium";

/**
 * Plan contratado (Base/Premium), ortogonal al rol.
 * El servidor calcula los entitlements; aquí solo se consumen.
 * Fallback sin datos (sesiones cacheadas previas al deploy): base, salvo
 * grant manual (platform_admin / admin_enabled) que siempre es premium.
 */
export function useEntitlements() {
  const { user } = useAuth();

  const grantedManually =
    user?.accessReason === "platform_admin" || user?.accessReason === "admin_enabled";

  const planTier: PlanTier =
    user?.planTier ?? (grantedManually ? "premium" : "base");

  const has = (feature: FeatureKey): boolean => {
    if (user?.entitlements) return user.entitlements[feature] === true;
    return planTier === "premium";
  };

  return {
    planTier,
    isPremium: planTier === "premium",
    has,
  };
}
