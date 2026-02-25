-- Límite de podólogos para admin de clínica (solo aplica a clinic_admin).
-- La columna podiatrist_limit ya existe en pending_registration_entries (tabla creada con ella en 0009).
-- No-op para evitar duplicado.
SELECT 1;
