/**
 * Exporta D1 remota a SQL local (backup manual).
 * Uso: npm run db:backup:remote
 *
 * El archivo se guarda en backups/d1/ (ignorado por git).
 * Para backup automático diario en R2, activar D1_BACKUP_ENABLED=1 en producción.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'backups', 'd1');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(outDir, `d1-remote-${stamp}.sql`);

console.log(`Exportando D1 remota → ${output}`);

try {
  execSync(`npx wrangler d1 export DB --remote --output="${output}"`, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  const stats = fs.statSync(output);
  console.log(`✅ Backup completado (${Math.round(stats.size / 1024)} KB)`);
  console.log('   Restaurar (staging): wrangler d1 execute DB --remote --file=<ruta.sql>');
} catch (err) {
  console.error('❌ Error exportando D1 remota. ¿Estás logueado con wrangler login?');
  process.exit(1);
}
