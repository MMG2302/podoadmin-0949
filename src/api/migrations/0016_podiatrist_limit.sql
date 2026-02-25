-- Límite de podólogos por clínica (super_admin lo define; clinic_admin crea dentro del límite).
-- La columna podiatrist_limit ya existe en clinics (añadida en 0009_mighty_marten_broadcloak.sql).
-- No-op para evitar duplicado.
SELECT 1;
