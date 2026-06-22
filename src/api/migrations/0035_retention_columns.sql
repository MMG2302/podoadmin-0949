-- Columnas de retención documental (alineadas con schema.ts y seed-mock-clinical-demo.sql)
ALTER TABLE `patients` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'clinical_record';
ALTER TABLE `patients` ADD COLUMN `last_clinical_act_at` integer;
ALTER TABLE `patients` ADD COLUMN `retain_until` integer;
ALTER TABLE `patients` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;

ALTER TABLE `clinical_sessions` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'clinical_record';
ALTER TABLE `clinical_sessions` ADD COLUMN `last_clinical_act_at` integer;
ALTER TABLE `clinical_sessions` ADD COLUMN `retain_until` integer;
ALTER TABLE `clinical_sessions` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
