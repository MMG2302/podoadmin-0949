-- Contraseña temporal: obligar al usuario a cambiarla en el primer inicio de sesión
ALTER TABLE `created_users` ADD COLUMN `must_change_password` integer NOT NULL DEFAULT 0;
