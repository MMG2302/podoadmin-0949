PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_created_users` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`clinic_id` text,
	`password` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_by` text,
	`is_blocked` integer DEFAULT false NOT NULL,
	`is_banned` integer DEFAULT false NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`terms_accepted` integer DEFAULT false NOT NULL,
	`terms_accepted_at` text,
	`registration_source` text,
	`google_id` text,
	`apple_id` text,
	`oauth_provider` text,
	`avatar_url` text
);
--> statement-breakpoint
INSERT INTO `__new_created_users`("id", "user_id", "email", "name", "role", "clinic_id", "password", "created_at", "updated_at", "created_by", "is_blocked", "is_banned", "is_enabled", "email_verified", "terms_accepted", "terms_accepted_at", "registration_source", "google_id", "apple_id", "oauth_provider", "avatar_url") SELECT "id", "user_id", "email", "name", "role", "clinic_id", "password", "created_at", "updated_at", "created_by", "is_blocked", "is_banned", "is_enabled", "email_verified", "terms_accepted", "terms_accepted_at", "registration_source", "google_id", "apple_id", "oauth_provider", "avatar_url" FROM `created_users`;--> statement-breakpoint
DROP TABLE `created_users`;--> statement-breakpoint
ALTER TABLE `__new_created_users` RENAME TO `created_users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;