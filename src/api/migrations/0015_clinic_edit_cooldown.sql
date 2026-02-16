-- Bloqueo de cambios de datos de clínica y logo cada 15 días
ALTER TABLE `clinics` ADD COLUMN `info_updated_at` text;
ALTER TABLE `clinics` ADD COLUMN `logo_updated_at` text;
