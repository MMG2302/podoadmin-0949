/**
 * Reinicia el dev server: libera el puerto 5173 y arranca Vite.
 * Uso: npm run dev:clean
 */
const { execSync, spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const PORT = 5173;

function freePort() {
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: 'ignore', shell: true }
      );
    } else {
      execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, {
        shell: true,
        stdio: 'ignore',
      });
    }
  } catch {
    /* puerto ya libre */
  }
}

console.log(`\n=== PodoAdmin: reinicio dev (puerto ${PORT}) ===\n`);
freePort();
console.log(`▶ npm run dev → http://localhost:${PORT}/\n`);

const child = spawn('npm', ['run', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => process.exit(code ?? 0));
