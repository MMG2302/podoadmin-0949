-- Bloqueo de cambios de datos de clínica y logo cada 15 días.
-- Las columnas info_updated_at y logo_updated_at ya existen en clinics (añadidas en 0009_mighty_marten_broadcloak.sql).
-- Esta migración es no-op para evitar duplicado en bases que aplicaron 0009 antes que 0015.
SELECT 1;
