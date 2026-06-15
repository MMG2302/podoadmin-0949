import { and, eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, createdUsers } from '../database/schema';

export type BillingInterval = 'month';

/** Podólogos incluidos en el plan clínica estándar ($100/mes). Más allá → super_admin. */
export const CLINIC_INCLUDED_PODIATRISTS_DEFAULT = 8;
export const BILLING_PRICE_INDEPENDENT_USD = 25;
export const BILLING_PRICE_CLINIC_USD = 100;

export interface BillingPriceQuote {
  subjectType: 'clinic' | 'user';
  subjectId: string;
  podiatristCount: number;
  podiatristLimit: number;
  billingInterval: BillingInterval;
  stripePriceId: string | null;
  planKey: string;
  label: string;
  description: string;
  amountUsd: number;
}

export interface BillingPricingOverview {
  subjectType: 'clinic' | 'user';
  subjectId: string;
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

export function getClinicIncludedPodiatrists(): number {
  const n = parseInt(
    process.env.CLINIC_PODIATRIST_LIMIT ||
      process.env.STRIPE_PODIATRIST_TIER_MAX ||
      String(CLINIC_INCLUDED_PODIATRISTS_DEFAULT),
    10
  );
  return Number.isFinite(n) && n >= 1 ? n : CLINIC_INCLUDED_PODIATRISTS_DEFAULT;
}

/** Límite efectivo de podólogos para una clínica (null en DB → plan estándar). */
export async function getEffectivePodiatristLimit(clinicId: string): Promise<number> {
  const rows = await database
    .select({ podiatristLimit: clinics.podiatristLimit })
    .from(clinics)
    .where(eq(clinics.clinicId, clinicId))
    .limit(1);
  const limit = rows[0]?.podiatristLimit;
  if (limit != null && limit >= 1) return limit;
  return getClinicIncludedPodiatrists();
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

/** Dos productos Stripe: clínica mensual e independiente mensual. */
export function resolveStripePriceId(subjectType: 'clinic' | 'user'): string | null {
  if (subjectType === 'user') {
    return (
      envPrice('STRIPE_PRICE_INDEPENDENT_MONTHLY') ||
      envPrice('STRIPE_PRICE_PODIATRIST_MONTHLY') ||
      envPrice('STRIPE_PRICE_ID_MONTHLY') ||
      null
    );
  }
  return (
    envPrice('STRIPE_PRICE_CLINIC_MONTHLY_STANDARD') ||
    envPrice('STRIPE_PRICE_CLINIC_MONTHLY') ||
    envPrice('STRIPE_PRICE_ID_MONTHLY') ||
    null
  );
}

function planKey(subjectType: 'clinic' | 'user'): string {
  return subjectType === 'clinic' ? 'clinic_monthly' : 'independent_monthly';
}

export function buildQuote(opts: {
  subjectType: 'clinic' | 'user';
  subjectId: string;
  podiatristCount: number;
  podiatristLimit: number;
}): BillingPriceQuote {
  const pk = planKey(opts.subjectType);
  const amountUsd =
    opts.subjectType === 'clinic' ? BILLING_PRICE_CLINIC_USD : BILLING_PRICE_INDEPENDENT_USD;
  const label =
    opts.subjectType === 'clinic'
      ? `Clínica — $${BILLING_PRICE_CLINIC_USD} USD/mes`
      : `Podólogo independiente — $${BILLING_PRICE_INDEPENDENT_USD} USD/mes`;
  const description =
    opts.subjectType === 'clinic'
      ? `Hasta ${opts.podiatristLimit} podólogos incluidos (${opts.podiatristCount} activo(s)). Para ampliar, contacta a PodoAdmin.`
      : 'Acceso individual a PodoAdmin.';

  return {
    subjectType: opts.subjectType,
    subjectId: opts.subjectId,
    podiatristCount: opts.podiatristCount,
    podiatristLimit: opts.podiatristLimit,
    billingInterval: 'month',
    stripePriceId: resolveStripePriceId(opts.subjectType),
    planKey: pk,
    label,
    description,
    amountUsd,
  };
}

export async function getBillingPricingOverview(
  subjectType: 'clinic' | 'user',
  subjectId: string
): Promise<BillingPricingOverview> {
  const podiatristCount =
    subjectType === 'clinic' ? await countActivePodiatristsForClinic(subjectId) : 0;
  const podiatristLimit =
    subjectType === 'clinic' ? await getEffectivePodiatristLimit(subjectId) : 0;

  const quote = buildQuote({
    subjectType,
    subjectId,
    podiatristCount,
    podiatristLimit,
  });

  return {
    subjectType,
    subjectId,
    podiatristCount,
    podiatristLimit,
    plan: {
      planKey: quote.planKey,
      label: quote.label,
      description: quote.description,
      amountUsd: quote.amountUsd,
      stripeConfigured: Boolean(quote.stripePriceId),
    },
    atPodiatristLimit: subjectType === 'clinic' && podiatristCount >= podiatristLimit,
    overIncludedPodiatrists:
      subjectType === 'clinic' && podiatristCount > getClinicIncludedPodiatrists(),
  };
}

export function isStripeBillingConfigured(): boolean {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) return false;
  return Boolean(
    resolveStripePriceId('clinic') || resolveStripePriceId('user')
  );
}

/** Valor por defecto al crear una clínica nueva (plan estándar Stripe). */
export function defaultPodiatristLimitForNewClinic(): number {
  return getClinicIncludedPodiatrists();
}
