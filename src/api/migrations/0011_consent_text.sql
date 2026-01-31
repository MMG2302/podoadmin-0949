-- Términos y condiciones / consentimiento informado como texto (reemplaza URL)
-- El podólogo escribe el texto, se muestra al paciente al crear ficha
ALTER TABLE `clinics` ADD COLUMN `consent_text` text;
--> statement-breakpoint
ALTER TABLE `clinics` ADD COLUMN `consent_text_version` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN `consent_text` text;
--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN `consent_text_version` integer DEFAULT 0;
