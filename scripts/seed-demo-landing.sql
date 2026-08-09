-- Datos de demo para capturas de la landing (agenda, cobros y analiticas con volumen).
--
-- Existe porque el seed base solo carga 3 pacientes y 2 sesiones: con eso el panel
-- sale en 0% de ocupacion y $0.00 de ventas, que no sirve para material de marketing.
-- Todo es ficticio a proposito — nunca capturar la landing con datos de pacientes reales.
--
-- Nombres de servicio en ingles porque las capturas se graban con la UI en ingles.
-- Fechas ancladas a agosto 2026 (dias habiles) para que el mes en curso tenga volumen.
--
-- Uso: npx wrangler d1 execute DB --local --file=scripts/seed-demo-landing.sql

-- Servicios con tarifa (clinic_001)
INSERT OR IGNORE INTO services (id, clinic_id, name, description, duration_minutes, cost, is_active, created_at, updated_at)
VALUES
  ('svc_en_cons',     'clinic_001', 'General Consultation',       'Initial assessment and diagnosis',   30,  50.00, 1, datetime('now'), datetime('now')),
  ('svc_en_callus',   'clinic_001', 'Callus Removal',             'Callus treatment and removal',       45,  75.00, 1, datetime('now'), datetime('now')),
  ('svc_en_wart',     'clinic_001', 'Plantar Wart Treatment',     'Specialised plantar wart treatment', 60, 100.00, 1, datetime('now'), datetime('now')),
  ('svc_en_ingrown',  'clinic_001', 'Ingrown Toenail Correction', 'Ingrown nail correction',            50,  85.00, 1, datetime('now'), datetime('now')),
  ('svc_en_diabetic', 'clinic_001', 'Diabetic Foot Check',        'Preventive diabetic foot screening', 40,  90.00, 1, datetime('now'), datetime('now')),
  ('svc_en_ortho',    'clinic_001', 'Custom Orthotics Fitting',   'Measurement and orthotics fitting',  60, 180.00, 1, datetime('now'), datetime('now'));

