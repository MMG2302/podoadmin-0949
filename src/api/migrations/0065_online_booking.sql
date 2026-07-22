-- Reserva en línea white-label: token público del enlace de auto-agendado del podólogo.
-- El paciente reserva desde la marca de la clínica, sin saber que existe PodoAdmin.
ALTER TABLE professional_info ADD COLUMN booking_token TEXT;
ALTER TABLE professional_info ADD COLUMN booking_enabled INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_professional_info_booking_token ON professional_info (booking_token);
