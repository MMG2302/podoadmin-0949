/**
 * Ejecuta migración batch base64 → R2 vía API (super_admin).
 * Uso: node scripts/run-r2-migrate.cjs [--dry-run] [--max-batches=50]
 */
const BASE = process.env.API_BASE || 'http://localhost:5173/api';
const EMAIL = process.env.MIGRATE_EMAIL || 'admin@podoadmin.com';
const PASSWORD = process.env.MIGRATE_PASSWORD || 'admin123';
const BATCH_SIZE = Number(process.env.MIGRATE_BATCH_SIZE || 25);
const DRY_RUN = process.argv.includes('--dry-run');
const MAX_BATCHES = (() => {
  const arg = process.argv.find((a) => a.startsWith('--max-batches='));
  return arg ? Number(arg.split('=')[1]) : 200;
})();

const jar = new Map();

function storeCookies(res) {
  const raw = res.headers.getSetCookie?.() || [];
  for (const line of raw) {
    const part = line.split(';')[0];
    const eq = part.indexOf('=');
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function api(method, path, body) {
  const headers = { Accept: 'application/json' };
  const cookies = cookieHeader();
  if (cookies) headers.Cookie = cookies;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    const csrf = jar.get('csrf-token');
    if (csrf) headers['X-CSRF-Token'] = decodeURIComponent(csrf);
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  storeCookies(res);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${json.message || json.error || text}`);
  }
  return json;
}

async function main() {
  console.log(`\n=== Migración R2 (${DRY_RUN ? 'DRY-RUN' : 'REAL'}) ===`);
  console.log(`API: ${BASE}\n`);

  await api('GET', '/csrf/token');
  const login = await api('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (!login.success && !login.user) {
    throw new Error('Login fallido: ' + JSON.stringify(login));
  }
  console.log('✓ Login OK como', login.user?.email || EMAIL);

  const status = await api('GET', '/admin/media/r2-migrate/status');
  console.log('Pendientes:', JSON.stringify(status.pending, null, 2));
  if (!status.bucketConfigured) {
    console.warn('⚠ BUCKET no configurado en este entorno; la migración real no subirá a R2.');
  }

  if (DRY_RUN) {
    const result = await api('POST', '/admin/media/r2-migrate', {
      dryRun: true,
      batchSize: BATCH_SIZE,
      scope: 'all',
    });
    console.log('Dry-run:', JSON.stringify(result.result, null, 2));
    return;
  }

  let batch = 0;
  let totalMigrated = 0;

  while (batch < MAX_BATCHES) {
    batch++;
    const { result } = await api('POST', '/admin/media/r2-migrate', {
      dryRun: false,
      batchSize: BATCH_SIZE,
      scope: 'all',
    });
    const moved =
      result.migratedSessionImages +
      result.migratedLogos +
      result.migratedLegacySessions;
    totalMigrated += moved;
    console.log(
      `Lote ${batch}: +${moved} (img=${result.migratedSessionImages}, logos=${result.migratedLogos}, legacy=${result.migratedLegacySessions}, skip=${result.skipped}, err=${result.errors.length})`
    );
    if (result.errors.length) {
      for (const e of result.errors.slice(0, 5)) console.warn('  ', e);
    }
    if (moved === 0) break;
  }

  const finalStatus = await api('GET', '/admin/media/r2-migrate/status');
  console.log('\n✓ Completado. Total migrados en esta ejecución:', totalMigrated);
  console.log('Pendientes restantes:', JSON.stringify(finalStatus.pending, null, 2));
}

main().catch((err) => {
  console.error('\n✗ Error:', err.message || err);
  process.exit(1);
});
