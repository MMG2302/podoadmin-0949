/**
 * Genera public/og-image.png (1200×630) para Open Graph / Twitter card.
 * Se ejecuta a mano cuando cambia la marca o el claim; el PNG queda versionado.
 * Uso: node scripts/generate-og-image.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'public', 'og-image.png');

const INK = '#1a1a1a';
const MUTED = '#9ca3af';
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2a2a2a" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${INK}"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <text x="90" y="250" font-family="${FONT}" font-size="86" font-weight="300" fill="#ffffff">
    Pod<tspan font-weight="700">oraa</tspan>
  </text>
  <text x="90" y="345" font-family="${FONT}" font-size="42" font-weight="400" fill="#ffffff">
    Software para podólogos y clínicas podológicas
  </text>
  <text x="90" y="415" font-family="${FONT}" font-size="30" font-weight="300" fill="${MUTED}">
    Agenda · Historia clínica · WhatsApp · Cobros
  </text>
  <rect x="90" y="490" width="260" height="4" fill="#ffffff"/>
  <text x="90" y="555" font-family="${FONT}" font-size="26" font-weight="300" fill="${MUTED}">
    podoraa.com
  </text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(dest);

console.log('Generado: public/og-image.png (1200×630)');
