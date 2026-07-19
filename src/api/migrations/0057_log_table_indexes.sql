-- Índices para tablas de log de alto crecimiento (audit_log, notifications, security_metrics).
-- Sin ellos, las consultas filtradas por usuario/acción/fecha hacen full scan que crece linealmente.

-- audit_log: consultas por usuario y por acción, siempre ordenadas por created_at DESC
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_created ON audit_log(action, created_at);

-- notifications: listado por destinatario (ordenado por fecha) y contador de no leídas
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- security_metrics: dashboards/alertas por tipo y fecha; cascade de borrado por usuario
CREATE INDEX IF NOT EXISTS idx_security_metrics_type_created ON security_metrics(metric_type, created_at);
CREATE INDEX IF NOT EXISTS idx_security_metrics_user ON security_metrics(user_id);
