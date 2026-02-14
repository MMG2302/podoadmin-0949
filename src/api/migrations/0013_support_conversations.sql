-- Conversaciones de soporte (usuario -> PodoAdmin)
CREATE TABLE IF NOT EXISTS `support_conversations` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `subject` text NOT NULL,
  `status` text NOT NULL DEFAULT 'open',
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `created_users`(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `support_conversations_user_id_idx` ON `support_conversations` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `support_conversations_status_idx` ON `support_conversations` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `support_conversations_updated_at_idx` ON `support_conversations` (`updated_at`);

-- Mensajes dentro de cada conversación
CREATE TABLE IF NOT EXISTS `support_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `conversation_id` text NOT NULL,
  `sender_id` text NOT NULL,
  `body` text NOT NULL,
  `created_at` text NOT NULL,
  `read_at` text,
  FOREIGN KEY (`conversation_id`) REFERENCES `support_conversations`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `support_messages_conversation_id_idx` ON `support_messages` (`conversation_id`);
