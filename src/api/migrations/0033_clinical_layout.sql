-- Configuración de secciones de historia clínica (clínica / profesional independiente)

ALTER TABLE `clinics` ADD COLUMN `clinical_layout_json` text;
--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN `clinical_layout_json` text;
