-- Añadir campo de documento de consentimiento informado
-- Clinics: editable por clinic_admin; Professional_info: editable por podólogo independiente
ALTER TABLE `clinics` ADD COLUMN `consent_document_url` text;
--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN `consent_document_url` text;
