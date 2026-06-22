/**
 * Consulta alertas y métricas de seguridad en D1 (local o remoto).
 *
 * Uso:
 *   node scripts/check-alerts.cjs              # D1 local
 *   node scripts/check-alerts.cjs --remote       # D1 remoto (requiere wrangler login)
 *   node scripts/check-alerts.cjs --json         # salida JSON
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const remote = process.argv.includes('--remote');
const asJson = process.argv.includes('--json');
const flag = remote ? '--remote' : '--local';

function runQuery(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  const cmd = `node node_modules/wrangler/bin/wrangler.js d1 execute DB ${flag} --command "${escaped}" --json`;
  try {
    const out = execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const parsed = JSON.parse(out);
    const result = parsed?.[0]?.results;
    return Array.isArray(result) ? result : [];
  } catch (err) {
    const msg = err.stderr?.toString() || err.message;
    if (msg.includes('Not logged in') || msg.includes('Failed to fetch auth token')) {
      console.error('❌ Wrangler no autenticado. Ejecuta: node node_modules/wrangler/bin/wrangler.js login');
    } else {
      console.error('❌ Error consultando D1:', msg);
    }
    process.exit(1);
  }
}

const unreadAlerts = runQuery(
  "SELECT id, user_id, title, message, read, created_at FROM notifications WHERE read = 0 AND (title LIKE '%Alerta%' OR title LIKE '%Incumplimiento%' OR title LIKE '%⚠%') ORDER BY created_at DESC LIMIT 20"
);

const recentFailedLogins = runQuery(
  "SELECT id, ip_address, details, created_at FROM security_metrics WHERE metric_type = 'failed_login' ORDER BY created_at DESC LIMIT 10"
);

const auditAlerts = runQuery(
  "SELECT id, user_id, action, details, created_at FROM audit_log WHERE action LIKE 'ALERT_%' ORDER BY created_at DESC LIMIT 10"
);

const statsRows = runQuery(
  "SELECT metric_type, COUNT(*) as count FROM security_metrics WHERE created_at >= datetime('now', '-7 days') GROUP BY metric_type ORDER BY count DESC LIMIT 15"
);

const summary = {
  source: remote ? 'remote' : 'local',
  generatedAt: new Date().toISOString(),
  unreadAlerts: unreadAlerts.length,
  recentFailedLogins: recentFailedLogins.length,
  auditAlerts: auditAlerts.length,
  statsLast7Days: statsRows,
  alerts: unreadAlerts,
  failedLogins: recentFailedLogins,
  auditEvents: auditAlerts,
};

if (asJson) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

console.log('');
console.log('=== PodoAdmin — Alertas y métricas ===');
console.log(`Fuente D1: ${remote ? 'REMOTO' : 'LOCAL'}  |  ${summary.generatedAt}`);
console.log('');

console.log(`🔔 Alertas sin leer (sistema): ${unreadAlerts.length}`);
if (unreadAlerts.length > 0) {
  unreadAlerts.forEach((a) => {
    console.log(`  • [${a.created_at}] ${a.title}`);
    console.log(`    ${(a.message || '').slice(0, 120)}`);
  });
} else {
  console.log('  (ninguna)');
}

console.log('');
console.log(`🔐 Logins fallidos recientes: ${recentFailedLogins.length}`);
recentFailedLogins.slice(0, 5).forEach((r) => {
  console.log(`  • [${r.created_at}] IP ${r.ip_address || '—'}  ${r.details || ''}`);
});

console.log('');
console.log('📊 Métricas últimos 7 días:');
if (statsRows.length === 0) {
  console.log('  (sin datos)');
} else {
  statsRows.forEach((s) => console.log(`  • ${s.metric_type}: ${s.count}`));
}

console.log('');
console.log('📋 Eventos audit ALERT_* recientes:');
if (auditAlerts.length === 0) {
  console.log('  (ninguno)');
} else {
  auditAlerts.forEach((e) => console.log(`  • [${e.created_at}] ${e.action} (user: ${e.user_id})`));
}

console.log('');
