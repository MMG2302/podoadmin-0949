import { Hono } from 'hono';

import { z } from 'zod';

import { requireAuth } from '../middleware/auth';

import { requireRole } from '../middleware/authorization';

import {

  effectiveTier,

  ensureSubscriptionForUser,

  getSubscriptionForUser,

  renewSubscription,

  resolveBillingSubject,

  getSubscriptionRowBySubject,

  setExtraPodiatristSeats,

  setPlanTier,

  setPlanTierOverride,

} from '../utils/subscription-service';

import { resolveSystemAccess } from '../utils/access-control';

import { invalidateBillingSubjectAccessCache } from '../utils/access-cache';

import { entitlementsForTier, isPlanTier } from '../utils/plan-entitlements';

import { getClientIP } from '../utils/ip-tracking';

import { checkIpTrialEligibility } from '../utils/ip-trial-service';

import { getTrialVerificationStatus } from '../utils/trial-card';

import { getUserByIdFromDB } from '../utils/user-db';

import {

  createBillingPortalSession,

  createCheckoutSession,

  getAppBaseUrl,

  isStripeConfigured,

  getStripePublishableKey,

  retrieveSubscription,

  setSubscriptionSeatQuantity,

  updateSubscriptionPrice,

} from '../utils/stripe-client';

import {

  BILLING_PRICE_EXTRA_PODIATRIST_USD,

  buildQuote,

  countActivePodiatristsForClinic,

  getBillingPricingOverview,

  getClinicPodiatristCapacity,

  getEffectivePodiatristLimit,

  getClinicIncludedPodiatrists,

  resolveExtraPodiatristPriceId,

  resolveStripePriceId,

} from '../utils/billing-pricing';



const subscriptionsRoutes = new Hono();

subscriptionsRoutes.use('*', requireAuth);



subscriptionsRoutes.get('/me', async (c) => {

  const user = c.get('user')!;

  const clientIp = getClientIP(c.req.raw.headers);



  if (user.role === 'super_admin') {

    return c.json({

      success: true,

      subscription: null,

      platformAccess: true,

      systemAccess: true,

      planTier: 'premium',

      entitlements: entitlementsForTier('premium'),

      stripeEnabled: isStripeConfigured(),

      canManageBilling: false,

    });

  }



  if (user.role === 'admin' || user.role === 'receptionist') {

    const access = await resolveSystemAccess(user.userId, user.role);

    return c.json({

      success: true,

      subscription: null,

      platformAccess: access.granted,

      systemAccess: access.granted,

      planTier: access.planTier,

      entitlements: access.entitlements,

      stripeEnabled: isStripeConfigured(),

      canManageBilling: false,

    });

  }



  const row = await getUserByIdFromDB(user.userId);

  let sub = await getSubscriptionForUser(user.userId, row?.clinicId);

  if (!sub) {

    sub = await ensureSubscriptionForUser(user.userId, {

      clientIp,

      role: user.role,

    });

  } else if (sub.status === 'cancelled') {

    sub = await ensureSubscriptionForUser(user.userId, {

      clientIp,

      role: user.role,

    });

  }

  const access = await resolveSystemAccess(user.userId, user.role);

  const trialEligibility = await checkIpTrialEligibility(clientIp, user.role);

  const trialVerification = await getTrialVerificationStatus(user.userId);

  const billing = await resolveBillingSubject(user.userId, user.role, row?.clinicId ?? user.clinicId);

  const currentTier = access.granted ? access.planTier : effectiveTier(sub);

  const pricing =
    billing && (await getBillingPricingOverview(billing.subjectType, billing.subjectId, currentTier));

  return c.json({

    success: true,

    subscription: sub,

    platformAccess: access.granted,

    systemAccess: access.granted,

    planTier: access.planTier,

    entitlements: access.entitlements,

    stripeEnabled: isStripeConfigured(),

    canManageBilling: Boolean(billing),

    billingSubject: billing,

    pricing,

    trialEligibility,

    trialVerification,

  });

});



