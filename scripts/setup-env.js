#!/usr/bin/env node

/**
 * Script para configurar variables de entorno
 * Genera claves secretas seguras y crea archivo .env
 */

import { randomBytes } from 'crypto';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const envPath = join(rootDir, '.env');
const envExamplePath = join(rootDir, '.env.example');

// Generar clave secreta aleatoria
function generateSecret(length = 32) {
  return randomBytes(length).toString('base64');
}

// Leer .env.example si existe
let envTemplate = '';
if (existsSync(envExamplePath)) {
  envTemplate = readFileSync(envExamplePath, 'utf-8');
} else {
  // Template por defecto
  envTemplate = `# JWT Secrets
JWT_SECRET=
REFRESH_TOKEN_SECRET=
CSRF_SECRET=

# Environment
NODE_ENV=development

# Base URL
VITE_BASE_URL=http://localhost:5173

# IP Whitelist (opcional)
# IP_WHITELIST=192.168.1.1,10.0.0.0/8

# Email Service (opcional)
# SENDGRID_API_KEY=
# RESEND_API_KEY=
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=us-east-1
`;
}

// Generar claves secretas
const jwtSecret = generateSecret(32);
const refreshTokenSecret = generateSecret(32);
const csrfSecret = generateSecret(32);

// Reemplazar valores vacíos
let envContent = envTemplate
  .replace(/JWT_SECRET=\s*$/m, `JWT_SECRET=${jwtSecret}`)
  .replace(/REFRESH_TOKEN_SECRET=\s*$/m, `REFRESH_TOKEN_SECRET=${refreshTokenSecret}`)
  .replace(/CSRF_SECRET=\s*$/m, `CSRF_SECRET=${csrfSecret}`);

// Si el archivo .env ya existe, preguntar antes de sobrescribir
if (existsSync(envPath)) {
  console.log('⚠️  El archivo .env ya existe.');
  console.log('Si continúas, se generarán nuevas claves secretas.');
  console.log('Esto invalidará todas las sesiones existentes.\n');
  
  // En modo no interactivo, hacer backup
  const backupPath = join(rootDir, '.env.backup');
  if (!existsSync(backupPath)) {
    const existingEnv = readFileSync(envPath, 'utf-8');
    writeFileSync(backupPath, existingEnv);
    console.log(`✅ Backup creado en .env.backup\n`);
  }
}

// Escribir archivo .env
writeFileSync(envPath, envContent, 'utf-8');

console.log('✅ Archivo .env creado exitosamente');
console.log('\n📝 Variables generadas:');
console.log(`   JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
console.log(`   REFRESH_TOKEN_SECRET: ${refreshTokenSecret.substring(0, 20)}...`);
console.log(`   CSRF_SECRET: ${csrfSecret.substring(0, 20)}...`);
console.log('\n⚠️  IMPORTANTE:');
console.log('   - No compartas estas claves');
console.log('   - No commitees el archivo .env al repositorio');
console.log('   - En producción, usa secrets de Cloudflare Workers\n');
