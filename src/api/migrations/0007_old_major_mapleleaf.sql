ALTER TABLE `clinics` ADD COLUMN IF NOT EXISTS `consent_text` text;--> statement-breakpoint
ALTER TABLE `clinics` ADD COLUMN IF NOT EXISTS `consent_text_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN IF NOT EXISTS `consent_text` text;--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN IF NOT EXISTS `consent_text_version` integer DEFAULT 0 NOT NULL;