subscriptionsRoutes.get('/pricing', async (c) => {

  const user = c.get('user')!;

  const row = await getUserByIdFromDB(user.userId);

  const billing = await resolveBillingSubject(user.userId, user.role, row?.clinicId ?? user.clinicId);

  if (!billing) {

    return c.json({ error: 'billing_not_allowed' }, 403);

  }

  const pricing = await getBillingPricingOverview(billing.subjectType, billing.subjectId);

  return c.json({ success: true, pricing });

});



subscriptionsRoutes.get('/stripe/config', async (c) => {

  return c.json({

    success: true,

    enabled: isStripeConfigured(),

    publishableKey: getStripePublishableKey(),

  });

});



subscriptionsRoutes.post('/stripe/checkout', async (c) => {

  const user = c.get('user')!;

  if (!isStripeConfigured()) {

    return c.json({ error: 'stripe_not_configured', message: 'Stripe no está configurado en el servidor.' }, 503);

  }

  const rawBody = await c.req.json().catch(() => ({}));

  const bodyParsed = z.object({ tier: z.enum(['base', 'premium']).default('base') }).safeParse(rawBody);

  const tier = bodyParsed.success ? bodyParsed.data.tier : 'base';



  const row = await getUserByIdFromDB(user.userId);

  const billing = await resolveBillingSubject(user.userId, user.role, row?.clinicId ?? user.clinicId);

  if (!billing) {

    return c.json(

      {

        error: 'billing_not_allowed',

        message: 'Tu rol no puede gestionar el pago. El administrador de la clínica debe suscribirse.',

      },

      403

    );

  }



  const podiatristCount =

    billing.subjectType === 'clinic'

      ? await countActivePodiatristsForClinic(billing.subjectId)

      : 0;

  const podiatristLimit =

    billing.subjectType === 'clinic'

      ? await getEffectivePodiatristLimit(billing.subjectId)

      : 0;



  // Si la clínica ya supera los incluidos del tier, el checkout añade los asientos
  // extra necesarios ($10/mes c/u) como segunda línea de la suscripción.
  const includedForTier = getClinicIncludedPodiatrists(tier);

  const neededExtraSeats =

    billing.subjectType === 'clinic' ? Math.max(0, podiatristCount - includedForTier) : 0;

  const extraSeatPriceId = resolveExtraPodiatristPriceId();

  if (neededExtraSeats > 0 && !extraSeatPriceId) {

    return c.json(

      {

        error: 'clinic_over_included_limit',

        message: `Tu clínica tiene ${podiatristCount} podólogos activos y el plan incluye ${includedForTier}. No hay precio Stripe configurado para podólogos adicionales (STRIPE_PRICE_EXTRA_PODIATRIST_MONTHLY). Contacta a PodoAdmin.`,

        podiatristCount,

        includedLimit: includedForTier,

      },

      403

    );

  }



  const quote = buildQuote({

    subjectType: billing.subjectType,

    subjectId: billing.subjectId,

    podiatristCount,

    podiatristLimit,

    tier,

  });



  if (!quote.stripePriceId) {

    const envHint =
      tier === 'premium'
        ? 'STRIPE_PRICE_CLINIC_PREMIUM_MONTHLY y STRIPE_PRICE_INDEPENDENT_PREMIUM_MONTHLY'
        : 'STRIPE_PRICE_CLINIC_MONTHLY_STANDARD y STRIPE_PRICE_INDEPENDENT_MONTHLY';

    return c.json(

      {

        error: 'price_not_configured',

        message: `No hay precio Stripe configurado para: ${quote.planKey}. Revisa ${envHint}.`,

      },

      503

    );

  }



  const base = getAppBaseUrl();

  const subRow = await getSubscriptionRowBySubject(billing.subjectType, billing.subjectId);

  const session = await createCheckoutSession({

    customerId: subRow?.stripeCustomerId,

    customerEmail: user.email,

    priceId: quote.stripePriceId,

    successUrl: `${base}/settings?tab=billing&success=1`,

    cancelUrl: `${base}/settings?tab=billing&cancelled=1`,

    extraLineItem:

      neededExtraSeats > 0 && extraSeatPriceId

        ? { priceId: extraSeatPriceId, quantity: neededExtraSeats }

        : null,

    metadata: {

      subjectType: billing.subjectType,

      subjectId: billing.subjectId,

      userId: user.userId,

      billingInterval: 'month',

      podiatristCount: String(quote.podiatristCount),

      extraSeats: String(neededExtraSeats),

      planKey: quote.planKey,

    },

  });



  if (!session.url) {

    return c.json({ error: 'checkout_failed', message: 'No se pudo crear la sesión de pago.' }, 500);

  }



  return c.json({

    success: true,

    url: session.url,

    quote: {

      label: quote.label,

      description: quote.description,

      planKey: quote.planKey,

      amountUsd: quote.amountUsd,

      podiatristCount: quote.podiatristCount,

      extraSeats: neededExtraSeats,

      extraSeatPriceUsd: BILLING_PRICE_EXTRA_PODIATRIST_USD,

      totalUsd: quote.amountUsd + neededExtraSeats * BILLING_PRICE_EXTRA_PODIATRIST_USD,

    },

  });

});



