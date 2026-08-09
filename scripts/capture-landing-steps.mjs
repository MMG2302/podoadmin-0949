/**
 * Capturas de la app para los visuales de la seccion "pasos" de la landing.
 *
 * Toma PNGs recortados de regiones concretas de la UI (no pantallas completas):
 * la idea es mostrar que el sistema resuelve algo, sin exponer el flujo de trabajo.
 * Sin cursor: Playwright no dibuja puntero, asi que las capturas salen limpias.
 *
 * La sesion se guarda una sola vez en .auth-capture.json (gitignorado) para no
 * automatizar el ingreso de credenciales: el login lo hace una persona.
 *
 *   node scripts/capture-landing-steps.mjs login    # abre el navegador, inicias sesion vos
 *   node scripts/capture-landing-steps.mjs shoot    # captura usando la sesion guardada
 *
 * Salida: scratchpad/landing-steps/<nombre>.png
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.CAPTURE_BASE_URL ?? 'http://localhost:5173';
const AUTH = path.resolve('.auth-capture.json');
const OUT = path.resolve(process.env.CAPTURE_OUT ?? 'scratchpad/landing-steps');
const VIEWPORT = { width: 1440, height: 900 };

const mode = process.argv[2] ?? 'shoot';

async function login() {
  // channel: 'chrome' usa el Chrome ya instalado y evita descargar el Chromium de Playwright.
  const browser = await chromium.launch({ headless: false, channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  console.log('\n>> Inicia sesion en la ventana abierta. Esperando hasta 5 minutos...\n');
  // El dashboard renderiza la navegacion lateral; sirve como senal de sesion iniciada.
  await page.waitForSelector('a[href="/patients"]', { timeout: 300_000 });
  await ctx.storageState({ path: AUTH });
  console.log(`>> Sesion guardada en ${AUTH}`);
  await browser.close();
}

/** Cada toma: una region acotada, no la pantalla entera. */
const SHOTS = [
  // Esperas largas a proposito: varios contadores del panel se resuelven despues del
  // primer render y con 3s salian en 0, que es justo lo contrario de lo que queremos mostrar.
  { name: 'step1-branding', url: '/settings', wait: 6000 },
  { name: 'step2-agenda', url: '/calendar', wait: 6000 },
  { name: 'step3-sessions', url: '/sessions', wait: 6000 },
  { name: 'step4-analytics', url: '/', wait: 8000 },
];

async function shoot() {
  if (!existsSync(AUTH)) {
    console.error(`No existe ${AUTH}. Corre primero: node scripts/capture-landing-steps.mjs login`);
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    storageState: AUTH,
    deviceScaleFactor: 2, // retina: las capturas se ven nitidas al escalar
  });
  // El idioma vive en localStorage del navegador, no en la sesion guardada: sin esto
  // las capturas salen en espanol aunque la sesion sea la correcta. addInitScript corre
  // antes de que arranque la app, asi que el primer render ya sale en ingles.
  await ctx.addInitScript(() => {
    localStorage.setItem('podoadmin_language', 'en');
  });

  const page = await ctx.newPage();

  for (const shot of SHOTS) {
    await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(shot.wait);
    const file = path.join(OUT, `${shot.name}.png`);
    await page.screenshot({ path: file });
    console.log(`✓ ${shot.name} -> ${file}`);
  }

  await browser.close();
}

if (mode === 'login') await login();
else await shoot();
