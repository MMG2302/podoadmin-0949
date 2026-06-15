-- Suscripciones mock para pruebas locales (sin Stripe real).
-- periodos: ~30 días desde "ahora" en SQLite (unixepoch).

-- Clínica Premium: 3 podólogos → tramo standard, trial activo
INSERT OR REPLACE INTO subscriptions (
  id, subject_type, subject_id, status, plan_id,
  current_period_start, current_period_end,
  stripe_customer_id, stripe_subscription_id,
  billing_interval, podiatrist_tier, podiatrist_count_billed,
  created_at, updated_at
) VALUES (
  'sub_clinic_001', 'clinic', 'clinic_001', 'trial', 'clinic_month_standard',
  (unixepoch() * 1000), (unixepoch() * 1000) + 2592000000,
  NULL, NULL,
  'month', 'standard', 3,
  datetime('now'), datetime('now')
);

-- Centro Médico: 6 podólogos → tramo expanded (probar sync manual/automático)
INSERT OR REPLACE INTO subscriptions (
  id, subject_type, subject_id, status, plan_id,
  current_period_start, current_period_end,
  stripe_customer_id, stripe_subscription_id,
  billing_interval, podiatrist_tier, podiatrist_count_billed,
  created_at, updated_at
) VALUES (
  'sub_clinic_002', 'clinic', 'clinic_002', 'active', 'clinic_month_expanded',
  (unixepoch() * 1000), (unixepoch() * 1000) + 2592000000,
  'cus_mock_clinic_002', 'sub_mock_clinic_002',
  'month', 'expanded', 6,
  datetime('now'), datetime('now')
);

-- Integral Plus: standard pero facturación desfasada (needsTierDowngrade si bajas podólogos)
INSERT OR REPLACE INTO subscriptions (
  id, subject_type, subject_id, status, plan_id,
  current_period_start, current_period_end,
  stripe_customer_id, stripe_subscription_id,
  billing_interval, podiatrist_tier, podiatrist_count_billed,
  created_at, updated_at
) VALUES (
  'sub_clinic_003', 'clinic', 'clinic_003', 'active', 'clinic_year_standard',
  (unixepoch() * 1000), (unixepoch() * 1000) + 31536000000,
  'cus_mock_clinic_003', 'sub_mock_clinic_003',
  'year', 'expanded', 3,
  datetime('now'), datetime('now')
);

-- Podólogo independiente (Pablo Hernández)
INSERT OR REPLACE INTO subscriptions (
  id, subject_type, subject_id, status, plan_id,
  current_period_start, current_period_end,
  stripe_customer_id, stripe_subscription_id,
  billing_interval, podiatrist_tier, podiatrist_count_billed,
  created_at, updated_at
) VALUES (
  'sub_user_010', 'user', 'user_podiatrist_010', 'trial', 'user_month_standard',
  (unixepoch() * 1000), (unixepoch() * 1000) + 2592000000,
  NULL, NULL,
  'month', NULL, NULL,
  datetime('now'), datetime('now')
);

-- Suscripción vencida (probar banner 402) — clínica ficticia de prueba en admin manual
-- (opcional: desactivar trial clinic_001 cambiando status)
-- UPDATE subscriptions SET status = 'cancelled', current_period_end = (unixepoch() * 1000) - 86400000 WHERE id = 'sub_clinic_001';
