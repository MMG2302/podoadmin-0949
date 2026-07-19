import { and, eq, inArray } from 'drizzle-orm';

import { database } from '../database';

import { subscriptions, createdUsers, clinics } from '../database/schema';

import type { StripeSubscription } from './stripe-client';
import { allowDevTrialAccess, hasSystemAccess } from './access-control';
import { isPlanTier, planTierFromPlanKey, type PlanTier } from './plan-entitlements';
import { resolveExtraPodiatristPriceId } from './billing-pricing';

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Duración del periodo de prueba por IP (1 mes = 30 días). */
export const TRIAL_PERIOD_MS = MONTH_MS;

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trial';



export interface SubscriptionPublic {

  id: string;

  subjectType: 'clinic' | 'user';

  subjectId: string;

  status: SubscriptionStatus;

  planId: string;

  currentPeriodStart: number;

  currentPeriodEnd: number;

  daysRemaining: number;

  isActive: boolean;

  stripeCustomerId?: string | null;

  stripeSubscriptionId?: string | null;

  hasStripeBilling: boolean;
  billingInterval?: 'month' | 'year' | null;
  podiatristTier?: 'standard' | 'expanded' | null;
  podiatristCountBilled?: number | null;
  extraPodiatristSeats: number;
  planTier: PlanTier;
  planTierOverride: PlanTier | null;
}

/** Tier efectivo: el override manual de super_admin gana sobre el tier facturado. */
export function effectiveTier(sub: Pick<SubscriptionPublic, 'planTier' | 'planTierOverride'>): PlanTier {
  return sub.planTierOverride ?? sub.planTier;
}



function mapRow(row: typeof subscriptions.$inferSelect): SubscriptionPublic {

  const now = Date.now();

  const graceDays = parseInt(process.env.SUBSCRIPTION_GRACE_DAYS || '3', 10);

  const graceMs = graceDays * 24 * 60 * 60 * 1000;

  const effectiveEnd = row.currentPeriodEnd + (row.status === 'past_due' ? graceMs : 0);

  const isActive =

    row.status === 'active' ||

    row.status === 'trial' ||

    (row.status === 'past_due' && now <= effectiveEnd);

  return {

    id: row.id,

    subjectType: row.subjectType as 'clinic' | 'user',

    subjectId: row.subjectId,

    status: row.status as SubscriptionStatus,

    planId: row.planId,

    currentPeriodStart: row.currentPeriodStart,

    currentPeriodEnd: row.currentPeriodEnd,

    daysRemaining: Math.max(0, Math.ceil((row.currentPeriodEnd - now) / (24 * 60 * 60 * 1000))),

    isActive,

    stripeCustomerId: row.stripeCustomerId,

    stripeSubscriptionId: row.stripeSubscriptionId,

    hasStripeBilling: Boolean(row.stripeSubscriptionId),
    billingInterval: (row.billingInterval as 'month' | 'year') || null,
    podiatristTier: (row.podiatristTier as 'standard' | 'expanded') || null,
    podiatristCountBilled: row.podiatristCountBilled ?? null,
    extraPodiatristSeats: Math.max(0, row.extraPodiatristSeats ?? 0),
    planTier: isPlanTier(row.planTier) ? row.planTier : 'base',
    planTierOverride: isPlanTier(row.planTierOverride) ? row.planTierOverride : null,
  };
}



export async function getSubscriptionForUser(userId: string, clinicId?: string | null): Promise<SubscriptionPublic | null> {

  if (clinicId) {

    const rows = await database

      .select()

      .from(subscriptions)

      .where(and(eq(subscriptions.subjectType, 'clinic'), eq(subscriptions.subjectId, clinicId)))

      .limit(1);

    return rows[0] ? mapRow(rows[0]) : null;

  }

  const rows = await database

    .select()

    .from(subscriptions)

    .where(and(eq(subscriptions.subjectType, 'user'), eq(subscriptions.subjectId, userId)))

    .limit(1);

  return rows[0] ? mapRow(rows[0]) : null;

}

