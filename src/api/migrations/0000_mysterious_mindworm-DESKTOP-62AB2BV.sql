CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text,
	`session_date` text NOT NULL,
	`session_time` text NOT NULL,
	`reason` text NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`clinic_id` text,
	`pending_patient_name` text,
	`pending_patient_phone` text,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`details` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	`clinic_id` text
);
--> statement-breakpoint
CREATE TABLE `clinic_credit_distributions` (
	`id` text PRIMARY KEY NOT NULL,
	`clinic_id` text NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`distributed_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`clinic_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `created_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clinic_credits` (
	`clinic_id` text PRIMARY KEY NOT NULL,
	`total_credits` integer DEFAULT 0 NOT NULL,
	`distributed_to_date` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`clinic_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clinical_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`session_date` text NOT NULL,
	`session_type` text NOT NULL,
	`diagnosis` text,
	`treatment` text,
	`notes` text,
	`credits_used` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`clinic_id` text,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clinics` (
	`clinic_id` text PRIMARY KEY NOT NULL,
	`clinic_name` text NOT NULL,
	`clinic_code` text NOT NULL,
	`owner_id` text NOT NULL,
	`logo` text,
	`phone` text,
	`email` text,
	`address` text,
	`city` text,
	`postal_code` text,
	`license_number` text,
	`website` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clinics_clinic_code_unique` ON `clinics` (`clinic_code`);--> statement-breakpoint
CREATE TABLE `created_users` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`clinic_id` text,
	`password` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_by` text,
	`is_blocked` integer DEFAULT false NOT NULL,
	`is_banned` integer DEFAULT false NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`session_id` text,
	`created_at` text NOT NULL,
	`clinic_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `created_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`session_id`) REFERENCES `clinical_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`folio` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`gender` text NOT NULL,
	`id_number` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`address` text,
	`city` text,
	`postal_code` text,
	`medical_history` text NOT NULL,
	`consent` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_by` text NOT NULL,
	`clinic_id` text
);
--> statement-breakpoint
CREATE TABLE `rate_limit_attempts` (
	`identifier` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`first_attempt` integer NOT NULL,
	`last_attempt` integer NOT NULL,
	`blocked_until` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`total_credits` integer DEFAULT 0 NOT NULL,
	`used_credits` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
