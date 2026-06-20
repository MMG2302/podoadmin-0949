-- Pacientes y sesiones demo para pruebas locales (podología / historia clínica).
-- Ejecutar después de seed-clinics.sql (incluido en db:seed:local).

INSERT OR IGNORE INTO patients (
  id, folio, first_name, last_name, date_of_birth, gender, id_number, curp,
  phone, email, address, city, postal_code, clinical_alerts_json, medical_history, consent,
  retention_category, last_clinical_act_at, retain_until, legal_hold,
  created_at, updated_at, created_by, clinic_id
) VALUES
(
  'patient_demo_001', 'PREMIUM-2026-001', 'Laura', 'Mendoza', '1985-03-12', 'female', 'INE-884422', 'MEXL850312MDFNRR01',
  '5551002001', 'laura.mendoza@example.com', 'Av. Reforma 120', 'Ciudad de México', '06600', '[]',
  '{"allergies":["Penicilina"],"medications":[],"conditions":["Diabetes tipo 2"]}',
  '{"given":true,"date":"2026-06-01T10:00:00.000Z","consentedToVersion":1}',
  'clinical_record', 1718668800000, 2348812800000, 0,
  '2026-06-01T10:00:00.000Z', '2026-06-18T12:00:00.000Z', 'user_podiatrist_001', 'clinic_001'
),
(
  'patient_demo_002', 'PREMIUM-2026-002', 'Roberto', 'Silva', '1972-11-08', 'male', 'INE-773311', NULL,
  '5551002002', 'roberto.silva@example.com', 'Calle Insurgentes 45', 'Ciudad de México', '03100', '[]',
  '{"allergies":[],"medications":["Metformina"],"conditions":[]}',
  '{"given":true,"date":"2026-06-05T11:00:00.000Z","consentedToVersion":1}',
  'clinical_record', 1718841600000, 2348985600000, 0,
  '2026-06-05T11:00:00.000Z', '2026-06-18T12:00:00.000Z', 'user_podiatrist_001', 'clinic_001'
),
(
  'patient_demo_003', 'IND-2026-001', 'Carmen', 'Delgado', '1990-07-22', 'female', 'INE-665544', 'DELC900722MDFLRR08',
  '5551002003', 'carmen.delgado@example.com', NULL, NULL, NULL, '[]',
  '{"allergies":[],"medications":[],"conditions":[]}',
  '{"given":true,"date":"2026-06-10T09:00:00.000Z","consentedToVersion":1}',
  'clinical_record', 1718841600000, 2348985600000, 0,
  '2026-06-10T09:00:00.000Z', '2026-06-18T12:00:00.000Z', 'user_podiatrist_010', NULL
);

