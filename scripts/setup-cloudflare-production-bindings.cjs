#!/usr/bin/env node
/**
 * Crea namespaces KV y colas de Cloudflare para producción.
 * Ejecutar una vez con sesión wrangler autenticada:
 *   node scripts/setup-cloudflare-production-bindings.cjs
 */
const { execSync } = require('child_process');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

console.log('Configuración de bindings Cloudflare (KV + Queues) para PodoAdmin\n');

try {
  run('bunx wrangler kv namespace create RATE_LIMIT_KV');
} catch {
  console.warn('KV dev: puede existir ya o requerir login wrangler');
}

try {
  run('bunx wrangler kv namespace create RATE_LIMIT_KV --env production');
} catch {
  console.warn('KV production: revisar manualmente si ya existe');
}

try {
  run('bunx wrangler queues create podoadmin-notifications');
} catch {
  console.warn('Cola local/dev: puede existir ya');
}

try {
  run('bunx wrangler queues create podoadmin-notifications-prod --env production');
} catch {
  console.warn('Cola production: revisar manualmente');
}

console.log(`
Listo. Copia los IDs devueltos en wrangler.json:
  - kv_namespaces[].id  → RATE_LIMIT_KV (dev y env.production)
  - queues.producers[].queue ya está nombrada en wrangler.json

Ver: docs/PLATAFORMA_NIVELES_SISTEMA.md sección despliegue.
`);
