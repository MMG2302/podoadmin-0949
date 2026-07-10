-- Datos clínicos y cédula en receta (snapshot al emitir)

ALTER TABLE `prescriptions` ADD COLUMN `patient_age_years` integer;
--> statement-breakpoint
ALTER TABLE `prescriptions` ADD COLUMN `patient_weight_kg` text;
--> statement-breakpoint
ALTER TABLE `prescriptions` ADD COLUMN `patient_height_cm` text;
--> statement-breakpoint
ALTER TABLE `prescriptions` ADD COLUMN `podiatrist_cedula` text;
