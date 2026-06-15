-- Stripe en suscripciones
ALTER TABLE subscriptions ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE subscriptions ADD COLUMN stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- Checklist por sesión clínica
CREATE TABLE IF NOT EXISTS session_checklists (
  session_id TEXT PRIMARY KEY,
  items_json TEXT NOT NULL,
  completed_at TEXT,
  updated_at TEXT NOT NULL
);

-- Firma en sesión (opcional, además de consentimiento general)
ALTER TABLE patient_consent_signatures ADD COLUMN session_id TEXT;
