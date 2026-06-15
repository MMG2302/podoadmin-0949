-- Activación de trial: SMS + tarjeta + estado en grants por IP

CREATE TABLE IF NOT EXISTS trial_user_verifications (
  user_id TEXT PRIMARY KEY NOT NULL,
  phone_e164_hash TEXT,
  phone_verified_at INTEGER,
  card_fingerprint TEXT,
  card_verified_at INTEGER,
  stripe_payment_method_id TEXT,
  stripe_customer_id TEXT,
  activation_ip TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_user_verifications_phone
  ON trial_user_verifications(phone_e164_hash)
  WHERE phone_e164_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_user_verifications_card
  ON trial_user_verifications(card_fingerprint)
  WHERE card_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS trial_sms_otp (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  phone_e164_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trial_sms_otp_user ON trial_sms_otp(user_id);

ALTER TABLE ip_trial_grants ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE ip_trial_grants ADD COLUMN revoked_at INTEGER;
ALTER TABLE ip_trial_grants ADD COLUMN revoke_reason TEXT;
ALTER TABLE ip_trial_grants ADD COLUMN phone_hash TEXT;
ALTER TABLE ip_trial_grants ADD COLUMN card_fingerprint TEXT;
