CREATE TABLE IF NOT EXISTS `clinical_session_images` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`data_uri` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `clinical_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX IF NOT EXISTS `clinical_session_images_session_id_idx` ON `clinical_session_images` (`session_id`);
