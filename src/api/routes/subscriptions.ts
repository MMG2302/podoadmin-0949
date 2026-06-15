import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import {
  ensureSubscriptionForUser,
  getSubscriptionForUser,
  renewSubscription,
  resolveBillingSubject,
  getSubscriptionRowBySubject,
} from '../utils/subscription-service';
import { hasSystemAccess } from '../utils/access-control';
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
} from '../utils/stripe-client';
import {
  buildQuote,
  countActivePodiatristsForClinic,
  getBillingPricingOverview,
  getEffectivePodiatristLimit,
  getClinicIncludedPodiatrists,
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
      stripeEnabled: isStripeConfigured(),
      canManageBilling: false,
    });
  }

  if (user.role === 'admin' || user.role === 'receptionist') {
    const systemAccess = await hasSystemAccess(user.userId, user.role);
    return c.json({
      success: true,
      subscription: null,
      platformAccess: systemAccess,
      systemAccess,
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
  const systemAccess = await hasSystemAccess(user.userId, user.role);
  const trialEligibility = await checkIpTrialEligibility(clientIp, user.role);
  const trialVerification = await getTrialVerificationStatus(user.userId);
  const billing = await resolveBillingSubject(user.userId, user.role, row?.clinicId ?? user.clinicId);
  const pricing = billing && (await getBillingPricingOverview(billing.subjectType, billing.subjectId));
  return c.json({
    success: true,
    subscription: sub,
    platformAccess: systemAccess,
    systemAccess,
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

  if (billing.subjectType === 'clinic' && podiatristCount > getClinicIncludedPodiatrists()) {
    return c.json(
      {
        error: 'clinic_over_included_limit',
        message: `Tu clínica tiene ${podiatristCount} podólogos activos. El plan en línea incluye hasta ${getClinicIncludedPodiatrists()}. Contacta a PodoAdmin para ampliar tu capacidad y facturación.`,
        podiatristCount,
        includedLimit: getClinicIncludedPodiatrists(),
      },
      403
    );
  }

  const quote = buildQuote({
    subjectType: billing.subjectType,
    subjectId: billing.subjectId,
    podiatristCount,
    podiatristLimit,
  });

  if (!quote.stripePriceId) {
    return c.json(
      {
        error: 'price_not_configured',
        message: `No hay precio Stripe configurado para: ${quote.planKey}. Revisa STRIPE_PRICE_CLINIC_MONTHLY_STANDARD y STRIPE_PRICE_INDEPENDENT_MONTHLY.`,
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
    successUrl: `${base}/billing?success=1`,
    cancelUrl: `${base}/billing?cancelled=1`,
    metadata: {
      subjectType: billing.subjectType,
      subjectId: billing.subjectId,
      userId: user.userId,
      billingInterval: 'month',
      podiatristCount: String(quote.podiatristCount),
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
    },
  });
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
  const portal = await createBillingPortalSession(subRow.stripeCustomerId, `${getAppBaseUrl()}/billing`);
  return c.json({ success: true, url: portal.url });
});

const renewSchema = z.object({
  subjectType: z.enum(['clinic', 'user']),
  subjectId: z.string().min(1).max(128),
  months: z.number().int().min(1).max(24).optional(),
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
    parsed.data.months ?? 1
  );
  return c.json({ success: true, subscription: sub });
});

export default subscriptionsRoutes;
