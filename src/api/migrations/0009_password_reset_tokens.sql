CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL REFERENCES created_users(id),
	`token` text NOT NULL UNIQUE,
	`expires_at` integer NOT NULL,
	`used` integer NOT NULL DEFAULT 0,
	`created_at` text NOT NULL
);
