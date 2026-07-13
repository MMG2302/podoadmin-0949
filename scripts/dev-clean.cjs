/**
 * Reinicia el dev server: libera el puerto 5173 y arranca Vite.
 * Uso: npm run dev:clean
 */
const { execSync, spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const PORTS = [5173, 5174];

function freePort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: 'ignore', shell: true }
      );
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
        shell: true,
        stdio: 'ignore',
      });
    }
  } catch {
    /* puerto ya libre */
  }
}

console.log(`\n=== PodoAdmin: reinicio dev (puertos ${PORTS.join(', ')}) ===\n`);
for (const port of PORTS) freePort(port);

try {
  console.log('▶ Aplicando migraciones D1 locales…');
  execSync('npm run db:migrate', { cwd: root, stdio: 'inherit', shell: true });
} catch {
  console.warn('⚠ No se pudieron aplicar migraciones (continuando con dev).');
}

console.log(`▶ npm run dev → http://localhost:5173/\n`);

const child = spawn('npm', ['run', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
