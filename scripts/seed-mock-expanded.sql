-- Usuarios extra para probar tramos de facturación (clínica con 6 podólogos = expanded).
-- Ejecutar después de seed-mock-users.sql (db:seed:local).

INSERT OR IGNORE INTO created_users (id, user_id, email, name, role, clinic_id, password, created_at, updated_at, created_by, is_blocked, is_banned, is_enabled, email_verified, terms_accepted, registration_source) VALUES
('user_podiatrist_014', 'user_podiatrist_014', 'doctor4@centromedico.com', 'Dr. Raúl Prieto', 'podiatrist', 'clinic_002', '$2b$12$8HubqgkL4iXlvBciVYzAtOZ7gcETofvZCMocNxa6xgsBl3jwJtB2e', '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z', 'seed_mock', 0, 0, 1, 1, 1, 'admin'),
('user_podiatrist_015', 'user_podiatrist_015', 'doctor5@centromedico.com', 'Dra. Isabel Núñez', 'podiatrist', 'clinic_002', '$2b$12$8HubqgkL4iXlvBciVYzAtOZ7gcETofvZCMocNxa6xgsBl3jwJtB2e', '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z', 'seed_mock', 0, 0, 1, 1, 1, 'admin'),
('user_podiatrist_016', 'user_podiatrist_016', 'doctor6@centromedico.com', 'Dr. Hugo Castillo', 'podiatrist', 'clinic_002', '$2b$12$8HubqgkL4iXlvBciVYzAtOZ7gcETofvZCMocNxa6xgsBl3jwJtB2e', '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z', 'seed_mock', 0, 0, 1, 1, 1, 'admin');

INSERT OR IGNORE INTO user_credits (user_id, total_credits, used_credits, created_at, updated_at) VALUES
('user_podiatrist_014', 0, 0, '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z'),
('user_podiatrist_015', 0, 0, '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z'),
('user_podiatrist_016', 0, 0, '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z');

-- Límite operativo de podólogos (super_admin); facturación usa recuento activo
UPDATE clinics SET podiatrist_limit = 10 WHERE clinic_id = 'clinic_002';
UPDATE clinics SET podiatrist_limit = 5 WHERE clinic_id = 'clinic_001';
UPDATE clinics SET podiatrist_limit = 8 WHERE clinic_id = 'clinic_003';
