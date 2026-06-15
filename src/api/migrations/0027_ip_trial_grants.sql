-- Trial de 1 mes por dirección IP (validada con ipquery.io)
CREATE TABLE IF NOT EXISTS ip_trial_grants (
  id TEXT PRIMARY KEY NOT NULL,
  ip_address TEXT NOT NULL,
  user_id TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  subscription_id TEXT,
  country_code TEXT,
  risk_score INTEGER,
  ipquery_json TEXT,
  granted_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_trial_grants_ip ON ip_trial_grants(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_trial_grants_subject ON ip_trial_grants(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_ip_trial_grants_user ON ip_trial_grants(user_id);
