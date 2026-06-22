/**
 * Bloquea el seed mock en D1 remoto salvo confirmación explícita.
 * Uso intencional (solo entornos de staging controlados):
 *   CONFIRM_PROD_SEED=1 npm run db:seed:remote
 */
const { execSync } = require('child_process');
const path = require('path');

if (process.env.CONFIRM_PROD_SEED !== '1') {
  console.error('❌ Bloqueado: no se cargan usuarios mock en D1 remoto por defecto.');
  console.error('   En producción usa migraciones + create-super-admin (sin seed mock).');
  console.error('   Si es un staging controlado: CONFIRM_PROD_SEED=1 npm run db:seed:remote');
  process.exit(1);
}

const root = path.join(__dirname, '..');
const run = (file) => {
  execSync(`npx wrangler d1 execute DB --remote --file=${file}`, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
};

console.warn('⚠️  Aplicando seed MOCK en D1 remoto (CONFIRM_PROD_SEED=1)...');
run('scripts/seed-mock-users.sql');
run('scripts/seed-clinics.sql');
console.log('✅ Seed remoto completado.');
