-- Global retention metadata for compliance and legal-hold workflows

ALTER TABLE `patients` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'clinical_record';
--> statement-breakpoint
ALTER TABLE `patients` ADD COLUMN `last_clinical_act_at` integer;
--> statement-breakpoint
ALTER TABLE `patients` ADD COLUMN `retain_until` integer;
--> statement-breakpoint
ALTER TABLE `patients` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE `clinical_sessions` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'clinical_record';
--> statement-breakpoint
ALTER TABLE `clinical_sessions` ADD COLUMN `last_clinical_act_at` integer;
--> statement-breakpoint
ALTER TABLE `clinical_sessions` ADD COLUMN `retain_until` integer;
--> statement-breakpoint
ALTER TABLE `clinical_sessions` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE `appointments` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'clinical_record';
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `last_clinical_act_at` integer;
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `retain_until` integer;
--> statement-breakpoint
ALTER TABLE `appointments` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE `audit_log` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'audit_evidence';
--> statement-breakpoint
ALTER TABLE `audit_log` ADD COLUMN `retain_until` integer;
--> statement-breakpoint
ALTER TABLE `audit_log` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE `notifications` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'operational_short_term';
--> statement-breakpoint
ALTER TABLE `notifications` ADD COLUMN `retain_until` integer;
--> statement-breakpoint
ALTER TABLE `notifications` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE `security_metrics` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'security_event';
--> statement-breakpoint
ALTER TABLE `security_metrics` ADD COLUMN `retain_until` integer;
--> statement-breakpoint
ALTER TABLE `security_metrics` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE `support_conversations` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'support_record';
--> statement-breakpoint
ALTER TABLE `support_conversations` ADD COLUMN `retain_until` integer;
--> statement-breakpoint
ALTER TABLE `support_conversations` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE `support_messages` ADD COLUMN `retention_category` text NOT NULL DEFAULT 'support_record';
--> statement-breakpoint
ALTER TABLE `support_messages` ADD COLUMN `retain_until` integer;
--> statement-breakpoint
ALTER TABLE `support_messages` ADD COLUMN `legal_hold` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `legal_holds` (
  `id` text PRIMARY KEY NOT NULL,
  `resource_type` text NOT NULL,
  `resource_id` text NOT NULL,
  `reason` text NOT NULL,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  `expires_at` integer,
  `active` integer NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `legal_holds_resource_idx` ON `legal_holds` (`resource_type`, `resource_id`);