/**
 * Ajusta los podólogos adicionales ($10 USD/mes c/u) de una suscripción Stripe activa.
 * body.seats = total de asientos extra deseado (no delta). Prorrateo automático.
 */
subscriptionsRoutes.post('/stripe/seats', async (c) => {

  const user = c.get('user')!;

  if (!isStripeConfigured()) {

    return c.json({ error: 'stripe_not_configured' }, 503);

  }

  const raw = await c.req.json().catch(() => ({}));

  const parsed = z.object({ seats: z.number().int().min(0).max(200) }).safeParse(raw);

  if (!parsed.success) {

    return c.json({ error: 'Datos inválidos', issues: parsed.error.flatten() }, 400);

  }

  const seats = parsed.data.seats;

  const row = await getUserByIdFromDB(user.userId);

  const billing = await resolveBillingSubject(user.userId, user.role, row?.clinicId ?? user.clinicId);

  if (!billing || billing.subjectType !== 'clinic') {

    return c.json(

      { error: 'billing_not_allowed', message: 'Solo el administrador de una clínica puede gestionar podólogos adicionales.' },

      403

    );

  }

  const extraSeatPriceId = resolveExtraPodiatristPriceId();

  if (!extraSeatPriceId) {

    return c.json(

      {

        error: 'price_not_configured',

        message: 'No hay precio Stripe configurado para podólogos adicionales (STRIPE_PRICE_EXTRA_PODIATRIST_MONTHLY).',

      },

      503

    );

  }

  const subRow = await getSubscriptionRowBySubject('clinic', billing.subjectId);

  if (!subRow?.stripeSubscriptionId) {

    return c.json(

      { error: 'no_stripe_subscription', message: 'Activa primero tu suscripción para agregar podólogos adicionales.' },

      400

    );

  }

  // No permitir reducir por debajo de los podólogos ya activos.
  const capacity = await getClinicPodiatristCapacity(billing.subjectId);

  const activeCount = await countActivePodiatristsForClinic(billing.subjectId);

  const maxAllowed = Math.max(capacity.overrideLimit ?? 0, capacity.includedPodiatrists + seats);

  if (activeCount > maxAllowed) {

    return c.json(

      {

        error: 'seats_below_usage',

        message: `Tu clínica tiene ${activeCount} podólogos activos. Necesitas al menos ${activeCount - capacity.includedPodiatrists} asiento(s) adicional(es), o desactiva podólogos antes de reducir.`,

        activeCount,

        includedPodiatrists: capacity.includedPodiatrists,

      },

      400

    );

  }

  const stripeSub = await retrieveSubscription(subRow.stripeSubscriptionId);

  const seatItem = stripeSub.items?.data?.find((it) => it.price?.id === extraSeatPriceId) ?? null;

  await setSubscriptionSeatQuantity(subRow.stripeSubscriptionId, {

    existingItemId: seatItem?.id ?? null,

    priceId: extraSeatPriceId,

    quantity: seats,

  });

  await setExtraPodiatristSeats('clinic', billing.subjectId, seats);

  await invalidateBillingSubjectAccessCache('clinic', billing.subjectId);

  const currentTier = capacity.tier;

  const pricing = await getBillingPricingOverview('clinic', billing.subjectId, currentTier);

  return c.json({ success: true, extraPodiatristSeats: seats, pricing });

});



