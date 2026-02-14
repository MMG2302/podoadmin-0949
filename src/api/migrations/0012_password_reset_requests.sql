-- Solicitudes de recuperación de contraseña (requieren revisión por admin/soporte)
CREATE TABLE IF NOT EXISTS `password_reset_requests` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `email` text NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `requested_at` text NOT NULL,
  `ip_address` text,
  `user_agent` text,
  `reviewed_by` text,
  `reviewed_at` text,
  `rejection_reason` text,
  FOREIGN KEY (`user_id`) REFERENCES `created_users`(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `password_reset_requests_status_idx` ON `password_reset_requests` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `password_reset_requests_requested_at_idx` ON `password_reset_requests` (`requested_at`);
