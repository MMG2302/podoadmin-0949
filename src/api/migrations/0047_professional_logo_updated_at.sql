-- Versión de caché para logos profesionales (misma URL proxy, contenido distinto).
ALTER TABLE professional_logos ADD COLUMN updated_at TEXT;
UPDATE professional_logos SET updated_at = datetime('now') WHERE updated_at IS NULL;
