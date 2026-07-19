import { and, eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, createdUsers, subscriptions } from '../database/schema';
import { isPlanTier, type PlanTier } from './plan-entitlements';

export type BillingInterval = 'month';

/** Podólogos incluidos por tier del plan clínica; extras a $10/mes c/u. */
export const CLINIC_INCLUDED_PODIATRISTS_BASE = 3;
export const CLINIC_INCLUDED_PODIATRISTS_PREMIUM = 6;
export const BILLING_PRICE_INDEPENDENT_USD = 25;
export const BILLING_PRICE_CLINIC_USD = 100;
export const BILLING_PRICE_INDEPENDENT_PREMIUM_USD = 40;
export const BILLING_PRICE_CLINIC_PREMIUM_USD = 160;
export const BILLING_PRICE_EXTRA_PODIATRIST_USD = 10;

export interface BillingPriceQuote {
  subjectType: 'clinic' | 'user';
  subjectId: string;
  podiatristCount: number;
  podiatristLimit: number;
  billingInterval: BillingInterval;
  stripePriceId: string | null;
  planKey: string;
  tier: PlanTier;
  label: string;
  description: string;
  amountUsd: number;
}

export interface BillingPlanOption {
  tier: PlanTier;
  planKey: string;
  label: string;
  description: string;
  amountUsd: number;
  stripeConfigured: boolean;
}

export interface BillingPricingOverview {
  subjectType: 'clinic' | 'user';
  subjectId: string;
  podiatristCount: number;
  podiatristLimit: number;
  tier: PlanTier;
  plan: {
    planKey: string;
    label: string;
    description: string;
    amountUsd: number;
    stripeConfigured: boolean;
  };
  plans: Record<PlanTier, BillingPlanOption>;
  atPodiatristLimit: boolean;
  overIncludedPodiatrists: boolean;
  /** Asientos: incluidos por el tier actual, extras comprados y precio por extra. */
  includedPodiatrists: number;
  extraPodiatristSeats: number;
  extraSeatPriceUsd: number;
  extraSeatStripeConfigured: boolean;
}

