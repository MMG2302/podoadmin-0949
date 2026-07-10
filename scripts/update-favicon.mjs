/**
 * Genera favicon.svg, favicon.ico y apple-touch-icon.png desde public/favicon.png
 * Uso: node scripts/update-favicon.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const src = path.join(publicDir, 'favicon.png');

if (!fs.existsSync(src)) {
  console.error('No existe public/favicon.png');
  process.exit(1);
}

await sharp(src).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

await sharp(src).resize(32, 32).toFile(path.join(publicDir, 'favicon.ico'));

const png512 = await sharp(src).resize(512, 512).png().toBuffer();
const b64 = png512.toString('base64');
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
  <image width="512" height="512" href="data:image/png;base64,${b64}"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg);

console.log('Actualizado: favicon.svg, favicon.ico, apple-touch-icon.png');
