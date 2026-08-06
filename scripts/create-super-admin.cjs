/**
 * Genera SQL para crear UN super_admin (útil en producción cuando aún no hay ninguno).
 *
 * Uso:
 *   node scripts/create-super-admin.cjs "tu@email.com" "TuPasswordSegura" "Tu Nombre"
 *
 * IMPORTANTE: Pon la contraseña entre comillas si tiene caracteres especiales (*, $, !, etc.).
 *
 * La contraseña es obligatoria (mín. 12 caracteres): no hay valor por defecto, para que
 * la cuenta más privilegiada no pueda quedar creada con una clave que está en el repo.
 * El email por defecto es admin@podoraa.com si no se indica otro.
 *
 * DESPUÉS de generar, DEBES aplicar el SQL a la base de datos:
 *   Local:  bunx wrangler d1 execute DB --local --file=scripts/super-admin.sql
 *   Remoto: bunx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
 * Sin este paso no tendrás acceso (el script solo crea el archivo).
 *
 * El archivo generado está en .gitignore (no commitear: contiene hash de contraseña).
 */

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const defaultEmail = 'admin@podoraa.com';
const MIN_PASSWORD_LEN = 12;

function esc(s) {
  if (s == null) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function main() {
  const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL || defaultEmail;
  // Sin contraseña por defecto: la cuenta con más privilegios del sistema no puede
  // quedar creada con una clave conocida por estar en el repositorio.
  const password = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD;
  const name = process.argv[4] || process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!password || password.length < MIN_PASSWORD_LEN) {
    console.error(
      `\nERROR: hay que indicar una contraseña de al menos ${MIN_PASSWORD_LEN} caracteres.\n\n` +
        '  node scripts/create-super-admin.cjs "tu@email.com" "TuContraseñaLarga" "Tu Nombre"\n\n' +
        'o vía SUPER_ADMIN_PASSWORD. No hay valor por defecto a propósito.\n'
    );
    process.exit(1);
  }

  const emailLower = email.toLowerCase().trim();
  const id = 'user_super_admin';
  const now = new Date().toISOString();
  const hash = await bcrypt.hash(password, 12);

  const lines = [
    '-- Super admin (un solo usuario). Generado con: node scripts/create-super-admin.cjs [email] [password] [name]',
    '-- Aplicar: wrangler d1 execute DB --local --file=scripts/super-admin.sql  (o --remote para producción)',
    '',
    `INSERT OR REPLACE INTO created_users (id, user_id, email, name, role, clinic_id, password, created_at, updated_at, created_by, is_blocked, is_banned, is_enabled, email_verified, terms_accepted, registration_source) VALUES (` +
      `${esc(id)}, ${esc(id)}, ${esc(emailLower)}, ${esc(name)}, 'super_admin', NULL, ${esc(hash)}, ${esc(now)}, ${esc(now)}, 'script', 0, 0, 1, 0, 0, 'admin');`,
    '',
    `INSERT OR REPLACE INTO user_credits (user_id, total_credits, used_credits, created_at, updated_at) VALUES (${esc(id)}, 0, 0, ${esc(now)}, ${esc(now)});`,
  ];

  const outPath = path.join(__dirname, 'super-admin.sql');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log('Generado:', outPath);
  console.log('Usuario:', emailLower, '| Rol: super_admin');
  console.log('');
  console.log('>>> DEBES APLICAR EL SQL A LA BASE DE DATOS (sin esto no tendrás acceso):');
  console.log('    Local:  bunx wrangler d1 execute DB --local --file=scripts/super-admin.sql');
  console.log('    Remoto: bunx wrangler d1 execute DB --remote --file=scripts/super-admin.sql');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
