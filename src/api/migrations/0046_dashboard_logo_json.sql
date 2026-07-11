-- Ajustes visuales del logo en tarjeta del dashboard

ALTER TABLE `clinics` ADD COLUMN `dashboard_logo_json` text;
--> statement-breakpoint
ALTER TABLE `professional_info` ADD COLUMN `dashboard_logo_json` text;
--> statement-breakpoint
UPDATE `clinics`
SET `dashboard_logo_json` = '{"enabled":true,"opacity":1,"size":85,"zoom":100,"positionX":50,"positionY":50}'
WHERE `dashboard_logo_enabled` = 1 AND (`dashboard_logo_json` IS NULL OR `dashboard_logo_json` = '');
--> statement-breakpoint
UPDATE `professional_info`
SET `dashboard_logo_json` = '{"enabled":true,"opacity":1,"size":85,"zoom":100,"positionX":50,"positionY":50}'
WHERE `dashboard_logo_enabled` = 1 AND (`dashboard_logo_json` IS NULL OR `dashboard_logo_json` = '');
