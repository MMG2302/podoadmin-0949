CREATE TABLE IF NOT EXISTS `whatsapp_message_events` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `clinic_id` text,
  `appointment_id` text,
  `patient_id` text,
  `patient_phone` text,
  `patient_name` text,
  `message_type` text NOT NULL DEFAULT 'appointment_reminder',
  `direction` text NOT NULL DEFAULT 'outbound',
  `status` text NOT NULL DEFAULT 'pending',
  `provider_message_id` text,
  `provider_payload` text,
  `provider_response` text,
  `error_message` text,
  `created_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `created_users`(`id`),
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `whatsapp_events_user_created_idx` ON `whatsapp_message_events` (`user_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `whatsapp_events_appointment_idx` ON `whatsapp_message_events` (`appointment_id`);
