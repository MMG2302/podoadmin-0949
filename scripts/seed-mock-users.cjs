/**
 * Genera el SQL de seed de usuarios mock (solo para uso local).
 * Ejecutar: node scripts/seed-mock-users.cjs
 * Luego aplicar en local: bun db:seed:local (o wrangler d1 execute DB --local --file=scripts/seed-mock-users.sql)
 *
 * Los usuarios mock no se aplican en db:migrate:remote; quedan solo en local.
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const MOCK_USERS = [
  { email: 'admin@podoadmin.com', password: 'admin123', id: 'user_super_admin', name: 'Super Admin', role: 'super_admin', clinicId: null },
  { email: 'support@podoadmin.com', password: 'support123', id: 'user_admin', name: 'Admin Support', role: 'admin', clinicId: null },
  { email: 'maria.fernandez@premium.com', password: 'manager123', id: 'user_clinic_admin_001', name: 'María Fernández', role: 'clinic_admin', clinicId: 'clinic_001' },
  { email: 'doctor1@premium.com', password: 'doctor123', id: 'user_podiatrist_001', name: 'Dr. Juan Pérez', role: 'podiatrist', clinicId: 'clinic_001' },
  { email: 'doctor2@premium.com', password: 'doctor123', id: 'user_podiatrist_002', name: 'Dra. Ana Martínez', role: 'podiatrist', clinicId: 'clinic_001' },
  { email: 'doctor3@premium.com', password: 'doctor123', id: 'user_podiatrist_003', name: 'Dr. Carlos López', role: 'podiatrist', clinicId: 'clinic_001' },
  { email: 'juan.garcia@centromedico.com', password: 'manager123', id: 'user_clinic_admin_002', name: 'Juan García', role: 'clinic_admin', clinicId: 'clinic_002' },
  { email: 'doctor1@centromedico.com', password: 'doctor123', id: 'user_podiatrist_004', name: 'Dra. Laura Sánchez', role: 'podiatrist', clinicId: 'clinic_002' },
  { email: 'doctor2@centromedico.com', password: 'doctor123', id: 'user_podiatrist_005', name: 'Dr. Miguel Torres', role: 'podiatrist', clinicId: 'clinic_002' },
  { email: 'doctor3@centromedico.com', password: 'doctor123', id: 'user_podiatrist_006', name: 'Dra. Elena Ruiz', role: 'podiatrist', clinicId: 'clinic_002' },
  { email: 'sofia.rodriguez@integralplus.com', password: 'manager123', id: 'user_clinic_admin_003', name: 'Sofía Rodríguez', role: 'clinic_admin', clinicId: 'clinic_003' },
  { email: 'doctor1@integralplus.com', password: 'doctor123', id: 'user_podiatrist_007', name: 'Dr. Roberto Díaz', role: 'podiatrist', clinicId: 'clinic_003' },
  { email: 'doctor2@integralplus.com', password: 'doctor123', id: 'user_podiatrist_008', name: 'Dra. Carmen Vega', role: 'podiatrist', clinicId: 'clinic_003' },
  { email: 'doctor3@integralplus.com', password: 'doctor123', id: 'user_podiatrist_009', name: 'Dr. Fernando Morales', role: 'podiatrist', clinicId: 'clinic_003' },
  { email: 'pablo.hernandez@gmail.com', password: 'doctor123', id: 'user_podiatrist_010', name: 'Dr. Pablo Hernández', role: 'podiatrist', clinicId: null },
  { email: 'lucia.santos@outlook.com', password: 'doctor123', id: 'user_podiatrist_011', name: 'Dra. Lucía Santos', role: 'podiatrist', clinicId: null },
  { email: 'andres.molina@yahoo.es', password: 'doctor123', id: 'user_podiatrist_012', name: 'Dr. Andrés Molina', role: 'podiatrist', clinicId: null },
  { email: 'beatriz.ortiz@hotmail.com', password: 'doctor123', id: 'user_podiatrist_013', name: 'Dra. Beatriz Ortiz', role: 'podiatrist', clinicId: null },
];

function esc(s) {
  if (s == null) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function main() {
  const now = new Date().toISOString();
  const lines = [
    '-- Seed de usuarios mock (SOLO PARA USO LOCAL). Aplicar con: bun db:seed:local',
    '-- INSERT OR IGNORE evita duplicados. No se ejecuta en db:migrate:remote.',
    '',
  ];

  for (const u of MOCK_USERS) {
    const hash = await bcrypt.hash(u.password, 12);
    lines.push(
      `INSERT OR IGNORE INTO created_users (id, user_id, email, name, role, clinic_id, password, created_at, updated_at, created_by, is_blocked, is_banned, is_enabled, email_verified, terms_accepted, registration_source) VALUES (` +
      `${esc(u.id)}, ${esc(u.id)}, ${esc(u.email.toLowerCase())}, ${esc(u.name)}, ${esc(u.role)}, ${u.clinicId ? esc(u.clinicId) : 'NULL'}, ${esc(hash)}, ${esc(now)}, ${esc(now)}, 'seed_mock', 0, 0, 1, 0, 0, 'admin');`
    );
  }

  lines.push('');
  for (const u of MOCK_USERS) {
    lines.push(
      `INSERT OR IGNORE INTO user_credits (user_id, total_credits, used_credits, created_at, updated_at) VALUES (${esc(u.id)}, 0, 0, ${esc(now)}, ${esc(now)});`
    );
  }

  const outPath = path.join(__dirname, 'seed-mock-users.sql');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log('Generado:', outPath);
  console.log('Aplicar solo en local: bun db:seed:local');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
