-- Índices compuestos para GET /appointments: el listado filtra por dueño + rango de fecha.
-- Antes se leía toda la tabla y se filtraba en JS; ahora los filtros van a SQL.
CREATE INDEX IF NOT EXISTS idx_appointments_created_by_date ON appointments (created_by, session_date);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments (clinic_id, session_date);
