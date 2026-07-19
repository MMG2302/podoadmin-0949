-- Planes Base/Premium por suscripción (entitlements derivados por código).
-- plan_tier: tier facturado (lo escribe Stripe/checkout). plan_tier_override: grant manual de super_admin.
ALTER TABLE subscriptions ADD COLUMN plan_tier TEXT NOT NULL DEFAULT 'base';
ALTER TABLE subscriptions ADD COLUMN plan_tier_override TEXT;

-- Grandfather: suscriptores de pago actuales y trials en curso conservan acceso completo.
UPDATE subscriptions SET plan_tier = 'premium'
WHERE stripe_subscription_id IS NOT NULL OR status = 'trial';
