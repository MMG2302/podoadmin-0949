-- Tabla de Servicios/Tarifas por clínica
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_services_clinic ON services(clinic_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_clinic_name ON services(clinic_id, name);

-- Agregar campos a appointments para asociar servicio y costo
ALTER TABLE appointments ADD COLUMN service_id TEXT;
ALTER TABLE appointments ADD COLUMN cost DECIMAL(10, 2);
ALTER TABLE appointments ADD COLUMN duration_minutes INTEGER DEFAULT 30;

-- Índice para buscar citas por servicio
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);
