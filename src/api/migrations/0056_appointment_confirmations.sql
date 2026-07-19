-- Confirmación/cancelación de citas por enlace (wa.me): token único por cita.
-- El paciente abre /reserva/confirmar?token=... o /reserva/cancelar?token=... sin iniciar sesión.
ALTER TABLE appointments ADD COLUMN confirm_token TEXT;
ALTER TABLE appointments ADD COLUMN confirmation_sent_at TEXT;
ALTER TABLE appointments ADD COLUMN confirmation_responded_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_confirm_token ON appointments(confirm_token);
