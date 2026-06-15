#!/usr/bin/env node
/**
 * Comprueba que el proyecto está listo para desplegar a producción (Cloudflare).
 * Uso:
 *   node scripts/prepare-deploy.cjs           # solo comprobaciones
 *   node scripts/prepare-deploy.cjs --build   # + npm run build
 *   node scripts/prepare-deploy.cjs --dry-run # + wrangler deploy --dry-run --env production
 *   node scripts/prepare-deploy.cjs --full    # build + dry-run
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const args = new Set(process.argv.slice(2));
const runBuild = args.has('--build') || args.has('--full');
const runDryRun = args.has('--dry-run') || args.has('--full');

const PLACEHOLDER_RE =
  /pendiente|PEGA-AQUI|TU-NOMBRE|TU-NOMBRE-UNICO|0x\.\.\.|sandbox-website-template|mi-clinica/i;

const REQUIRED_DEV_SECRETS = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'CSRF_SECRET'];
const REQUIRED_PROD_VARS = ['NODE_ENV', 'APP_BASE_URL', 'ALLOWED_ORIGINS', 'OFFICIAL_APP_DOMAIN'];
const MIN_SECRET_LEN = 32;

const ok = [];
const warnings = [];
const errors = [];

function isPlaceholder(value) {
  if (value == null || String(value).trim() === '') return true;
  return PLACEHOLDER_RE.test(String(value));
}

function readWranglerConfig() {
  const jsonPath = path.join(root, 'wrangler.json');
  const tomlPath = path.join(root, 'wrangler.toml');
  let config = null;
  let source = null;

  if (fs.existsSync(jsonPath)) {
    try {
      config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      source = 'wrangler.json';
    } catch (e) {
      errors.push(`wrangler.json no es JSON válido: ${e.message}`);
    }
  }

  if (!config && fs.existsSync(tomlPath)) {
    try {
      config = JSON.parse(fs.readFileSync(tomlPath, 'utf8'));
      source = 'wrangler.toml';
    } catch (e) {
      errors.push(`wrangler.toml no es JSON válido: ${e.message}`);
    }
  }

  if (!config) {
    errors.push('No existe wrangler.json ni wrangler.toml');
    return null;
  }

  if (fs.existsSync(jsonPath) && fs.existsSync(tomlPath)) {
    try {
      const tomlConfig = JSON.parse(fs.readFileSync(tomlPath, 'utf8'));
      const jsonProd = JSON.stringify(config.env?.production ?? null);
      const tomlProd = JSON.stringify(tomlConfig.env?.production ?? null);
      if (jsonProd !== tomlProd) {
        warnings.push(
          'wrangler.json y wrangler.toml difieren en env.production — el deploy usa wrangler.json (Vite)'
        );
      }
    } catch {
      warnings.push('No se pudo comparar wrangler.json con wrangler.toml');
    }
  }

  ok.push(`Configuración leída desde ${source}`);
  return config;
}

function parseDevVars() {
  const devVarsPath = path.join(root, '.dev.vars');
  if (!fs.existsSync(devVarsPath)) {
    errors.push('Falta .dev.vars — ejecuta: npm run setup:env');
    return {};
  }
  const lines = fs.readFileSync(devVarsPath, 'utf8').split(/\r?\n/);
  const vars = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

function run(cmd, opts = {}) {
  return spawnSync(cmd, {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    encoding: 'utf8',
    ...opts,
  });
}

// --- Comprobaciones ---

const projectPath = process.cwd();
if (/OneDrive/i.test(projectPath)) {
  warnings.push(
    'La ruta incluye OneDrive (puede fallar el build). Usa C:\\proyectos\\podoadmin-0949'
  );
}

if (!fs.existsSync(path.join(root, 'node_modules'))) {
  errors.push('Falta node_modules — ejecuta: npm install');
} else {
  ok.push('node_modules presente');
}

const devVars = parseDevVars();
for (const name of REQUIRED_DEV_SECRETS) {
  const value = devVars[name];
  if (!value) {
    errors.push(`.dev.vars: falta ${name}`);
  } else if (value.length < MIN_SECRET_LEN) {
    errors.push(`.dev.vars: ${name} debe tener al menos ${MIN_SECRET_LEN} caracteres`);
  } else {
    ok.push(`.dev.vars: ${name} OK (${value.length} chars)`);
  }
}
if (
  devVars.JWT_SECRET &&
  devVars.REFRESH_TOKEN_SECRET &&
  devVars.JWT_SECRET === devVars.REFRESH_TOKEN_SECRET
) {
  errors.push('.dev.vars: JWT_SECRET y REFRESH_TOKEN_SECRET deben ser distintos');
}

const config = readWranglerConfig();
let production = null;
if (config) {
  production = config.env?.production;
  if (!production) {
    errors.push(
      'Falta env.production en wrangler.json — copia la sección de wrangler.production.example.toml'
    );
  } else {
    if (isPlaceholder(production.name)) {
      errors.push(`env.production.name sin configurar (${production.name})`);
    } else {
      ok.push(`Worker producción: ${production.name}`);
    }

    const vars = production.vars ?? {};
    for (const key of REQUIRED_PROD_VARS) {
      const value = vars[key];
      if (!value || isPlaceholder(value)) {
        errors.push(`env.production.vars.${key} sin configurar`);
      } else {
        ok.push(`vars.${key} OK`);
      }
    }

    const d1 = production.d1_databases?.[0];
    if (!d1) {
      errors.push('env.production: falta d1_databases');
    } else {
      if (isPlaceholder(d1.database_id)) {
        errors.push('env.production: database_id pendiente (crear D1 en Cloudflare)');
      } else {
        ok.push(`D1: ${d1.database_name} (${d1.database_id})`);
      }
      if (isPlaceholder(d1.database_name)) {
        errors.push('env.production: database_name pendiente');
      }
    }

    const r2 = production.r2_buckets?.[0];
    if (!r2) {
      errors.push('env.production: falta r2_buckets');
    } else if (isPlaceholder(r2.bucket_name)) {
      errors.push('env.production: bucket_name pendiente (crear R2 en Cloudflare)');
    } else {
      ok.push(`R2: ${r2.bucket_name}`);
    }
  }
}

if (fs.existsSync(path.join(root, 'dist', 'client', 'index.html'))) {
  ok.push('dist/client generado');
} else if (!runBuild) {
  warnings.push('dist/ no existe — ejecuta npm run build o usa: npm run deploy:prep:full');
}

const whoami = spawnSync('node', ['node_modules/wrangler/bin/wrangler.js', 'whoami'], {
  cwd: root,
  encoding: 'utf8',
  shell: false,
});
if (whoami.status !== 0) {
  warnings.push('Wrangler no autenticado — ejecuta: npx wrangler login');
} else {
  ok.push('Wrangler autenticado');
}

// --- Build / dry-run opcionales ---

if (runBuild) {
  const buildCmd = config?.env?.production
    ? 'node scripts/build-production.cjs'
    : 'npm run build';
  console.log(`\n--- ${buildCmd} ---\n`);
  const build = run(buildCmd);
  if (build.status !== 0) {
    errors.push('build de producción falló');
  } else {
    ok.push('build producción completado');
  }
}

if (runDryRun) {
  if (errors.length > 0) {
    warnings.push('Omitiendo dry-run: corrige los errores de configuración primero');
  } else if (!runBuild) {
    warnings.push('Ejecuta con --full para build producción antes del dry-run');
  } else {
    console.log('\n--- wrangler deploy --dry-run (post build:production) ---\n');
    const dry = run('node node_modules/wrangler/bin/wrangler.js deploy --dry-run');
    if (dry.status !== 0) {
      errors.push('wrangler deploy --dry-run falló');
    } else {
      ok.push('dry-run producción OK');
    }
  }
}

// --- Resumen ---

console.log('\n=== PodoAdmin — prepare-deploy ===\n');
console.log(`Carpeta: ${projectPath}\n`);

if (ok.length) {
  console.log('OK:');
  for (const line of ok) console.log(`  ✓ ${line}`);
  console.log('');
}

if (warnings.length) {
  console.log('Advertencias:');
  for (const line of warnings) console.log(`  ⚠ ${line}`);
  console.log('');
}

if (errors.length) {
  console.log('Pendiente antes del deploy:');
  for (const line of errors) console.log(`  ✗ ${line}`);
  console.log('\nGuías: docs/DEPLOY_AHORA.md · LISTA_DESPLIEGUE.md\n');
  process.exit(1);
}

console.log('Listo para desplegar. Siguiente:\n');
console.log('  1. npx wrangler secret put JWT_SECRET  (y REFRESH, CSRF)');
console.log('  2. npm run db:migrate:remote:production');
console.log('  3. Crear super admin (scripts/create-super-admin.cjs + d1 execute --remote)');
console.log('  4. npm run deploy:production\n');
process.exit(0);