-- Pacientes adicionales del podologo demo (user_podiatrist_001 / clinic_001)
INSERT OR IGNORE INTO patients (
  id, folio, first_name, last_name, date_of_birth, gender, id_number, curp,
  phone, email, address, city, postal_code, clinical_alerts_json, medical_history, consent,
  retention_category, last_clinical_act_at, retain_until, legal_hold,
  created_at, updated_at, created_by, clinic_id
) VALUES
  ('patient_demo_010','PREMIUM-2026-010','Elena','Navarro','1979-05-22','female','INE-100010',NULL,'5551002010','elena.navarro@example.com','Av. Juarez 210','Ciudad de Mexico','06050','[]','{"allergies":[],"medications":[],"conditions":[]}','{"given":true,"date":"2026-07-02T10:00:00.000Z","consentedToVersion":1}','clinical_record',1751450400000,2381000000000,0,'2026-07-02T10:00:00.000Z','2026-08-01T10:00:00.000Z','user_podiatrist_001','clinic_001'),
  ('patient_demo_011','PREMIUM-2026-011','Miguel','Torres','1968-09-14','male','INE-100011',NULL,'5551002011','miguel.torres@example.com','Calle Madero 18','Ciudad de Mexico','06000','[]','{"allergies":[],"medications":["Metformina"],"conditions":["Diabetes tipo 2"]}','{"given":true,"date":"2026-07-04T10:00:00.000Z","consentedToVersion":1}','clinical_record',1751623200000,2381000000000,0,'2026-07-04T10:00:00.000Z','2026-08-01T10:00:00.000Z','user_podiatrist_001','clinic_001'),
  ('patient_demo_012','PREMIUM-2026-012','Patricia','Ruiz','1990-01-30','female','INE-100012',NULL,'5551002012','patricia.ruiz@example.com','Av. Chapultepec 77','Ciudad de Mexico','06700','[]','{"allergies":[],"medications":[],"conditions":[]}','{"given":true,"date":"2026-07-08T10:00:00.000Z","consentedToVersion":1}','clinical_record',1751968800000,2381000000000,0,'2026-07-08T10:00:00.000Z','2026-08-01T10:00:00.000Z','user_podiatrist_001','clinic_001'),
  ('patient_demo_013','PREMIUM-2026-013','Andres','Vega','1983-11-05','male','INE-100013',NULL,'5551002013','andres.vega@example.com','Calle Colima 33','Ciudad de Mexico','06760','[]','{"allergies":[],"medications":[],"conditions":[]}','{"given":true,"date":"2026-07-11T10:00:00.000Z","consentedToVersion":1}','clinical_record',1752228000000,2381000000000,0,'2026-07-11T10:00:00.000Z','2026-08-01T10:00:00.000Z','user_podiatrist_001','clinic_001'),
  ('patient_demo_014','PREMIUM-2026-014','Sofia','Ramos','1995-06-19','female','INE-100014',NULL,'5551002014','sofia.ramos@example.com','Av. Insurgentes 900','Ciudad de Mexico','03100','[]','{"allergies":["Latex"],"medications":[],"conditions":[]}','{"given":true,"date":"2026-07-15T10:00:00.000Z","consentedToVersion":1}','clinical_record',1752573600000,2381000000000,0,'2026-07-15T10:00:00.000Z','2026-08-01T10:00:00.000Z','user_podiatrist_001','clinic_001'),
  ('patient_demo_015','PREMIUM-2026-015','Javier','Ortega','1974-02-27','male','INE-100015',NULL,'5551002015','javier.ortega@example.com','Calle Durango 12','Ciudad de Mexico','06700','[]','{"allergies":[],"medications":[],"conditions":[]}','{"given":true,"date":"2026-07-18T10:00:00.000Z","consentedToVersion":1}','clinical_record',1752832800000,2381000000000,0,'2026-07-18T10:00:00.000Z','2026-08-01T10:00:00.000Z','user_podiatrist_001','clinic_001'),
  ('patient_demo_016','PREMIUM-2026-016','Lucia','Herrera','1988-08-03','female','INE-100016',NULL,'5551002016','lucia.herrera@example.com','Av. Reforma 455','Ciudad de Mexico','06600','[]','{"allergies":[],"medications":[],"conditions":[]}','{"given":true,"date":"2026-07-22T10:00:00.000Z","consentedToVersion":1}','clinical_record',1753178400000,2381000000000,0,'2026-07-22T10:00:00.000Z','2026-08-01T10:00:00.000Z','user_podiatrist_001','clinic_001'),
  ('patient_demo_017','PREMIUM-2026-017','Daniel','Cruz','1981-12-11','male','INE-100017',NULL,'5551002017','daniel.cruz@example.com','Calle Sinaloa 64','Ciudad de Mexico','06700','[]','{"allergies":[],"medications":[],"conditions":[]}','{"given":true,"date":"2026-07-25T10:00:00.000Z","consentedToVersion":1}','clinical_record',1753438000000,2381000000000,0,'2026-07-25T10:00:00.000Z','2026-08-01T10:00:00.000Z','user_podiatrist_001','clinic_001');

