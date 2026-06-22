/**
 * Reinicia la base D1 local: borra estado Wrangler, aplica migraciones y carga mocks.
 *
 * Uso: npm run db:reset:local
 * Luego: npm run dev
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const d1State = path.join(root, '.wrangler', 'state', 'v3', 'd1');

const wrangler = `node "${path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js')}"`;

function run(cmd, label) {
  console.log(`\n▶ ${label}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit', shell: true });
}

console.log('=== PodoAdmin: reinicio BD local + mocks ===\n');

if (fs.existsSync(d1State)) {
  fs.rmSync(d1State, { recursive: true, force: true });
  console.log('✓ Eliminado:', d1State);
} else {
  console.log('○ No había BD local previa (ok en primer arranque)');
}

run(`${wrangler} d1 migrations apply DB --local`, 'Migraciones D1 (--local)');
run('npm run db:seed:local', 'Seed usuarios, clínicas, suscripciones mock');

console.log('\n=== Listo ===');
console.log('Inicia la app: npm run dev');
console.log('Credenciales: docs/DEV_MOCK_RESET.md\n');
