-- Integración WhatsApp Business API por usuario (podólogo / clinic_admin)
CREATE TABLE IF NOT EXISTS `user_whatsapp_integrations` (
  `user_id` text PRIMARY KEY NOT NULL,
  `clinic_id` text,
  `phone_number_id` text NOT NULL,
  `waba_id` text,
  `business_phone_e164` text,
  `access_token_enc` text NOT NULL,
  `enabled` integer NOT NULL DEFAULT 0,
  `reminders_enabled` integer NOT NULL DEFAULT 1,
  `reminder_hours_before` text NOT NULL DEFAULT '[24,48]',
  `template_name` text,
  `template_language` text NOT NULL DEFAULT 'es',
  `status` text NOT NULL DEFAULT 'pending',
  `last_error` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `created_users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `user_whatsapp_integrations_clinic_id_idx` ON `user_whatsapp_integrations` (`clinic_id`);