/** Precarga suscripciones por clínica y usuario en una sola consulta. */
export async function getSubscriptionsBatch(
  clinicIds: string[],
  userIds: string[]
): Promise<Map<string, SubscriptionPublic>> {
  const map = new Map<string, SubscriptionPublic>();
  const uniqueClinics = [...new Set(clinicIds.filter(Boolean))];
  const uniqueUsers = [...new Set(userIds.filter(Boolean))];

  if (uniqueClinics.length > 0) {
    const rows = await database
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.subjectType, 'clinic'), inArray(subscriptions.subjectId, uniqueClinics)));
    for (const row of rows) {
      map.set(`clinic:${row.subjectId}`, mapRow(row));
    }
  }

  if (uniqueUsers.length > 0) {
    const rows = await database
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.subjectType, 'user'), inArray(subscriptions.subjectId, uniqueUsers)));
    for (const row of rows) {
      map.set(`user:${row.subjectId}`, mapRow(row));
    }
  }

  return map;
}

function lookupSubscriptionFromBatch(
  batch: Map<string, SubscriptionPublic>,
  userId: string,
  clinicId?: string | null
): SubscriptionPublic | null {
  if (clinicId) return batch.get(`clinic:${clinicId}`) ?? null;
  return batch.get(`user:${userId}`) ?? null;
}

export { lookupSubscriptionFromBatch };



/** Quién puede pagar en Stripe y sobre qué entidad se factura. */

export async function resolveBillingSubject(

  userId: string,

  role: string,

  clinicId?: string | null

): Promise<{ subjectType: 'clinic' | 'user'; subjectId: string } | null> {

  if (role === 'receptionist' || role === 'super_admin' || role === 'admin') return null;

  if (role === 'clinic_admin' && clinicId) {

    return { subjectType: 'clinic', subjectId: clinicId };

  }

  if (role === 'podiatrist' && !clinicId) {

    return { subjectType: 'user', subjectId: userId };

  }

  return null;

}



export async function getSubscriptionRowBySubject(

  subjectType: 'clinic' | 'user',

  subjectId: string

): Promise<typeof subscriptions.$inferSelect | null> {

  const rows = await database

    .select()

    .from(subscriptions)

    .where(and(eq(subscriptions.subjectType, subjectType), eq(subscriptions.subjectId, subjectId)))

    .limit(1);

  return rows[0] ?? null;

}



export async function findSubscriptionByStripeId(

  stripeSubscriptionId: string

): Promise<typeof subscriptions.$inferSelect | null> {

  const rows = await database

    .select()

    .from(subscriptions)

    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))

    .limit(1);

  return rows[0] ?? null;

}



function mapStripeStatus(status: string): SubscriptionStatus {

  switch (status) {

    case 'active':

      return 'active';

    case 'trialing':

      return 'trial';

    case 'past_due':

      return 'past_due';

    case 'canceled':

    case 'unpaid':

    case 'incomplete_expired':

      return 'cancelled';

    default:

      return 'past_due';

  }

}