INSERT OR IGNORE INTO clinical_sessions (
  id, patient_id, session_date, session_type, diagnosis, treatment, notes,
  retention_category, last_clinical_act_at, retain_until, legal_hold, credits_used,
  created_by, created_at, updated_at, clinic_id
) VALUES
(
  'session_demo_001', 'patient_demo_001', '2026-06-15', 'routine', 'Onicocriptosis bilateral', 'Avance de uña encarnada',
  '{"status":"completed","completedAt":"2026-06-15T16:30:00.000Z","anamnesis":"Paciente refiere dolor en 1er dedo pie derecho desde hace 2 semanas.","physicalExamination":"Eritema perioníquico leve.","diagnosis":"Onicocriptosis bilateral","treatmentPlan":"Desbridamiento, educación en corte de uñas.","clinicalNotes":"Control en 3 semanas.","footType":"Egipcio","archType":"Plano","sweatDisorders":[{"id":"bromhidrosis","present":false,"notes":""},{"id":"hiperhidrosis","present":true,"notes":"Plantas húmedas"},{"id":"anhidrosis","present":false,"notes":""}],"limbAssessment":[{"id":"edema","left":false,"right":false,"notes":""},{"id":"xerosis","left":true,"right":true,"notes":""},{"id":"varices","left":false,"right":false,"notes":""},{"id":"dermatomycosis","left":false,"right":false,"notes":""}],"helomas":[{"id":"interphalangeal","present":true,"locationLeft":"3er metatarsiano","locationRight":"","notes":""},{"id":"interdigital","present":false,"locationLeft":"","locationRight":"","notes":""},{"id":"dorsal_fifth","present":false,"locationLeft":"","locationRight":"","notes":""}],"digitalAlterations":[{"id":"hallux_valgus","present":false,"locationLeft":"","locationRight":""},{"id":"fifth_varus","present":false,"locationLeft":"","locationRight":""},{"id":"claw_toes","present":true,"locationLeft":"","locationRight":"2-3"}],"onychopathies":[{"id":"anoniquia","present":false,"toesLeft":"","toesRight":""},{"id":"microniquia","present":false,"toesLeft":"","toesRight":""},{"id":"onicolisis","present":false,"toesLeft":"","toesRight":""},{"id":"onicauxis","present":false,"toesLeft":"","toesRight":""},{"id":"onicocriptosis","present":true,"toesLeft":"","toesRight":"1"},{"id":"onicogriptosis","present":false,"toesLeft":"","toesRight":""},{"id":"onicofosis","present":false,"toesLeft":"","toesRight":""},{"id":"paquioniquia","present":false,"toesLeft":"","toesRight":""},{"id":"onicomicosis","present":false,"toesLeft":"","toesRight":""}],"customSections":{}}',
  'clinical_record', 1718467200000, 2348611200000, 0, 1,
  'user_podiatrist_001', '2026-06-15T16:00:00.000Z', '2026-06-15T16:30:00.000Z', 'clinic_001'
),
(
  'session_demo_002', 'patient_demo_002', '2026-06-18', 'routine', NULL, NULL,
  '{"status":"draft","anamnesis":"Primera consulta por dolor plantar.","physicalExamination":"","diagnosis":"","treatmentPlan":"","clinicalNotes":"","footType":"Griego","archType":"Cavo","sweatDisorders":[{"id":"bromhidrosis","present":false,"notes":""},{"id":"hiperhidrosis","present":false,"notes":""},{"id":"anhidrosis","present":false,"notes":""}],"limbAssessment":[{"id":"edema","left":false,"right":false,"notes":""},{"id":"xerosis","left":false,"right":false,"notes":""},{"id":"varices","left":false,"right":false,"notes":""},{"id":"dermatomycosis","left":false,"right":false,"notes":""}],"helomas":[{"id":"interphalangeal","present":false,"locationLeft":"","locationRight":"","notes":""},{"id":"interdigital","present":false,"locationLeft":"","locationRight":"","notes":""},{"id":"dorsal_fifth","present":false,"locationLeft":"","locationRight":"","notes":""}],"digitalAlterations":[{"id":"hallux_valgus","present":false,"locationLeft":"","locationRight":""},{"id":"fifth_varus","present":false,"locationLeft":"","locationRight":""},{"id":"claw_toes","present":false,"locationLeft":"","locationRight":""}],"onychopathies":[{"id":"anoniquia","present":false,"toesLeft":"","toesRight":""},{"id":"microniquia","present":false,"toesLeft":"","toesRight":""},{"id":"onicolisis","present":false,"toesLeft":"","toesRight":""},{"id":"onicauxis","present":false,"toesLeft":"","toesRight":""},{"id":"onicocriptosis","present":false,"toesLeft":"","toesRight":""},{"id":"onicogriptosis","present":false,"toesLeft":"","toesRight":""},{"id":"onicofosis","present":false,"toesLeft":"","toesRight":""},{"id":"paquioniquia","present":false,"toesLeft":"","toesRight":""},{"id":"onicomicosis","present":false,"toesLeft":"","toesRight":""}],"customSections":{}}',
  'clinical_record', NULL, NULL, 0, 0,
  'user_podiatrist_001', '2026-06-18T10:00:00.000Z', '2026-06-18T10:00:00.000Z', 'clinic_001'
);
