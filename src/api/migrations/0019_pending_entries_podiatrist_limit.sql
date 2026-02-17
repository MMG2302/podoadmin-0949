-- Límite de podólogos para admin de clínica (solo aplica a clinic_admin)
ALTER TABLE `pending_registration_entries` ADD COLUMN `podiatrist_limit` integer;
