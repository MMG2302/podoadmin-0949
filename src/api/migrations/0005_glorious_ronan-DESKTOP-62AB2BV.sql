CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `professional_credentials` (
	`user_id` text PRIMARY KEY NOT NULL,
	`cedula` text DEFAULT '' NOT NULL,
	`registro` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `professional_info` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`postal_code` text DEFAULT '' NOT NULL,
	`license_number` text DEFAULT '' NOT NULL,
	`professional_license` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `professional_licenses` (
	`user_id` text PRIMARY KEY NOT NULL,
	`license` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `professional_logos` (
	`user_id` text PRIMARY KEY NOT NULL,
	`logo` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sent_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`sender_name` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`recipient_ids` text NOT NULL,
	`recipient_type` text NOT NULL,
	`sent_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `created_users` ADD `assigned_podiatrist_ids` text;