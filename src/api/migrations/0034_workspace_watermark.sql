-- Marca de agua / fondo del área principal (clínica o profesional independiente)

ALTER TABLE `clinics` ADD COLUMN `workspace_watermark_json` text;
--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN `workspace_watermark_json` text;
