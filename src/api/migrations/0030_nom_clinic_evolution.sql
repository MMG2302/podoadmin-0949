-- Identificación institucional NOM (México) y notas de evolución clínica

ALTER TABLE `clinics` ADD COLUMN `legal_name` text;
ALTER TABLE `clinics` ADD COLUMN `rfc` text;
ALTER TABLE `clinics` ADD COLUMN `clues` text;
ALTER TABLE `clinics` ADD COLUMN `establishment_type` text DEFAULT 'private_office';
ALTER TABLE `clinics` ADD COLUMN `cofepris_registration` text;

CREATE TABLE IF NOT EXISTS `clinical_evolution_notes` (
  `id` text PRIMARY KEY NOT NULL,
  `patient_id` text NOT NULL REFERENCES patients(id),
  `session_id` text REFERENCES clinical_sessions(id),
  `entry_date` text NOT NULL,
  `note` text NOT NULL,
  `professional_name` text NOT NULL,
  `professional_license` text,
  `created_by` text NOT NULL,
  `clinic_id` text,
  `created_at` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_evolution_notes_patient` ON `clinical_evolution_notes` (`patient_id`);
CREATE INDEX IF NOT EXISTS `idx_evolution_notes_session` ON `clinical_evolution_notes` (`session_id`);
