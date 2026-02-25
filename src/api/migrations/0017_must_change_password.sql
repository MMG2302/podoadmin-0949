-- Contraseña temporal: obligar al usuario a cambiarla en el primer inicio de sesión.
-- La columna must_change_password ya existe en created_users (añadida en 0009_mighty_marten_broadcloak.sql).
-- No-op para evitar duplicado.
SELECT 1;
