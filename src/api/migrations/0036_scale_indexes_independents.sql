-- Índices para listados paginados y agenda bajo carga (Fase 1 escala independientes)
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_patients_updated_at ON patients(updated_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_clinical_sessions_created_by ON clinical_sessions(created_by);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_appointments_session_date ON appointments(session_date);