subscriptionsRoutes.post('/stripe/portal', async (c) => {

  const user = c.get('user')!;

  if (!isStripeConfigured()) {

    return c.json({ error: 'stripe_not_configured' }, 503);

  }

  const row = await getUserByIdFromDB(user.userId);

  const billing = await resolveBillingSubject(user.userId, user.role, row?.clinicId ?? user.clinicId);

  if (!billing) {

    return c.json({ error: 'billing_not_allowed' }, 403);

  }

  const subRow = await getSubscriptionRowBySubject(billing.subjectType, billing.subjectId);

  if (!subRow?.stripeCustomerId) {

    return c.json(

      { error: 'no_stripe_customer', message: 'Aún no hay suscripción de pago. Usa «Suscribirse» primero.' },

      400

    );

  }

  const portal = await createBillingPortalSession(subRow.stripeCustomerId, `${getAppBaseUrl()}/settings?tab=billing`);

  return c.json({ success: true, url: portal.url });

});



// Cambio de plan (Base ↔ Premium) para una suscripción Stripe ya activa, con prorrateo.
subscriptionsRoutes.post('/stripe/upgrade', async (c) => {

  const user = c.get('user')!;

  if (!isStripeConfigured()) {

    return c.json({ error: 'stripe_not_configured' }, 503);

  }

  const raw = await c.req.json().catch(() => ({}));

  const parsed = z.object({ tier: z.enum(['base', 'premium']) }).safeParse(raw);

  if (!parsed.success) {

    return c.json({ error: 'Datos inválidos', issues: parsed.error.flatten() }, 400);

  }

  const tier = parsed.data.tier;

  const row = await getUserByIdFromDB(user.userId);

  const billing = await resolveBillingSubject(user.userId, user.role, row?.clinicId ?? user.clinicId);

  if (!billing) {

    return c.json({ error: 'billing_not_allowed' }, 403);

  }

  const subRow = await getSubscriptionRowBySubject(billing.subjectType, billing.subjectId);

  if (!subRow?.stripeSubscriptionId) {

    return c.json(

      { error: 'no_stripe_subscription', message: 'Aún no hay suscripción de pago. Usa «Suscribirse» primero.' },

      400

    );

  }

  const newPriceId = resolveStripePriceId(billing.subjectType, tier);

  if (!newPriceId) {

    return c.json(

      {

        error: 'price_not_configured',

        message: `No hay precio Stripe configurado para el plan ${tier === 'premium' ? 'Premium' : 'Base'}.`,

      },

      503

    );

  }

  const stripeSub = await retrieveSubscription(subRow.stripeSubscriptionId);

  // El ítem del plan es el que NO corresponde al precio por asiento adicional.
  const seatPriceIdForUpgrade = resolveExtraPodiatristPriceId();

  const planItem =

    stripeSub.items?.data?.find((it) => !seatPriceIdForUpgrade || it.price?.id !== seatPriceIdForUpgrade) ??

    stripeSub.items?.data?.[0];

  const itemId = planItem?.id;

  if (!itemId) {

    return c.json({ error: 'stripe_subscription_invalid', message: 'La suscripción de Stripe no tiene ítems.' }, 500);

  }

  const podiatristCount =

    billing.subjectType === 'clinic' ? await countActivePodiatristsForClinic(billing.subjectId) : 0;

  const podiatristLimit =

    billing.subjectType === 'clinic' ? await getEffectivePodiatristLimit(billing.subjectId) : 0;

  // Al bajar a Base los incluidos se reducen (6 → 3): no permitir si dejaría
  // a la clínica por encima de su capacidad (incluidos + asientos extra / override).
  if (tier === 'base' && billing.subjectType === 'clinic') {

    const capacity = await getClinicPodiatristCapacity(billing.subjectId);

    const allowedAfter = Math.max(

      capacity.overrideLimit ?? 0,

      getClinicIncludedPodiatrists('base') + capacity.extraPodiatristSeats

    );

    if (podiatristCount > allowedAfter) {

      return c.json(

        {

          error: 'seats_below_usage',

          message: `Con el plan Base tu clínica quedaría con capacidad para ${allowedAfter} podólogos y tienes ${podiatristCount} activos. Agrega asientos adicionales o desactiva podólogos antes de bajar de plan.`,

        },

        400

      );

    }

  }

  const quote = buildQuote({

    subjectType: billing.subjectType,

    subjectId: billing.subjectId,

    podiatristCount,

    podiatristLimit,

    tier,

  });

  await updateSubscriptionPrice(subRow.stripeSubscriptionId, itemId, newPriceId, {

    planKey: quote.planKey,

    billingInterval: 'month',

    subjectType: billing.subjectType,

    subjectId: billing.subjectId,

  });

  await setPlanTier(billing.subjectType, billing.subjectId, tier);

  await invalidateBillingSubjectAccessCache(billing.subjectType, billing.subjectId);

  const sub = await getSubscriptionForUser(user.userId, row?.clinicId ?? null);

  return c.json({ success: true, subscription: sub, tier, planKey: quote.planKey });

});



