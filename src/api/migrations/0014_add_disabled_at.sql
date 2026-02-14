-- Ciclo cancelación: 1 mes grace → bloqueo → 7 meses después borrado permanente
ALTER TABLE `created_users` ADD COLUMN `disabled_at` integer;
