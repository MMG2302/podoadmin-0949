/**
 * Cliente Stripe vía fetch (sin SDK) para Cloudflare Workers.
 */
import { isStripeBillingConfigured } from './billing-pricing';

function getStripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('STRIPE_NOT_CONFIGURED');
  return key;
}

function encodeParams(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    search.append(k, String(v));
  }
  return search.toString();
}

export async function stripePost<T = Record<string, unknown>>(
  path: string,
  params: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecret()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeParams(params),
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(`STRIPE_API: ${msg}`);
  }
  return data;
}

export async function stripeGet<T = Record<string, unknown>>(path: string): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${getStripeSecret()}` },
  });
  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    throw new Error(`STRIPE_API: ${msg}`);
  }
  return data;
}

export function isStripeConfigured(): boolean {
  return isStripeBillingConfigured();
}

export function getStripePublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

export function getAppBaseUrl(): string {
  return (
    process.env.APP_BASE_URL?.trim() ||
    process.env.OFFICIAL_APP_DOMAIN?.trim() ||
    'http://localhost:5173'
  ).replace(/\/$/, '');
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  customer: string | null;
  subscription: string | null;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  metadata?: Record<string, string>;
  items?: {
    data: Array<{ id: string; price: { id: string } }>;
  };
}

export async function createCheckoutSession(opts: {
  customerId?: string | null;
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<StripeCheckoutSession> {
  const params: Record<string, string | number | boolean | undefined> = {
    mode: 'subscription',
    'line_items[0][price]': opts.priceId,
    'line_items[0][quantity]': 1,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    allow_promotion_codes: 'true',
  };
  for (const [key, value] of Object.entries(opts.metadata)) {
    params[`subscription_data[metadata][${key}]`] = value;
    params[`metadata[${key}]`] = value;
  }
  if (opts.customerId) {
    params.customer = opts.customerId;
  } else {
    params.customer_email = opts.customerEmail;
  }
  return stripePost<StripeCheckoutSession>('/checkout/sessions', params);
}

export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
  return stripePost<{ url: string }>('/billing_portal/sessions', {
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function createStripeCustomer(email: string, metadata: Record<string, string>): Promise<{ id: string }> {
  const params: Record<string, string | undefined> = { email };
  for (const [k, v] of Object.entries(metadata)) {
    params[`metadata[${k}]`] = v;
  }
  return stripePost<{ id: string }>('/customers', params);
}

export interface StripeSetupIntent {
  id: string;
  client_secret: string | null;
  status: string;
  payment_method: string | null;
}

export async function createSetupIntent(customerId: string): Promise<StripeSetupIntent> {
  return stripePost<StripeSetupIntent>('/setup_intents', {
    customer: customerId,
    'payment_method_types[0]': 'card',
    usage: 'off_session',
  });
}

export async function retrieveSetupIntent(setupIntentId: string): Promise<StripeSetupIntent> {
  return stripeGet<StripeSetupIntent>(`/setup_intents/${setupIntentId}`);
}

export interface StripePaymentMethod {
  id: string;
  card?: { fingerprint?: string | null; last4?: string; brand?: string };
}

export async function retrievePaymentMethod(paymentMethodId: string): Promise<StripePaymentMethod> {
  return stripeGet<StripePaymentMethod>(`/payment_methods/${paymentMethodId}`);
}

export async function createSetupCheckoutSession(opts: {
  customerId?: string | null;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<StripeCheckoutSession> {
  const params: Record<string, string | number | boolean | undefined> = {
    mode: 'setup',
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    'payment_method_types[0]': 'card',
  };
  for (const [key, value] of Object.entries(opts.metadata)) {
    params[`metadata[${key}]`] = value;
  }
  if (opts.customerId) {
    params.customer = opts.customerId;
  } else {
    params.customer_email = opts.customerEmail;
  }
  return stripePost<StripeCheckoutSession>('/checkout/sessions', params);
}

export async function retrieveCheckoutSession(sessionId: string): Promise<{
  id: string;
  setup_intent: string | StripeSetupIntent | null;
  customer: string | null;
  metadata?: Record<string, string>;
}> {
  return stripeGet(`/checkout/sessions/${sessionId}?expand[]=setup_intent`);
}

export async function retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeGet<StripeSubscription>(
    `/subscriptions/${subscriptionId}?expand[]=items.data.price`
  );
}

export async function updateSubscriptionPrice(
  subscriptionId: string,
  subscriptionItemId: string,
  newPriceId: string
): Promise<StripeSubscription> {
  return stripePost<StripeSubscription>(`/subscriptions/${subscriptionId}`, {
    'items[0][id]': subscriptionItemId,
    'items[0][price]': newPriceId,
    proration_behavior: 'create_prorations',
  });
}
