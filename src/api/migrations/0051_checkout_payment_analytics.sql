-- Método de pago al marcar cobrado + preferencias de metas/gastos del podólogo
ALTER TABLE checkout_handoffs ADD COLUMN payment_method TEXT;
ALTER TABLE professional_info ADD COLUMN checkout_analytics_json TEXT;
