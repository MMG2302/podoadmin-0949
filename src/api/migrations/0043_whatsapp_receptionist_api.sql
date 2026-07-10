-- Permite al podólogo/admin delegar el envío automático por API Meta a recepción.
ALTER TABLE `user_whatsapp_integrations` ADD COLUMN `receptionist_api_enabled` integer NOT NULL DEFAULT 0;
