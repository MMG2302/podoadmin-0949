-- Recepcionista mock local: hector.alba.ruiz@gmail.com / podo123
-- Clínica Premium (clinic_001)

INSERT OR REPLACE INTO created_users (
  id, user_id, email, name, role, clinic_id, assigned_podiatrist_ids,
  password, created_at, updated_at, created_by,
  is_blocked, is_banned, is_enabled, must_change_password,
  email_verified, terms_accepted, registration_source
) VALUES (
  'user_receptionist_hector',
  'user_receptionist_hector',
  'hector.alba.ruiz@gmail.com',
  'Héctor Alba Ruiz',
  'receptionist',
  'clinic_001',
  '["user_podiatrist_001","user_podiatrist_002","user_podiatrist_003"]',
  '$2b$12$uW8Kc6xqvylFAZsl5h5xvegTnBUTUc9Va1nCBKne11t/xsXMLK81e',
  datetime('now'),
  datetime('now'),
  'user_clinic_admin_001',
  0, 0, 1, 0,
  1, 1, 'admin'
);

INSERT OR REPLACE INTO user_credits (user_id, total_credits, used_credits, created_at, updated_at)
VALUES ('user_receptionist_hector', 0, 0, datetime('now'), datetime('now'));
