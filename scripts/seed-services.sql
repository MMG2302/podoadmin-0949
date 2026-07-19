-- Servicios/Tarifas para clínica premium (clinic_001)
-- Estos son ejemplos de servicios típicos en una clínica podológica

INSERT OR IGNORE INTO services (id, clinic_id, name, description, duration_minutes, cost, is_active, created_at, updated_at)
VALUES
  ('svc_001_cons', 'clinic_001', 'Consulta General', 'Evaluación y diagnóstico inicial', 30, 50.00, 1, datetime('now'), datetime('now')),
  ('svc_001_corn', 'clinic_001', 'Extirpación de Callos', 'Tratamiento y remoción de callos', 45, 75.00, 1, datetime('now'), datetime('now')),
  ('svc_001_verruga', 'clinic_001', 'Tratamiento de Verrugas', 'Tratamiento especializado de verrugas plantares', 60, 100.00, 1, datetime('now'), datetime('now')),
  ('svc_001_unas', 'clinic_001', 'Tratamiento de Uñas Encarnadas', 'Corrección y tratamiento de uñas encarnadas', 50, 85.00, 1, datetime('now'), datetime('now')),
  ('svc_001_apositos', 'clinic_001', 'Apositos y Vendajes', 'Aplicación de apositos especializados', 30, 40.00, 1, datetime('now'), datetime('now')),
  ('svc_001_sesion', 'clinic_001', 'Sesión Clínica Completa', 'Sesión completa con evaluación y tratamiento', 90, 150.00, 1, datetime('now'), datetime('now'));

-- Actualizar clínica premium con dirección mock
UPDATE clinics
SET
  address = 'Calle del Centro 123, Piso 3, Oficina 301',
  phone = '+34 91 555 1234',
  website = 'https://clinica-premium.es'
WHERE clinic_id = 'clinic_001';
