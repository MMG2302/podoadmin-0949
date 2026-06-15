-- Transformación: recetas, suscripciones, clínica extendida, cumplimiento, WhatsApp, móvil

CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES clinical_sessions(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  patient_name TEXT NOT NULL,
  patient_dob TEXT NOT NULL,
  patient_dni TEXT NOT NULL,
  podiatrist_id TEXT NOT NULL,
  podiatrist_name TEXT NOT NULL,
  podiatrist_license TEXT,
  prescription_date TEXT NOT NULL,
  prescription_text TEXT NOT NULL,
  medications TEXT NOT NULL DEFAULT '',
  next_visit_date TEXT,
  notes TEXT NOT NULL DEFAULT '',
  folio TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  clinic_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_session ON prescriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  plan_id TEXT NOT NULL DEFAULT 'monthly_standard',
  current_period_start INTEGER NOT NULL,
  current_period_end INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_subject ON subscriptions(subject_type, subject_id);

ALTER TABLE patients ADD COLUMN clinical_alerts_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE appointments ADD COLUMN check_in_status TEXT DEFAULT 'none';

CREATE TABLE IF NOT EXISTS session_templates (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  fields_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  clinic_id TEXT,
  is_shared INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_referrals (
  id TEXT PRIMARY KEY NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  referred_to TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by TEXT NOT NULL,
  clinic_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unidad',
  clinic_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_inventory_usage (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES clinical_sessions(id),
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  quantity REAL NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointment_waitlist (
  id TEXT PRIMARY KEY NOT NULL,
  patient_id TEXT REFERENCES patients(id),
  pending_patient_name TEXT,
  pending_patient_phone TEXT,
  podiatrist_id TEXT NOT NULL,
  preferred_date TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  clinic_id TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patient_consent_signatures (
  id TEXT PRIMARY KEY NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  consent_version INTEGER NOT NULL,
  signature_data TEXT NOT NULL,
  signed_at TEXT NOT NULL,
  signed_by_name TEXT,
  device_info TEXT,
  created_by TEXT NOT NULL,
  clinic_id TEXT
);

CREATE TABLE IF NOT EXISTS lab_attachments (
  id TEXT PRIMARY KEY NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  session_id TEXT REFERENCES clinical_sessions(id),
  title TEXT NOT NULL,
  file_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL,
  clinic_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  message_body TEXT NOT NULL,
  filter_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TEXT,
  sent_at TEXT,
  created_by TEXT NOT NULL,
  clinic_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS record_access_log (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'view',
  ip_address TEXT,
  user_agent TEXT,
  clinic_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_record_access_patient ON record_access_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_record_access_user ON record_access_log(user_id);

CREATE TABLE IF NOT EXISTS user_mobile_sync (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES created_users(id) ON DELETE CASCADE,
  last_sync_at INTEGER NOT NULL,
  device_id TEXT,
  updated_at TEXT NOT NULL
);

ALTER TABLE user_whatsapp_integrations ADD COLUMN reminder_schedule TEXT NOT NULL DEFAULT '{"daysBefore":[5,2,1],"hoursBefore":[24,12,2]}';

CREATE TABLE IF NOT EXISTS appointment_reminder_sent (
  id TEXT PRIMARY KEY NOT NULL,
  appointment_id TEXT NOT NULL REFERENCES appointments(id),
  reminder_kind TEXT NOT NULL,
  sent_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_sent_unique ON appointment_reminder_sent(appointment_id, reminder_kind);
