#!/usr/bin/env node

/**
 * Configura variables del Worker: secretos y APP_BASE_URL en .dev.vars.
 * .env.example queda sin secretos (solo referencia opcional).
 */

import { randomBytes } from 'crypto';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const devVarsPath = join(rootDir, '.dev.vars');
const devVarsExamplePath = join(rootDir, '.dev.vars.example');
const envExamplePath = join(rootDir, '.env.example');

function generateSecret(length = 32) {
  return randomBytes(length).toString('base64');
}

let devVarsTemplate = '';
if (existsSync(devVarsExamplePath)) {
  devVarsTemplate = readFileSync(devVarsExamplePath, 'utf-8');
} else {
  devVarsTemplate = `JWT_SECRET=
REFRESH_TOKEN_SECRET=
CSRF_SECRET=

NODE_ENV=development
APP_BASE_URL=http://localhost:5173
`;
}

const jwtSecret = generateSecret(32);
const refreshTokenSecret = generateSecret(32);
const csrfSecret = generateSecret(32);

let devVarsContent = devVarsTemplate
  .replace(/JWT_SECRET=\s*$/m, `JWT_SECRET=${jwtSecret}`)
  .replace(/REFRESH_TOKEN_SECRET=\s*$/m, `REFRESH_TOKEN_SECRET=${refreshTokenSecret}`)
  .replace(/CSRF_SECRET=\s*$/m, `CSRF_SECRET=${csrfSecret}`);

if (!/APP_BASE_URL=/m.test(devVarsContent)) {
  devVarsContent += '\nAPP_BASE_URL=http://localhost:5173\n';
}

if (existsSync(devVarsPath)) {
  console.log('⚠️  El archivo .dev.vars ya existe.');
  console.log('Si continúas, se generarán nuevas claves secretas.');
  console.log('Esto invalidará todas las sesiones existentes.\n');

  const backupPath = join(rootDir, '.dev.vars.backup');
  if (!existsSync(backupPath)) {
    const existing = readFileSync(devVarsPath, 'utf-8');
    writeFileSync(backupPath, existing);
    console.log('✅ Backup creado en .dev.vars.backup\n');
  }
}

writeFileSync(devVarsPath, devVarsContent, 'utf-8');

console.log('✅ Archivo .dev.vars creado (Wrangler / Worker local)');
if (existsSync(envExamplePath)) {
  console.log('ℹ️  Secretos solo en .dev.vars — ver .env.example (sin secretos)');
}
console.log('\n📝 Variables generadas en .dev.vars:');
console.log(`   JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
console.log(`   REFRESH_TOKEN_SECRET: ${refreshTokenSecret.substring(0, 20)}...`);
console.log(`   CSRF_SECRET: ${csrfSecret.substring(0, 20)}...`);
console.log('\n⚠️  IMPORTANTE:');
console.log('   - No compartas estas claves');
console.log('   - No commitees .dev.vars al repositorio');
console.log('   - En producción: wrangler secret put JWT_SECRET (y análogos)');
console.log('   - APP_BASE_URL y ALLOWED_ORIGINS en wrangler.toml [vars]\n');
