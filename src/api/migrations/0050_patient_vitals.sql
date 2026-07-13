-- Último peso/estatura conocidos del paciente (actualizados desde sesiones).
ALTER TABLE `patients` ADD COLUMN `weight_kg` text;
ALTER TABLE `patients` ADD COLUMN `height_cm` text;
