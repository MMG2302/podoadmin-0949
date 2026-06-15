/**
 * Reinicia la base D1 local: borra estado Wrangler, aplica migraciones y carga mocks.
 * Uso: npm run db:reset:local
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
  console.log('✓ BD local eliminada');
}

run(`${wrangler} d1 migrations apply DB --local`, 'Migraciones');
run('npm run db:seed:local', 'Seeds mock');

console.log('\n=== Listo ===\nInicia: node node_modules/vite/bin/vite.js\n');
