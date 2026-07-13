-- Preferencias de impresión de historia clínica y recetas (clínica o profesional independiente)

ALTER TABLE `clinics` ADD COLUMN `print_preferences_json` text;
--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN `print_preferences_json` text;
