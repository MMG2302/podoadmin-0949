-- Plan: intervalo de facturación y tramo por nº de podólogos (clínica)
ALTER TABLE subscriptions ADD COLUMN billing_interval TEXT;
ALTER TABLE subscriptions ADD COLUMN podiatrist_tier TEXT;
ALTER TABLE subscriptions ADD COLUMN podiatrist_count_billed INTEGER;
