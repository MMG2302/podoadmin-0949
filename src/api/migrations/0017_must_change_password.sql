-- Contraseña temporal: obligar al usuario a cambiarla en el primer inicio de sesión
-- Nota: Si obtienes "duplicate column name", la columna ya existe. Marca esta migración como aplicada manualmente.
ALTER TABLE `created_users` ADD COLUMN `must_change_password` integer NOT NULL DEFAULT 0;
