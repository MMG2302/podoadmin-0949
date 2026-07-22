-- Mensaje personalizado que ve el paciente en /reserva/reagendar (fallback: texto genérico i18n).
-- Igual patrón que consent_text: override por podólogo, con default de clínica.
ALTER TABLE professional_info ADD COLUMN reschedule_message TEXT;
ALTER TABLE clinics ADD COLUMN reschedule_message TEXT;
