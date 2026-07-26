-- La tabla legal_holds estaba declarada en el schema de Drizzle pero nunca se generó
-- su migración: GET /compliance/legal-holds y GET /compliance/evidence/summary
-- respondían 500 ("no such table: legal_holds") para super_admin y admin.
CREATE TABLE IF NOT EXISTS `legal_holds` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` integer,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_legal_holds_active` ON `legal_holds` (`active`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_legal_holds_resource` ON `legal_holds` (`resource_type`,`resource_id`);
