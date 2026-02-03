-- Seed de clínicas para usuarios mock (SOLO PARA USO LOCAL).
-- Debe ejecutarse después de seed-mock-users.sql para que clinic_admin y podólogos tengan su clínica.
-- db:seed:local ejecuta primero usuarios y luego este archivo.

INSERT OR IGNORE INTO clinics (clinic_id, clinic_name, clinic_code, owner_id, logo, phone, email, address, city, postal_code, license_number, website, consent_text, consent_text_version, created_at) VALUES
('clinic_001', 'Clínica Premium', 'PREMIUM', 'user_clinic_admin_001', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-01-30T00:49:03.796Z'),
('clinic_002', 'Centro Médico', 'CENTRO', 'user_clinic_admin_002', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-01-30T00:49:03.796Z'),
('clinic_003', 'Integral Plus', 'INTEGRAL', 'user_clinic_admin_003', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-01-30T00:49:03.796Z');

INSERT OR IGNORE INTO clinic_credits (clinic_id, total_credits, distributed_to_date, created_at, updated_at) VALUES
('clinic_001', 500, 0, '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z'),
('clinic_002', 500, 0, '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z'),
('clinic_003', 500, 0, '2026-01-30T00:49:03.796Z', '2026-01-30T00:49:03.796Z');
