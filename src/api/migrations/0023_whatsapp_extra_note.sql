ALTER TABLE `user_whatsapp_integrations` ADD COLUMN `default_extra_note` text;
--> statement-breakpoint
ALTER TABLE `whatsapp_message_events` ADD COLUMN `extra_note` text;