export async function upsertSubscriptionFromStripe(

  subjectType: 'clinic' | 'user',

  subjectId: string,

  stripeSub: StripeSubscription,

  stripeCustomerId: string

): Promise<SubscriptionPublic> {

  const iso = new Date().toISOString();

  const periodStart = stripeSub.current_period_start * 1000;

  const periodEnd = stripeSub.current_period_end * 1000;

  const status = mapStripeStatus(stripeSub.status);
  const meta = stripeSub.metadata || {};
  const billingInterval = (meta.billingInterval as 'month' | 'year') || 'month';
  const podiatristTier = (meta.podiatristTier as 'standard' | 'expanded') || null;
  const podiatristCountBilled = meta.podiatristCount
    ? parseInt(meta.podiatristCount, 10)
    : null;
  const planId =
    meta.planKey ||
    (subjectType === 'clinic' && podiatristTier
      ? `clinic_${billingInterval}_${podiatristTier}`
      : subjectType === 'user'
        ? `user_${billingInterval}_standard`
        : 'monthly_standard');

  const existing = await getSubscriptionRowBySubject(subjectType, subjectId);

  // Tier: derivado del planKey de la metadata; si el evento no lo trae, se preserva
  // el tier existente (nunca degradar en silencio). plan_tier_override no se toca.
  const planTier: PlanTier = meta.planKey
    ? planTierFromPlanKey(meta.planKey)
    : isPlanTier(existing?.planTier)
      ? existing.planTier
      : 'base';

  // Asientos extra: sincronizados desde el ítem Stripe del precio por podólogo adicional.
  // Sin datos de items en el evento → se preserva el valor actual.
  const seatPriceId = resolveExtraPodiatristPriceId();
  const extraSeats: number | null = stripeSub.items
    ? Math.max(
        0,
        (seatPriceId &&
          stripeSub.items.data?.find((it) => it.price?.id === seatPriceId)?.quantity) ||
          0
      )
    : null;

  if (!existing) {
    const id = crypto.randomUUID();
    await database.insert(subscriptions).values({
      id,
      subjectType,
      subjectId,
      status,
      planId,

      currentPeriodStart: periodStart,

      currentPeriodEnd: periodEnd,

      stripeCustomerId,
      stripeSubscriptionId: stripeSub.id,
      billingInterval,
      podiatristTier,
      podiatristCountBilled,
      extraPodiatristSeats: extraSeats ?? 0,
      planTier,
      createdAt: iso,
      updatedAt: iso,
    });
  } else {
    await database
      .update(subscriptions)
      .set({
        status,
        planId,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        stripeCustomerId,
        stripeSubscriptionId: stripeSub.id,
        billingInterval,
        podiatristTier,
        podiatristCountBilled,
        ...(extraSeats != null ? { extraPodiatristSeats: extraSeats } : {}),
        planTier,
        updatedAt: iso,
      })
      .where(eq(subscriptions.id, existing.id));

  }



  const userRows = await database.select().from(createdUsers).where(eq(createdUsers.clinicId, subjectId)).limit(1);

  const uid = subjectType === 'user' ? subjectId : userRows[0]?.userId;

  return (await getSubscriptionForUser(uid || subjectId, subjectType === 'clinic' ? subjectId : null))!;

}



