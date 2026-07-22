-- Alerta de reagendo: al cancelar una cita queda "pending" hasta que se agenda una nueva
-- para el mismo paciente (auto-resuelve) o hasta que se atiende. lastRescheduleAlertAt guía
-- el reenvío recurrente de la notificación interna (intervalo configurable por clinic_admin).
ALTER TABLE appointments ADD COLUMN reschedule_status TEXT DEFAULT 'none';
ALTER TABLE appointments ADD COLUMN reschedule_requested_at TEXT;
ALTER TABLE appointments ADD COLUMN last_reschedule_alert_at TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_status ON appointments (reschedule_status);
