CREATE TABLE IF NOT EXISTS `sent_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`sender_name` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`recipient_ids` text NOT NULL,
	`recipient_type` text NOT NULL,
	`sent_at` text NOT NULL
);
