-- CURP (México / NOM-004 identificación) y aceptación de política de privacidad en registro

ALTER TABLE `patients` ADD COLUMN `curp` text;

ALTER TABLE `created_users` ADD COLUMN `privacy_policy_accepted` integer NOT NULL DEFAULT 0;
ALTER TABLE `created_users` ADD COLUMN `privacy_policy_accepted_at` text;
