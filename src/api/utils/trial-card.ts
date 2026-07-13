import { eq } from 'drizzle-orm';

import { database } from '../database';
import { createdUsers, trialUserVerifications } from '../database/schema';

import {
  createSetupCheckoutSession,
  createStripeCustomer,
  getAppBaseUrl,
  isStripeConfigured,
  retrieveCheckoutSession,
  retrievePaymentMethod,
} from './stripe-client';
import { isEmailVerificationRequired } from './email-verification';

export function isTrialCardRequired(): boolean {
  return process.env.TRIAL_REQUIRE_CARD === '1' || process.env.NODE_ENV === 'production';
}

export function isTrialEmailRequired(): boolean {
  return isEmailVerificationRequired();
}

export async function isCardUsedForTrial(fingerprint: string): Promise<boolean> {
  const row = await database
    .select({ userId: trialUserVerifications.userId })
    .from(trialUserVerifications)
    .where(eq(trialUserVerifications.cardFingerprint, fingerprint))
    .limit(1)
    .then((r) => r[0]);
  return Boolean(row);
}

async function ensureVerificationRow(userId: string) {
  const iso = new Date().toISOString();
  const existing = await database
    .select()
    .from(trialUserVerifications)
    .where(eq(trialUserVerifications.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    await database.insert(trialUserVerifications).values({
      userId,
      createdAt: iso,
      updatedAt: iso,
    });
  }
  return existing;
}

export async function startTrialCardSetup(
  userId: string,
  email: string
): Promise<{ ok: boolean; url?: string; message?: string }> {
  if (!isStripeConfigured()) {
    if (process.env.NODE_ENV !== 'production' && process.env.TRIAL_MOCK_CARD === '1') {
      return { ok: true, url: `${getAppBaseUrl()}/settings?tab=billing&trial_card_mock=1` };
    }
    return { ok: false, message: 'Stripe no configurado.' };
  }

  await ensureVerificationRow(userId);
  const row = await database
    .select()
    .from(trialUserVerifications)
    .where(eq(trialUserVerifications.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  let customerId = row?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await createStripeCustomer(email, { userId, purpose: 'trial_verification' });
    customerId = customer.id;
    await database
      .update(trialUserVerifications)
      .set({ stripeCustomerId: customerId, updatedAt: new Date().toISOString() })
      .where(eq(trialUserVerifications.userId, userId));
  }

  const base = getAppBaseUrl();
  const session = await createSetupCheckoutSession({
    customerId,
    customerEmail: email,
    successUrl: `${base}/settings?tab=billing&trial_card=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/settings?tab=billing&trial_card=cancelled`,
    metadata: { userId, purpose: 'trial_card_verification' },
  });

  if (!session.url) {
    return { ok: false, message: 'No se pudo abrir la verificación de tarjeta.' };
  }
  return { ok: true, url: session.url };
}

export async function completeTrialCardSetup(
  userId: string,
  sessionId: string
): Promise<{ ok: boolean; message?: string }> {
  if (!isStripeConfigured()) {
    return { ok: false, message: 'Stripe no configurado.' };
  }

  const session = await retrieveCheckoutSession(sessionId);
  if (session.metadata?.userId && session.metadata.userId !== userId) {
    return { ok: false, message: 'Sesión no corresponde a tu cuenta.' };
  }

  const setupIntent =
    typeof session.setup_intent === 'string'
      ? { id: session.setup_intent, payment_method: null, status: 'requires_payment_method' }
      : session.setup_intent;

  const pmId =
    typeof setupIntent?.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent?.payment_method ?? null;

  if (!pmId) {
    return { ok: false, message: 'No se encontró método de pago en la sesión.' };
  }

  const pm = await retrievePaymentMethod(pmId);
  const fingerprint = pm.card?.fingerprint?.trim();
  if (!fingerprint) {
    return { ok: false, message: 'No se pudo validar la tarjeta.' };
  }

  if (await isCardUsedForTrial(fingerprint)) {
    return {
      ok: false,
      message: 'Esta tarjeta ya se usó para un periodo de prueba en otra cuenta.',
    };
  }

  const now = Date.now();
  const iso = new Date().toISOString();
  await ensureVerificationRow(userId);
  await database
    .update(trialUserVerifications)
    .set({
      cardFingerprint: fingerprint,
      cardVerifiedAt: now,
      stripePaymentMethodId: pm.id,
      stripeCustomerId: session.customer ?? undefined,
      updatedAt: iso,
    })
    .where(eq(trialUserVerifications.userId, userId));

  return { ok: true };
}

/** Solo desarrollo con TRIAL_MOCK_CARD=1 */
export async function mockTrialCardVerification(userId: string): Promise<{ ok: boolean; message?: string }> {
  if (process.env.NODE_ENV === 'production' || process.env.TRIAL_MOCK_CARD !== '1') {
    return { ok: false, message: 'No permitido.' };
  }
  const fingerprint = `mock_${userId.slice(0, 12)}`;
  const now = Date.now();
  const iso = new Date().toISOString();
  await ensureVerificationRow(userId);
  await database
    .update(trialUserVerifications)
    .set({
      cardFingerprint: fingerprint,
      cardVerifiedAt: now,
      updatedAt: iso,
    })
    .where(eq(trialUserVerifications.userId, userId));
  return { ok: true };
}

export async function isUserCardVerified(userId: string): Promise<boolean> {
  if (!isTrialCardRequired()) return true;
  const row = await database
    .select({ at: trialUserVerifications.cardVerifiedAt })
    .from(trialUserVerifications)
    .where(eq(trialUserVerifications.userId, userId))
    .limit(1)
    .then((r) => r[0]);
  return Boolean(row?.at);
}

export async function getTrialVerificationStatus(userId: string) {
  const row = await database
    .select()
    .from(trialUserVerifications)
    .where(eq(trialUserVerifications.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  const userRow = await database
    .select({ emailVerified: createdUsers.emailVerified, email: createdUsers.email })
    .from(createdUsers)
    .where(eq(createdUsers.userId, userId))
    .limit(1)
    .then((r) => r[0]);

  const emailRequired = isTrialEmailRequired();
  const cardRequired = isTrialCardRequired();
  const emailVerified = emailRequired ? Boolean(userRow?.emailVerified) : true;
  const cardVerified = cardRequired ? Boolean(row?.cardVerifiedAt) : true;

  return {
    emailRequired,
    cardRequired,
    emailVerified,
    cardVerified,
    email: userRow?.email ?? null,
    ready: emailVerified && cardVerified,
    cardFingerprint: row?.cardFingerprint ?? null,
  };
}
