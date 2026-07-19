/**
 * Planes Base/Premium: capa de entitlements ortogonal al rol.
 * El rol decide *quién* ve una funcionalidad; el plan decide *si el contrato la incluye*.
 * Los entitlements se derivan por código a partir del tier (no se persisten por-feature).
 */

export type PlanTier = 'base' | 'premium';

export type FeatureKey =
  | 'checkout_analytics'
  | 'agenda_analytics'
  | 'clinical_tools'
  | 'whatsapp_campaigns';

export type Entitlements = Record<FeatureKey, boolean>;

export const TIER_ENTITLEMENTS: Record<PlanTier, Entitlements> = {
  base: {
    checkout_analytics: false,
    agenda_analytics: false,
    clinical_tools: false,
    whatsapp_campaigns: false,
  },
  premium: {
    checkout_analytics: true,
    agenda_analytics: true,
    clinical_tools: true,
    whatsapp_campaigns: true,
  },
};

export function entitlementsForTier(tier: PlanTier): Entitlements {
  return TIER_ENTITLEMENTS[tier];
}

export function isPlanTier(value: unknown): value is PlanTier {
  return value === 'base' || value === 'premium';
}

/** planKey de Stripe/checkout → tier ('clinic_premium_monthly' → premium). */
export function planTierFromPlanKey(planKey: string | null | undefined): PlanTier {
  return planKey?.includes('premium') ? 'premium' : 'base';
}
