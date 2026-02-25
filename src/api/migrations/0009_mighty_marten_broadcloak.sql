CREATE TABLE `pending_registration_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`list_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'podiatrist' NOT NULL,
	`clinic_id` text,
	`clinic_mode` text,
	`podiatrist_limit` integer,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `pending_registration_lists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pending_registration_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitted_at` text,
	`reviewed_by` text,
	`reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `clinics` ADD `info_updated_at` text;--> statement-breakpoint
ALTER TABLE `clinics` ADD `logo_updated_at` text;--> statement-breakpoint
ALTER TABLE `clinics` ADD `podiatrist_limit` integer;--> statement-breakpoint
ALTER TABLE `created_users` ADD `must_change_password` integer DEFAULT false NOT NULL;