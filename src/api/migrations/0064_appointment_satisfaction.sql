-- Encuesta de satisfacción por enlace (post-visita): 3 niveles + queja/sugerencia opcional.
-- Si el paciente marca "mal", la página no se cierra: puede dejar comentario, anónimo o no.
ALTER TABLE appointments ADD COLUMN satisfaction_rating TEXT; -- good | regular | bad
ALTER TABLE appointments ADD COLUMN satisfaction_comment TEXT;
ALTER TABLE appointments ADD COLUMN satisfaction_anonymous INTEGER NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN satisfaction_responded_at TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_satisfaction ON appointments (clinic_id, satisfaction_rating);
