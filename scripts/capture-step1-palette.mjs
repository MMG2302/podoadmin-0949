/**
 * Paso 01 de la landing: la vista previa de marca con dos paletas distintas.
 *
 * En vez de grabar a alguien eligiendo colores (que expondria el flujo), se capturan
 * dos estados reales del mismo panel y luego se cruzan con un fundido. Ambos son
 * estados que el producto genera de verdad: solo se cambia la paleta guardada.
 *
 *   node scripts/capture-step1-palette.mjs
 *
 * Salida: scratchpad/landing-steps/step1-a.png y step1-b.png
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.CAPTURE_BASE_URL ?? 'http://localhost:5173';
const AUTH = path.resolve('.auth-capture.json');
const OUT = path.resolve('scratchpad/landing-steps');

// Dos marcas plausibles de una consulta real, no colores de demo estridentes.
const PALETTE_A = {
  sidebar: '#1a1a1a', primary: '#1a1a1a', primaryHover: '#2a2a2a',
  canvas: '#f9fafb', surface: '#ffffff', muted: '#6b7280', border: '#e5e7eb',
  error: '#dc2626', errorBg: '#fef2f2', warning: '#92400e', warningBg: '#fffbeb',
  success: '#16a34a', successBg: '#f0fdf4', info: '#1d4ed8', infoBg: '#eff6ff',
};
const PALETTE_B = {
  ...PALETTE_A,
  sidebar: '#0f3d3e', primary: '#0f766e', primaryHover: '#115e59',
  canvas: '#f2f7f6', surface: '#ffffff', border: '#d7e5e3', muted: '#5b7573',
};

async function shoot(name, mode) {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: AUTH,
    deviceScaleFactor: 2,
  });
  // La paleta y el idioma viven en localStorage: hay que sembrarlos antes del primer
  // render o la app arranca con los valores por defecto y la captura sale mal.
  await ctx.addInitScript(([palette]) => {
    localStorage.setItem('podoadmin_language', 'en');
    localStorage.setItem('podoadmin_palette', JSON.stringify({ light: palette, dark: palette }));
  }, [mode]);

  const page = await ctx.newPage();
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(4000);
  const file = path.join(OUT, `${name}.png`);
  // Se apunta al panel de vista previa, no a la pantalla entera: recorte exacto y
  // sin margenes que luego haya que adivinar en ffmpeg.
  const preview = page.locator('div.lg\\:sticky.self-start').first();
  await preview.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await preview.screenshot({ path: file });
  console.log(`✓ ${name} -> ${file}`);
  await browser.close();
}

if (!existsSync(AUTH)) {
  console.error('Falta la sesion. Corre: node scripts/capture-landing-steps.mjs login');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
await shoot('step1-a', PALETTE_A);
await shoot('step1-b', PALETTE_B);