-- Citas de agosto 2026. Completadas (1-7 ago) dan ventas del mes; futuras dan ocupacion.
-- appt_demo_today_02 queda pendiente de confirmar a proposito: es el "antes" del clip del paso 02.
INSERT OR IGNORE INTO appointments (
  id, patient_id, session_date, session_time, reason, status, notes, created_by, created_at, updated_at,
  clinic_id, check_in_status, retention_category, legal_hold,
  confirm_token, confirmation_sent_at, confirmation_responded_at,
  service_id, cost, duration_minutes, service_label
) VALUES
  ('appt_demo_001','patient_demo_001','2026-08-03','09:00','Diabetic foot check','completed',NULL,'user_podiatrist_001','2026-07-28T10:00:00.000Z','2026-08-03T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-02T09:00:00.000Z','2026-08-02T11:20:00.000Z','svc_en_diabetic',90.00,40,'Diabetic Foot Check'),
  ('appt_demo_002','patient_demo_011','2026-08-03','10:30','Callus removal','completed',NULL,'user_podiatrist_001','2026-07-28T10:00:00.000Z','2026-08-03T11:30:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-02T09:00:00.000Z','2026-08-02T10:05:00.000Z','svc_en_callus',75.00,45,'Callus Removal'),
  ('appt_demo_003','patient_demo_012','2026-08-04','09:30','General consultation','completed',NULL,'user_podiatrist_001','2026-07-29T10:00:00.000Z','2026-08-04T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-03T09:00:00.000Z','2026-08-03T09:40:00.000Z','svc_en_cons',50.00,30,'General Consultation'),
  ('appt_demo_004','patient_demo_013','2026-08-04','11:00','Ingrown toenail correction','completed',NULL,'user_podiatrist_001','2026-07-29T10:00:00.000Z','2026-08-04T11:50:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-03T09:00:00.000Z','2026-08-03T12:10:00.000Z','svc_en_ingrown',85.00,50,'Ingrown Toenail Correction'),
  ('appt_demo_005','patient_demo_002','2026-08-05','09:00','Plantar wart treatment','completed',NULL,'user_podiatrist_001','2026-07-30T10:00:00.000Z','2026-08-05T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-04T09:00:00.000Z','2026-08-04T09:15:00.000Z','svc_en_wart',100.00,60,'Plantar Wart Treatment'),
  ('appt_demo_006','patient_demo_014','2026-08-05','11:30','Custom orthotics fitting','completed',NULL,'user_podiatrist_001','2026-07-30T10:00:00.000Z','2026-08-05T12:30:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-04T09:00:00.000Z','2026-08-04T10:00:00.000Z','svc_en_ortho',180.00,60,'Custom Orthotics Fitting'),
  ('appt_demo_007','patient_demo_015','2026-08-06','10:00','Callus removal','completed',NULL,'user_podiatrist_001','2026-07-31T10:00:00.000Z','2026-08-06T10:45:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-05T09:00:00.000Z','2026-08-05T09:30:00.000Z','svc_en_callus',75.00,45,'Callus Removal'),
  ('appt_demo_008','patient_demo_016','2026-08-06','12:00','General consultation','completed',NULL,'user_podiatrist_001','2026-07-31T10:00:00.000Z','2026-08-06T12:30:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-05T09:00:00.000Z','2026-08-05T09:20:00.000Z','svc_en_cons',50.00,30,'General Consultation'),
  ('appt_demo_009','patient_demo_017','2026-08-07','09:30','Diabetic foot check','completed',NULL,'user_podiatrist_001','2026-08-01T10:00:00.000Z','2026-08-07T10:10:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-06T09:00:00.000Z','2026-08-06T09:45:00.000Z','svc_en_diabetic',90.00,40,'Diabetic Foot Check'),
  ('appt_demo_010','patient_demo_010','2026-08-07','11:00','Ingrown toenail correction','completed',NULL,'user_podiatrist_001','2026-08-01T10:00:00.000Z','2026-08-07T11:50:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-06T09:00:00.000Z','2026-08-06T10:30:00.000Z','svc_en_ingrown',85.00,50,'Ingrown Toenail Correction'),
  ('appt_demo_011','patient_demo_012','2026-08-07','13:00','Callus removal','no_show',NULL,'user_podiatrist_001','2026-08-01T10:00:00.000Z','2026-08-07T13:40:00.000Z','clinic_001','none','clinical_record',0,NULL,'2026-08-06T09:00:00.000Z',NULL,'svc_en_callus',75.00,45,'Callus Removal'),

  ('appt_demo_today_01','patient_demo_001','2026-08-09','09:00','Diabetic foot check','confirmed',NULL,'user_podiatrist_001','2026-08-05T10:00:00.000Z','2026-08-08T09:10:00.000Z','clinic_001','none','clinical_record',0,'tok_demo_t1','2026-08-08T09:00:00.000Z','2026-08-08T09:10:00.000Z','svc_en_diabetic',90.00,40,'Diabetic Foot Check'),
  ('appt_demo_today_02','patient_demo_014','2026-08-09','10:00','Callus removal','scheduled',NULL,'user_podiatrist_001','2026-08-05T10:00:00.000Z','2026-08-08T09:00:00.000Z','clinic_001','none','clinical_record',0,'tok_demo_t2','2026-08-08T09:00:00.000Z',NULL,'svc_en_callus',75.00,45,'Callus Removal'),
  ('appt_demo_today_03','patient_demo_011','2026-08-09','11:30','Custom orthotics fitting','confirmed',NULL,'user_podiatrist_001','2026-08-05T10:00:00.000Z','2026-08-08T10:20:00.000Z','clinic_001','none','clinical_record',0,'tok_demo_t3','2026-08-08T09:00:00.000Z','2026-08-08T10:20:00.000Z','svc_en_ortho',180.00,60,'Custom Orthotics Fitting'),
  ('appt_demo_today_04','patient_demo_016','2026-08-09','13:00','General consultation','scheduled',NULL,'user_podiatrist_001','2026-08-05T10:00:00.000Z','2026-08-08T09:00:00.000Z','clinic_001','none','clinical_record',0,'tok_demo_t4','2026-08-08T09:00:00.000Z',NULL,'svc_en_cons',50.00,30,'General Consultation'),

  ('appt_demo_101','patient_demo_013','2026-08-10','09:00','General consultation','confirmed',NULL,'user_podiatrist_001','2026-08-06T10:00:00.000Z','2026-08-08T11:00:00.000Z','clinic_001','none','clinical_record',0,'tok_demo_101','2026-08-08T09:00:00.000Z','2026-08-08T11:00:00.000Z','svc_en_cons',50.00,30,'General Consultation'),
  ('appt_demo_102','patient_demo_015','2026-08-10','10:30','Plantar wart treatment','confirmed',NULL,'user_podiatrist_001','2026-08-06T10:00:00.000Z','2026-08-08T11:05:00.000Z','clinic_001','none','clinical_record',0,'tok_demo_102','2026-08-08T09:00:00.000Z','2026-08-08T11:05:00.000Z','svc_en_wart',100.00,60,'Plantar Wart Treatment'),
  ('appt_demo_103','patient_demo_017','2026-08-11','09:30','Callus removal','scheduled',NULL,'user_podiatrist_001','2026-08-06T10:00:00.000Z','2026-08-06T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,NULL,NULL,'svc_en_callus',75.00,45,'Callus Removal'),
  ('appt_demo_104','patient_demo_010','2026-08-11','11:00','Diabetic foot check','scheduled',NULL,'user_podiatrist_001','2026-08-06T10:00:00.000Z','2026-08-06T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,NULL,NULL,'svc_en_diabetic',90.00,40,'Diabetic Foot Check'),
  ('appt_demo_105','patient_demo_002','2026-08-12','09:00','Ingrown toenail correction','scheduled',NULL,'user_podiatrist_001','2026-08-07T10:00:00.000Z','2026-08-07T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,NULL,NULL,'svc_en_ingrown',85.00,50,'Ingrown Toenail Correction'),
  ('appt_demo_106','patient_demo_012','2026-08-12','10:30','Custom orthotics fitting','scheduled',NULL,'user_podiatrist_001','2026-08-07T10:00:00.000Z','2026-08-07T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,NULL,NULL,'svc_en_ortho',180.00,60,'Custom Orthotics Fitting'),
  ('appt_demo_107','patient_demo_014','2026-08-13','09:00','General consultation','scheduled',NULL,'user_podiatrist_001','2026-08-07T10:00:00.000Z','2026-08-07T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,NULL,NULL,'svc_en_cons',50.00,30,'General Consultation'),
  ('appt_demo_108','patient_demo_016','2026-08-13','11:00','Callus removal','scheduled',NULL,'user_podiatrist_001','2026-08-07T10:00:00.000Z','2026-08-07T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,NULL,NULL,'svc_en_callus',75.00,45,'Callus Removal'),
  ('appt_demo_109','patient_demo_011','2026-08-14','09:30','Diabetic foot check','scheduled',NULL,'user_podiatrist_001','2026-08-07T10:00:00.000Z','2026-08-07T10:00:00.000Z','clinic_001','none','clinical_record',0,NULL,NULL,NULL,'svc_en_diabetic',90.00,40,'Diabetic Foot Check'),
  ('appt_demo_110','patient_demo_013','2026-08-14','11:30','Plantar wart treatment','cancelled',NULL,'user_podiatrist_001','2026-08-07T10:00:00.000Z','2026-08-08T08:00:00.000Z','clinic_001','none','clinical_record',0,NULL,NULL,NULL,'svc_en_wart',100.00,60,'Plantar Wart Treatment');

-- Cobros. Las ventas del panel salen de checkout_handoffs pagados (no de appointments.cost),
-- asi que cada cita completada necesita su fila pagada para que el mes muestre importe.
-- Las dos 'ready_for_payment' alimentan "Pending collections". Importes en centavos, MXN.
INSERT OR IGNORE INTO checkout_handoffs (
  id, clinic_id, podiatrist_id, patient_id, session_id, appointment_id,
  amount_cents, currency, notes, status, created_by, paid_at, paid_by, created_at, updated_at, payment_method
) VALUES
  ('chk_demo_001','clinic_001','user_podiatrist_001','patient_demo_001',NULL,'appt_demo_001', 9000,'MXN',NULL,'paid','user_podiatrist_001','2026-08-03T10:05:00.000Z','user_podiatrist_001','2026-08-03T09:40:00.000Z','2026-08-03T10:05:00.000Z','card'),
  ('chk_demo_002','clinic_001','user_podiatrist_001','patient_demo_011',NULL,'appt_demo_002', 7500,'MXN',NULL,'paid','user_podiatrist_001','2026-08-03T11:35:00.000Z','user_podiatrist_001','2026-08-03T11:20:00.000Z','2026-08-03T11:35:00.000Z','cash'),
  ('chk_demo_003','clinic_001','user_podiatrist_001','patient_demo_012',NULL,'appt_demo_003', 5000,'MXN',NULL,'paid','user_podiatrist_001','2026-08-04T10:05:00.000Z','user_podiatrist_001','2026-08-04T09:55:00.000Z','2026-08-04T10:05:00.000Z','card'),
  ('chk_demo_004','clinic_001','user_podiatrist_001','patient_demo_013',NULL,'appt_demo_004', 8500,'MXN',NULL,'paid','user_podiatrist_001','2026-08-04T11:55:00.000Z','user_podiatrist_001','2026-08-04T11:45:00.000Z','2026-08-04T11:55:00.000Z','transfer'),
  ('chk_demo_005','clinic_001','user_podiatrist_001','patient_demo_002',NULL,'appt_demo_005',10000,'MXN',NULL,'paid','user_podiatrist_001','2026-08-05T10:05:00.000Z','user_podiatrist_001','2026-08-05T09:55:00.000Z','2026-08-05T10:05:00.000Z','card'),
  ('chk_demo_006','clinic_001','user_podiatrist_001','patient_demo_014',NULL,'appt_demo_006',18000,'MXN',NULL,'paid','user_podiatrist_001','2026-08-05T12:35:00.000Z','user_podiatrist_001','2026-08-05T12:25:00.000Z','2026-08-05T12:35:00.000Z','card'),
  ('chk_demo_007','clinic_001','user_podiatrist_001','patient_demo_015',NULL,'appt_demo_007', 7500,'MXN',NULL,'paid','user_podiatrist_001','2026-08-06T10:50:00.000Z','user_podiatrist_001','2026-08-06T10:40:00.000Z','2026-08-06T10:50:00.000Z','cash'),
  ('chk_demo_008','clinic_001','user_podiatrist_001','patient_demo_016',NULL,'appt_demo_008', 5000,'MXN',NULL,'paid','user_podiatrist_001','2026-08-06T12:35:00.000Z','user_podiatrist_001','2026-08-06T12:25:00.000Z','2026-08-06T12:35:00.000Z','card'),
  ('chk_demo_009','clinic_001','user_podiatrist_001','patient_demo_017',NULL,'appt_demo_009', 9000,'MXN',NULL,'paid','user_podiatrist_001','2026-08-07T10:15:00.000Z','user_podiatrist_001','2026-08-07T10:05:00.000Z','2026-08-07T10:15:00.000Z','transfer'),
  ('chk_demo_010','clinic_001','user_podiatrist_001','patient_demo_010',NULL,'appt_demo_010', 8500,'MXN',NULL,'paid','user_podiatrist_001','2026-08-07T11:55:00.000Z','user_podiatrist_001','2026-08-07T11:45:00.000Z','2026-08-07T11:55:00.000Z','card'),
  ('chk_demo_p01','clinic_001','user_podiatrist_001','patient_demo_001',NULL,'appt_demo_today_01', 9000,'MXN',NULL,'ready_for_payment','user_podiatrist_001',NULL,NULL,'2026-08-09T09:40:00.000Z','2026-08-09T09:40:00.000Z',NULL),
  ('chk_demo_p02','clinic_001','user_podiatrist_001','patient_demo_011',NULL,'appt_demo_today_03',18000,'MXN',NULL,'ready_for_payment','user_podiatrist_001',NULL,NULL,'2026-08-09T12:30:00.000Z','2026-08-09T12:30:00.000Z',NULL);

-- Sesiones clinicas de agosto, una por cita completada. Sin estas, "Sessions this month"
-- queda en 0 y la ficha clinica del paso 03 no tiene nada que mostrar.
-- Diagnostico y tratamiento en ingles para que la captura sea coherente con la UI.
INSERT OR IGNORE INTO clinical_sessions (
  id, patient_id, session_date, session_type, diagnosis, treatment, notes, credits_used,
  created_by, created_at, updated_at, clinic_id, retention_category, last_clinical_act_at, retain_until, legal_hold
) VALUES
  ('session_demo_101','patient_demo_001','2026-08-03','routine','Diabetic foot at risk, grade 1','Preventive debridement and offloading advice. Protective footwear reviewed.','Sensitivity preserved on monofilament test.',1,'user_podiatrist_001','2026-08-03T10:00:00.000Z','2026-08-03T10:00:00.000Z','clinic_001','clinical_record',1785495600000,2381000000000,0),
  ('session_demo_102','patient_demo_011','2026-08-03','routine','Plantar hyperkeratosis','Mechanical debridement of callus on first metatarsal head.','Recommended review in 8 weeks.',1,'user_podiatrist_001','2026-08-03T11:20:00.000Z','2026-08-03T11:20:00.000Z','clinic_001','clinical_record',1785500000000,2381000000000,0),
  ('session_demo_103','patient_demo_012','2026-08-04','routine','Initial assessment, no acute findings','Baseline podiatric assessment and gait observation.',NULL,1,'user_podiatrist_001','2026-08-04T09:55:00.000Z','2026-08-04T09:55:00.000Z','clinic_001','clinical_record',1785582000000,2381000000000,0),
  ('session_demo_104','patient_demo_013','2026-08-04','routine','Onychocryptosis, right hallux','Partial nail avulsion with lateral matrixectomy. Sterile dressing applied.','Dressing change scheduled in 48 hours.',1,'user_podiatrist_001','2026-08-04T11:45:00.000Z','2026-08-04T11:45:00.000Z','clinic_001','clinical_record',1785588000000,2381000000000,0),
  ('session_demo_105','patient_demo_002','2026-08-05','routine','Plantar verruca, left forefoot','Cryotherapy applied. Second session planned.','Lesion reduced compared with previous visit.',1,'user_podiatrist_001','2026-08-05T09:55:00.000Z','2026-08-05T09:55:00.000Z','clinic_001','clinical_record',1785668400000,2381000000000,0),
  ('session_demo_106','patient_demo_014','2026-08-05','routine','Pes planus with medial arch collapse','Foot measurement taken and custom orthotics fitted.','Review fit in 3 weeks.',1,'user_podiatrist_001','2026-08-05T12:25:00.000Z','2026-08-05T12:25:00.000Z','clinic_001','clinical_record',1785675000000,2381000000000,0),
  ('session_demo_107','patient_demo_015','2026-08-06','routine','Recurrent plantar callus','Debridement and pressure redistribution padding.',NULL,1,'user_podiatrist_001','2026-08-06T10:40:00.000Z','2026-08-06T10:40:00.000Z','clinic_001','clinical_record',1785754800000,2381000000000,0),
  ('session_demo_108','patient_demo_017','2026-08-07','routine','Diabetic foot screening, low risk','Vascular and neurological screening. No ulceration found.','Annual review recommended.',1,'user_podiatrist_001','2026-08-07T10:05:00.000Z','2026-08-07T10:05:00.000Z','clinic_001','clinical_record',1785841200000,2381000000000,0);

-- El estado de la sesion no es una columna: vive dentro de notes como JSON y se lee con
-- json_extract(notes,'$.status') (ver buildSessionStatusCondition). Con notes en texto plano
-- json_extract devuelve NULL y la app las pinta todas como "Draft", que en una captura de
-- marketing da impresion de trabajo a medias. Va como UPDATE para que corrija tambien las
-- filas que ya existan (los INSERT de arriba son OR IGNORE).
UPDATE clinical_sessions SET notes = json_object(
  'status','completed',
  'completedAt', session_date || 'T12:00:00.000Z',
  'diagnosis', diagnosis,
  'treatmentPlan', treatment,
  'clinicalNotes', 'Reviewed and signed off.'
) WHERE id LIKE 'session_demo_1%';
