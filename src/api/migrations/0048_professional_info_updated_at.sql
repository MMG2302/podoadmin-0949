-- Cooldown de 15 días entre cambios de datos profesionales (consultorio, credenciales).
ALTER TABLE `professional_info` ADD `info_updated_at` text;
