-- country_code estaba en schema.ts pero faltaba en D1; rompía inserts en professional_info (p. ej. marca de agua).

ALTER TABLE `professional_info` ADD COLUMN `country_code` text DEFAULT 'MX' NOT NULL;
--> statement-breakpoint
ALTER TABLE `clinics` ADD COLUMN `country_code` text DEFAULT 'MX';
