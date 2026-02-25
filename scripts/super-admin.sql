-- Super admin (un solo usuario). Generado con: node scripts/create-super-admin.cjs [email] [password] [name]
-- Aplicar: wrangler d1 execute DB --local --file=scripts/super-admin.sql  (o --remote para producción)

INSERT OR REPLACE INTO created_users (id, user_id, email, name, role, clinic_id, password, created_at, updated_at, created_by, is_blocked, is_banned, is_enabled, email_verified, terms_accepted, registration_source) VALUES ('user_super_admin', 'user_super_admin', 'mvs.92.m@gmail.com', 'Mario Mauries García', 'super_admin', NULL, '$2b$12$1epBxeunsXTANQqU6DKvK.ErLauQ012BmGqPIxPVn7spJn0i2WvXu', '2026-02-25T05:09:28.801Z', '2026-02-25T05:09:28.801Z', 'script', 0, 0, 1, 0, 0, 'admin');

INSERT OR REPLACE INTO user_credits (user_id, total_credits, used_credits, created_at, updated_at) VALUES ('user_super_admin', 0, 0, '2026-02-25T05:09:28.801Z', '2026-02-25T05:09:28.801Z');