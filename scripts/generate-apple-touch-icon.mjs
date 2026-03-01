/**
 * Genera apple-touch-icon.png (180×180) desde favicon.svg para iOS.
 * iOS no soporta SVG en "añadir a pantalla de inicio"; requiere PNG.
 * Uso: node scripts/generate-apple-touch-icon.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'public', 'favicon.svg');
const dest = path.join(root, 'public', 'apple-touch-icon.png');

await sharp(src)
  .resize(180, 180)
  .png()
  .toFile(dest);

console.log('Generado: public/apple-touch-icon.png (180×180)');
