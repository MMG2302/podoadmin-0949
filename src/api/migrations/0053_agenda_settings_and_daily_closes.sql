-- Horario laboral / horas extras por podólogo y clínica
ALTER TABLE professional_info ADD COLUMN agenda_settings_json TEXT;
ALTER TABLE clinics ADD COLUMN agenda_settings_json TEXT;

-- Cierres de ventas diarios (snapshot histórico)
CREATE TABLE IF NOT EXISTS daily_sales_closes (
  id TEXT PRIMARY KEY NOT NULL,
  close_date TEXT NOT NULL,
  podiatrist_id TEXT NOT NULL,
  clinic_id TEXT,
  paid_cents INTEGER NOT NULL DEFAULT 0,
  paid_count INTEGER NOT NULL DEFAULT 0,
  pending_cents INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  by_method_json TEXT,
  notes TEXT,
  closed_by TEXT NOT NULL,
  closed_at TEXT NOT NULL,
  UNIQUE (podiatrist_id, close_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_sales_closes_date ON daily_sales_closes (close_date);
CREATE INDEX IF NOT EXISTS idx_daily_sales_closes_podiatrist ON daily_sales_closes (podiatrist_id);
