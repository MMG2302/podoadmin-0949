-- Columnas de retención en tablas adicionales (alineadas con schema.ts)
ALTER TABLE `audit_log` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'audit_evidence';
ALTER TABLE `audit_log` ADD COLUMN `retain_until` integer;
ALTER TABLE `audit_log` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;

ALTER TABLE `security_metrics` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'security_event';
ALTER TABLE `security_metrics` ADD COLUMN `retain_until` integer;
ALTER TABLE `security_metrics` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;

ALTER TABLE `notifications` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'operational_short_term';
ALTER TABLE `notifications` ADD COLUMN `retain_until` integer;
ALTER TABLE `notifications` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;

ALTER TABLE `appointments` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'clinical_record';
ALTER TABLE `appointments` ADD COLUMN `last_clinical_act_at` integer;
ALTER TABLE `appointments` ADD COLUMN `retain_until` integer;
ALTER TABLE `appointments` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;

ALTER TABLE `support_conversations` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'support_record';
ALTER TABLE `support_conversations` ADD COLUMN `retain_until` integer;
ALTER TABLE `support_conversations` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;

ALTER TABLE `support_messages` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'support_record';
ALTER TABLE `support_messages` ADD COLUMN `retain_until` integer;
ALTER TABLE `support_messages` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
