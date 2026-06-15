#!/usr/bin/env node
/** Build con la configuración Cloudflare del entorno production (CLOUDFLARE_ENV). */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
process.env.CLOUDFLARE_ENV = 'production';

console.log('Build producción (CLOUDFLARE_ENV=production)...\n');
execSync('npm run build', {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
  shell: true,
});
