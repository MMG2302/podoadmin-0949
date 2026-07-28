-- Bloqueos de agenda: tramos en los que no se puede agendar (comida, salida personal,
-- vacaciones, festivo de la clínica). Complementan el horario laboral de agenda_settings:
-- el horario define la ventana de atención y estos bloqueos recortan huecos dentro de ella.
--
-- podiatrist_id con valor  -> bloquea la agenda de ese podólogo.
-- podiatrist_id NULL       -> bloquea a todos los podólogos de clinic_id (festivo de clínica).
CREATE TABLE IF NOT EXISTS `agenda_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`podiatrist_id` text,
	`clinic_id` text,
	`title` text NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`recurrence` text DEFAULT 'once' NOT NULL,
	`weekdays` text,
	`start_date` text,
	`end_date` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_agenda_blocks_podiatrist` ON `agenda_blocks` (`podiatrist_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_agenda_blocks_clinic` ON `agenda_blocks` (`clinic_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_agenda_blocks_dates` ON `agenda_blocks` (`start_date`,`end_date`);
