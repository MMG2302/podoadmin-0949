-- Cola de salida: handoff podólogo → recepción (importe a cobrar)
CREATE TABLE IF NOT EXISTS checkout_handoffs (
  id TEXT PRIMARY KEY,
  clinic_id TEXT,
  podiatrist_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  session_id TEXT,
  appointment_id TEXT,
  amount_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'MXN',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_amount',
  created_by TEXT NOT NULL,
  paid_at TEXT,
  paid_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkout_handoffs_podiatrist_status
  ON checkout_handoffs (podiatrist_id, status);

CREATE INDEX IF NOT EXISTS idx_checkout_handoffs_clinic_status
  ON checkout_handoffs (clinic_id, status);