export function getClinicIncludedPodiatrists(tier: PlanTier = 'base'): number {
  const fallback =
    tier === 'premium' ? CLINIC_INCLUDED_PODIATRISTS_PREMIUM : CLINIC_INCLUDED_PODIATRISTS_BASE;
  const envKey =
    tier === 'premium' ? 'CLINIC_INCLUDED_PODIATRISTS_PREMIUM' : 'CLINIC_INCLUDED_PODIATRISTS_BASE';
  const n = parseInt(process.env[envKey] || String(fallback), 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

export interface ClinicPodiatristCapacity {
  tier: PlanTier;
  includedPodiatrists: number;
  extraPodiatristSeats: number;
  /** Override manual (super_admin/legacy); null si el límite se deriva del plan. */
  overrideLimit: number | null;
  /** max(override, incluidos + extra): nunca por debajo de lo ya concedido. */
  effectiveLimit: number;
}

/** Capacidad de podólogos de una clínica según su plan, asientos comprados y override manual. */
export async function getClinicPodiatristCapacity(clinicId: string): Promise<ClinicPodiatristCapacity> {
  const clinicRows = await database
    .select({ podiatristLimit: clinics.podiatristLimit })
    .from(clinics)
    .where(eq(clinics.clinicId, clinicId))
    .limit(1);
  const overrideRaw = clinicRows[0]?.podiatristLimit;
  const overrideLimit = overrideRaw != null && overrideRaw >= 1 ? overrideRaw : null;

  const subRows = await database
    .select({
      planTier: subscriptions.planTier,
      planTierOverride: subscriptions.planTierOverride,
      extraPodiatristSeats: subscriptions.extraPodiatristSeats,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.subjectType, 'clinic'), eq(subscriptions.subjectId, clinicId)))
    .limit(1);
  const sub = subRows[0];
  const tier: PlanTier = isPlanTier(sub?.planTierOverride)
    ? sub.planTierOverride
    : isPlanTier(sub?.planTier)
      ? sub.planTier
      : 'base';
  const includedPodiatrists = getClinicIncludedPodiatrists(tier);
  const extraPodiatristSeats = Math.max(0, sub?.extraPodiatristSeats ?? 0);

  return {
    tier,
    includedPodiatrists,
    extraPodiatristSeats,
    overrideLimit,
    effectiveLimit: Math.max(overrideLimit ?? 0, includedPodiatrists + extraPodiatristSeats),
  };
}

/** Límite efectivo de podólogos para una clínica (incluidos por tier + asientos extra, u override). */
export async function getEffectivePodiatristLimit(clinicId: string): Promise<number> {
  return (await getClinicPodiatristCapacity(clinicId)).effectiveLimit;
}

export async function countActivePodiatristsForClinic(clinicId: string): Promise<number> {
  const rows = await database
    .select()
    .from(createdUsers)
    .where(and(eq(createdUsers.clinicId, clinicId), eq(createdUsers.role, 'podiatrist')));
  return rows.filter((r) => r.isEnabled !== false && !r.isBanned).length;
}

function envPrice(key: string): string | null {
  const v = process.env[key]?.trim();
  return v || null;
}

/** Cuatro productos Stripe: clínica/independiente × base/premium (mensual). */
export function resolveStripePriceId(subjectType: 'clinic' | 'user', tier: PlanTier = 'base'): string | null {
  if (subjectType === 'user') {
    if (tier === 'premium') {
      return envPrice('STRIPE_PRICE_INDEPENDENT_PREMIUM_MONTHLY') || null;
    }
    return (
      envPrice('STRIPE_PRICE_INDEPENDENT_MONTHLY') ||
      envPrice('STRIPE_PRICE_PODIATRIST_MONTHLY') ||
      envPrice('STRIPE_PRICE_ID_MONTHLY') ||
      null
    );
  }
  if (tier === 'premium') {
    return envPrice('STRIPE_PRICE_CLINIC_PREMIUM_MONTHLY') || null;
  }
  return (
    envPrice('STRIPE_PRICE_CLINIC_MONTHLY_STANDARD') ||
    envPrice('STRIPE_PRICE_CLINIC_MONTHLY') ||
    envPrice('STRIPE_PRICE_ID_MONTHLY') ||
    null
  );
}

/** Precio Stripe por podólogo adicional ($10/mes, mismo precio en Base y Premium). */
export function resolveExtraPodiatristPriceId(): string | null {
  return envPrice('STRIPE_PRICE_EXTRA_PODIATRIST_MONTHLY') || null;
}

/** Base mantiene las claves históricas ('clinic_monthly') por compatibilidad. */
function planKey(subjectType: 'clinic' | 'user', tier: PlanTier = 'base'): string {
  if (tier === 'premium') {
    return subjectType === 'clinic' ? 'clinic_premium_monthly' : 'independent_premium_monthly';
  }
  return subjectType === 'clinic' ? 'clinic_monthly' : 'independent_monthly';
}

export function billingAmountUsd(subjectType: 'clinic' | 'user', tier: PlanTier): number {
  if (subjectType === 'clinic') {
    return tier === 'premium' ? BILLING_PRICE_CLINIC_PREMIUM_USD : BILLING_PRICE_CLINIC_USD;
  }
  return tier === 'premium' ? BILLING_PRICE_INDEPENDENT_PREMIUM_USD : BILLING_PRICE_INDEPENDENT_USD;
}

export function buildQuote(opts: {
  subjectType: 'clinic' | 'user';
  subjectId: string;
  podiatristCount: number;
  podiatristLimit: number;
  tier?: PlanTier;
}): BillingPriceQuote {
  const tier = opts.tier ?? 'base';
  const pk = planKey(opts.subjectType, tier);
  const amountUsd = billingAmountUsd(opts.subjectType, tier);
  const tierLabel = tier === 'premium' ? 'Premium' : 'Base';
  const label =
    opts.subjectType === 'clinic'
      ? `Clínica ${tierLabel} — $${amountUsd} USD/mes`
      : `Podólogo independiente ${tierLabel} — $${amountUsd} USD/mes`;
  const baseDescription =
    opts.subjectType === 'clinic'
      ? `${getClinicIncludedPodiatrists(tier)} podólogos incluidos (${opts.podiatristCount} activo(s)). Podólogo adicional: $${BILLING_PRICE_EXTRA_PODIATRIST_USD} USD/mes.`
      : 'Acceso individual a PodoAdmin.';
  const description =
    tier === 'premium'
      ? `${baseDescription} Incluye analíticas de cobros y agenda, herramientas clínicas y campañas de WhatsApp.`
      : baseDescription;

  return {
    subjectType: opts.subjectType,
    subjectId: opts.subjectId,
    podiatristCount: opts.podiatristCount,
    podiatristLimit: opts.podiatristLimit,
    billingInterval: 'month',
    stripePriceId: resolveStripePriceId(opts.subjectType, tier),
    planKey: pk,
    tier,
    label,
    description,
    amountUsd,
  };
}

export async function getBillingPricingOverview(
  subjectType: 'clinic' | 'user',
  subjectId: string,
  currentTier: PlanTier = 'base'
): Promise<BillingPricingOverview> {
  const podiatristCount =
    subjectType === 'clinic' ? await countActivePodiatristsForClinic(subjectId) : 0;
  const capacity = subjectType === 'clinic' ? await getClinicPodiatristCapacity(subjectId) : null;
  const podiatristLimit = capacity?.effectiveLimit ?? 0;

  const quoteFor = (tier: PlanTier) =>
    buildQuote({ subjectType, subjectId, podiatristCount, podiatristLimit, tier });

  const toOption = (tier: PlanTier): BillingPlanOption => {
    const q = quoteFor(tier);
    return {
      tier,
      planKey: q.planKey,
      label: q.label,
      description: q.description,
      amountUsd: q.amountUsd,
      stripeConfigured: Boolean(q.stripePriceId),
    };
  };

  const current = quoteFor(currentTier);

  return {
    subjectType,
    subjectId,
    podiatristCount,
    podiatristLimit,
    tier: currentTier,
    plan: {
      planKey: current.planKey,
      label: current.label,
      description: current.description,
      amountUsd: current.amountUsd,
      stripeConfigured: Boolean(current.stripePriceId),
    },
    plans: {
      base: toOption('base'),
      premium: toOption('premium'),
    },
    atPodiatristLimit: subjectType === 'clinic' && podiatristCount >= podiatristLimit,
    // Solo bloquea el checkout si hacen falta asientos extra y no hay precio Stripe para cobrarlos.
    overIncludedPodiatrists:
      subjectType === 'clinic' &&
      !resolveExtraPodiatristPriceId() &&
      podiatristCount > getClinicIncludedPodiatrists(currentTier),
    includedPodiatrists: capacity?.includedPodiatrists ?? 0,
    extraPodiatristSeats: capacity?.extraPodiatristSeats ?? 0,
    extraSeatPriceUsd: BILLING_PRICE_EXTRA_PODIATRIST_USD,
    extraSeatStripeConfigured: Boolean(resolveExtraPodiatristPriceId()),
  };
}

export function isStripeBillingConfigured(): boolean {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) return false;
  return Boolean(
    resolveStripePriceId('clinic') || resolveStripePriceId('user')
  );
}

/** Clínicas nuevas no llevan override: su límite se deriva del plan (incluidos + asientos extra). */
export function defaultPodiatristLimitForNewClinic(): number | null {
  return null;
}
