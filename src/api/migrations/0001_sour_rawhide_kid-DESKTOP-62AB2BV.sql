CREATE TABLE `security_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`metric_type` text NOT NULL,
	`user_id` text,
	`ip_address` text,
	`details` text,
	`created_at` text NOT NULL,
	`clinic_id` text
);
--> statement-breakpoint
CREATE TABLE `token_blacklist` (
	`token_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_type` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `two_factor_auth` (
	`user_id` text PRIMARY KEY NOT NULL,
	`secret` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`backup_codes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `created_users`(`id`) ON UPDATE no action ON DELETE no action
);
