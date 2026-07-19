import { Hono } from 'hono';
import { verifyStripeWebhookSignature } from '../utils/stripe-webhook-verify';
import { retrieveSubscription } from '../utils/stripe-client';
import {
  findSubscriptionByStripeId,
  upsertSubscriptionFromStripe,
  setStripeCustomerOnSubject,
} from '../utils/subscription-service';
import { logger } from '../utils/logger';
import { invalidateBillingSubjectAccessCache } from '../utils/access-cache';

const stripeWebhook = new Hono();

stripeWebhook.post('/', async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return c.json({ error: 'Webhook no configurado' }, 503);
  }

  const signature = c.req.header('stripe-signature');
  if (!signature) return c.json({ error: 'Firma ausente' }, 400);

  const rawBody = await c.req.text();
  const valid = await verifyStripeWebhookSignature(rawBody, signature, secret);
  if (!valid) return c.json({ error: 'Firma inválida' }, 400);

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return c.json({ error: 'JSON inválido' }, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          mode?: string;
          customer?: string;
          subscription?: string;
          metadata?: Record<string, string>;
        };
        if (session.mode !== 'subscription' || !session.subscription || !session.customer) break;
        const meta = session.metadata || {};
        const subjectType = meta.subjectType as 'clinic' | 'user' | undefined;
        const subjectId = meta.subjectId;
        if (!subjectType || !subjectId) break;
        await setStripeCustomerOnSubject(subjectType, subjectId, String(session.customer));
        const stripeSub = await retrieveSubscription(String(session.subscription));
        await upsertSubscriptionFromStripe(subjectType, subjectId, stripeSub, String(session.customer));
        await invalidateBillingSubjectAccessCache(subjectType, subjectId);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as {
          id: string;
          customer: string;
          status: string;
          current_period_start: number;
          current_period_end: number;
          cancel_at_period_end: boolean;
          metadata?: Record<string, string>;
        };
        let subjectType = sub.metadata?.subjectType as 'clinic' | 'user' | undefined;
        let subjectId = sub.metadata?.subjectId;
        const existing = await findSubscriptionByStripeId(sub.id);
        if (!subjectType && existing) {
          subjectType = existing.subjectType as 'clinic' | 'user';
          subjectId = existing.subjectId;
        }
        if (!subjectType || !subjectId) break;
        // En 'updated' se recupera la suscripción completa (con items) para
        // sincronizar los asientos extra; si falla, se usa el payload del evento.
        let stripePayload = {
          id: sub.id,
          customer: String(sub.customer),
          status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          metadata: sub.metadata,
        } as Parameters<typeof upsertSubscriptionFromStripe>[2];
        if (event.type === 'customer.subscription.updated') {
          try {
            stripePayload = await retrieveSubscription(sub.id);
          } catch {
            // payload del evento como fallback
          }
        }
        await upsertSubscriptionFromStripe(subjectType, subjectId, stripePayload, String(sub.customer));
        await invalidateBillingSubjectAccessCache(subjectType, subjectId);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as { subscription?: string; customer?: string };
        if (!invoice.subscription) break;
        const stripeSub = await retrieveSubscription(String(invoice.subscription));
        const existing = await findSubscriptionByStripeId(stripeSub.id);
        const subjectType = (stripeSub.metadata?.subjectType || existing?.subjectType) as
          | 'clinic'
          | 'user'
          | undefined;
        const subjectId = stripeSub.metadata?.subjectId || existing?.subjectId;
        if (!subjectType || !subjectId) break;
        await upsertSubscriptionFromStripe(
          subjectType,
          subjectId,
          stripeSub,
          String(invoice.customer || stripeSub.customer)
        );
        await invalidateBillingSubjectAccessCache(subjectType, subjectId);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logger.error({ event: 'stripe_webhook_error', type: event.type, message: String(err) });
    return c.json({ error: 'Error procesando evento' }, 500);
  }

  return c.json({ received: true });
});

export default stripeWebhook;