const renewSchema = z.object({

  subjectType: z.enum(['clinic', 'user']),

  subjectId: z.string().min(1).max(128),

  months: z.number().int().min(1).max(24).optional(),

  tier: z.enum(['base', 'premium']).optional(),

});



subscriptionsRoutes.post('/renew', requireRole('super_admin', 'admin'), async (c) => {

  const raw = await c.req.json().catch(() => ({}));

  const parsed = renewSchema.safeParse(raw);

  if (!parsed.success) {

    return c.json({ error: 'Datos inválidos', issues: parsed.error.flatten() }, 400);

  }

  const sub = await renewSubscription(

    parsed.data.subjectType,

    parsed.data.subjectId,

    parsed.data.months ?? 1,

    parsed.data.tier

  );

  await invalidateBillingSubjectAccessCache(parsed.data.subjectType, parsed.data.subjectId);

  return c.json({ success: true, subscription: sub });

});



// Consulta de suscripción por sujeto (panel super_admin).
subscriptionsRoutes.get('/subject/:subjectType/:subjectId', requireRole('super_admin'), async (c) => {

  const subjectType = c.req.param('subjectType');

  const subjectId = c.req.param('subjectId');

  if (subjectType !== 'clinic' && subjectType !== 'user') {

    return c.json({ error: 'Datos inválidos' }, 400);

  }

  const row = await getSubscriptionRowBySubject(subjectType, subjectId);

  if (!row) {

    return c.json({ success: true, subscription: null });

  }

  const sub = await getSubscriptionForUser(subjectId, subjectType === 'clinic' ? subjectId : null);

  return c.json({

    success: true,

    subscription: sub,

    effectiveTier: sub ? effectiveTier(sub) : null,

  });

});



// Override manual del plan por super_admin (null = volver al tier facturado).
const setTierSchema = z.object({

  subjectType: z.enum(['clinic', 'user']),

  subjectId: z.string().min(1).max(128),

  tierOverride: z.enum(['base', 'premium']).nullable(),

});



subscriptionsRoutes.post('/set-tier', requireRole('super_admin'), async (c) => {

  const raw = await c.req.json().catch(() => ({}));

  const parsed = setTierSchema.safeParse(raw);

  if (!parsed.success) {

    return c.json({ error: 'Datos inválidos', issues: parsed.error.flatten() }, 400);

  }

  const { subjectType, subjectId, tierOverride } = parsed.data;

  const updated = await setPlanTierOverride(subjectType, subjectId, tierOverride);

  if (!updated) {

    return c.json(

      {

        error: 'no_subscription',

        message: 'El sujeto no tiene suscripción. Usa /subscriptions/renew con tier para crearla.',

      },

      404

    );

  }

  await invalidateBillingSubjectAccessCache(subjectType, subjectId);

  const sub = await getSubscriptionForUser(subjectId, subjectType === 'clinic' ? subjectId : null);

  return c.json({ success: true, subscription: sub, effectiveTier: sub ? effectiveTier(sub) : null });

});



export default subscriptionsRoutes;

