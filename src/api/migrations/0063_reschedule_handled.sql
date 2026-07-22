-- "En gestión": el staff marca una cancelación pendiente para recuperación manual (llamadas).
-- Frena la escalación de alertas automáticas sin perder al paciente de vista.
-- reschedule_status ahora admite: none | pending | handled | resolved | expired.
ALTER TABLE appointments ADD COLUMN reschedule_handled_at TEXT;
ALTER TABLE appointments ADD COLUMN reschedule_handled_by TEXT;
