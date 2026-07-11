-- Logo visible en tarjeta del dashboard (clínica o profesional independiente)

ALTER TABLE `clinics` ADD COLUMN `dashboard_logo_enabled` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN `dashboard_logo_enabled` integer DEFAULT 0;