export async function ensureSubscriptionForUser(
  userId: string,
  options?: { clientIp?: string | null; role?: string }
): Promise<SubscriptionPublic> {
  const userRow = await database
    .select()
    .from(createdUsers)
    .where(eq(createdUsers.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  if (!userRow) throw new Error('USER_NOT_FOUND');

  const role = options?.role ?? userRow.role;
  const subjectType = userRow.clinicId ? 'clinic' : 'user';
  const subjectId = userRow.clinicId ?? userId;

  const existing = await getSubscriptionForUser(userId, userRow.clinicId);
  if (existing && existing.status !== 'cancelled') {
    return existing;
  }

  if (options?.clientIp && (role === 'clinic_admin' || role === 'podiatrist')) {
    const { grantIpTrialIfEligible } = await import('./ip-trial-service');
    const trial = await grantIpTrialIfEligible({
      userId,
      role,
      clinicId: userRow.clinicId,
      clientIp: options.clientIp,
    });
    if (trial.subscription) return trial.subscription;
  }

  if (existing) return existing;

  const now = Date.now();
  const id = crypto.randomUUID();
  const iso = new Date().toISOString();
  const useDevTrial = allowDevTrialAccess();

  await database.insert(subscriptions).values({
    id,
    subjectType,
    subjectId,
    status: useDevTrial ? 'trial' : 'cancelled',
    planId: 'monthly_standard',
    currentPeriodStart: now,
    currentPeriodEnd: useDevTrial ? now + TRIAL_PERIOD_MS : now,
    // Trials prueban el producto completo; al pagar, el checkout decide el tier.
    planTier: useDevTrial ? 'premium' : 'base',
    createdAt: iso,
    updatedAt: iso,
  });

  const created = await getSubscriptionForUser(userId, userRow.clinicId);
  return created!;
}



export async function isUserSubscriptionActive(userId: string, role: string): Promise<boolean> {
  return hasSystemAccess(userId, role);
}



export async function renewSubscription(
  subjectType: 'clinic' | 'user',
  subjectId: string,
  months = 1,
  tier?: PlanTier
): Promise<SubscriptionPublic> {

  const rows = await database

    .select()

    .from(subscriptions)

    .where(and(eq(subscriptions.subjectType, subjectType), eq(subscriptions.subjectId, subjectId)))

    .limit(1);

  const now = Date.now();

  const iso = new Date().toISOString();

  const periodEnd = now + months * MONTH_MS;



  if (!rows[0]) {

    const id = crypto.randomUUID();

    await database.insert(subscriptions).values({

      id,

      subjectType,

      subjectId,

      status: 'active',

      planId: 'monthly_standard',

      currentPeriodStart: now,

      currentPeriodEnd: periodEnd,

      planTier: tier ?? 'base',

      createdAt: iso,

      updatedAt: iso,

    });

  } else {

    await database

      .update(subscriptions)

      .set({

        status: 'active',

        currentPeriodStart: now,

        currentPeriodEnd: periodEnd,

        ...(tier ? { planTier: tier } : {}),

        updatedAt: iso,

      })

      .where(eq(subscriptions.id, rows[0].id));

  }



  const userRows = await database.select().from(createdUsers).where(eq(createdUsers.clinicId, subjectId)).limit(1);

  if (subjectType === 'clinic') {

    await database.select().from(clinics).where(eq(clinics.clinicId, subjectId)).limit(1);

  }

  const uid = subjectType === 'user' ? subjectId : userRows[0]?.userId;

  return (await getSubscriptionForUser(uid || subjectId, subjectType === 'clinic' ? subjectId : null))!;

}



/** Persiste los asientos extra de podólogo (tras confirmar el cambio en Stripe). */
export async function setExtraPodiatristSeats(
  subjectType: 'clinic' | 'user',
  subjectId: string,
  seats: number
): Promise<boolean> {
  const row = await getSubscriptionRowBySubject(subjectType, subjectId);
  if (!row) return false;
  await database
    .update(subscriptions)
    .set({ extraPodiatristSeats: Math.max(0, Math.floor(seats)), updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.id, row.id));
  return true;
}

/** Actualiza el tier facturado (tras upgrade/downgrade confirmado en Stripe). */
export async function setPlanTier(
  subjectType: 'clinic' | 'user',
  subjectId: string,
  tier: PlanTier
): Promise<boolean> {
  const row = await getSubscriptionRowBySubject(subjectType, subjectId);
  if (!row) return false;
  await database
    .update(subscriptions)
    .set({ planTier: tier, updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.id, row.id));
  return true;
}

/** Override manual de super_admin (null = volver al tier facturado). */
export async function setPlanTierOverride(
  subjectType: 'clinic' | 'user',
  subjectId: string,
  tierOverride: PlanTier | null
): Promise<boolean> {
  const row = await getSubscriptionRowBySubject(subjectType, subjectId);
  if (!row) return false;
  await database
    .update(subscriptions)
    .set({ planTierOverride: tierOverride, updatedAt: new Date().toISOString() })
    .where(eq(subscriptions.id, row.id));
  return true;
}

export async function setStripeCustomerOnSubject(

  subjectType: 'clinic' | 'user',

  subjectId: string,

  stripeCustomerId: string

): Promise<void> {

  const row = await getSubscriptionRowBySubject(subjectType, subjectId);

  const iso = new Date().toISOString();

  if (!row) {

    const now = Date.now();

    await database.insert(subscriptions).values({

      id: crypto.randomUUID(),

      subjectType,

      subjectId,

      status: 'trial',

      planId: 'monthly_standard',

      currentPeriodStart: now,

      currentPeriodEnd: now + MONTH_MS,

      planTier: 'premium',

      stripeCustomerId,

      createdAt: iso,

      updatedAt: iso,

    });

    return;

  }

  await database

    .update(subscriptions)

    .set({ stripeCustomerId, updatedAt: iso })

    .where(eq(subscriptions.id, row.id));

}


