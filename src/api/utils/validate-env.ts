/**
 * Validación temprana de variables críticas (DEV_RULES §1.1).
 * Se importa al inicio de `index.ts` antes de rutas que usen JWT/CSRF.
 *
 * Producción: falla el arranque del Worker si falta algo.
 * Desarrollo: mismo criterio (usar `npm run setup:env` o `.dev.vars` con los tres secretos).
 *
 * `SKIP_ENV_VALIDATION=1` solo para herramientas que importen el módulo sin runtime real (evitar en deploy).
 */
const MIN_LEN = 32;

const REQUIRED = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'CSRF_SECRET'] as const;

function problems(): string[] {
  if (process.env.SKIP_ENV_VALIDATION === '1') {
    return [];
  }
  const out: string[] = [];
  for (const name of REQUIRED) {
    const v = process.env[name];
    if (v === undefined || v.trim() === '') {
      out.push(`${name} no está definida o está vacía`);
    } else if (v.length < MIN_LEN) {
      out.push(`${name} debe tener al menos ${MIN_LEN} caracteres`);
    }
  }
  const jwt = process.env.JWT_SECRET?.trim();
  const refresh = process.env.REFRESH_TOKEN_SECRET?.trim();
  if (jwt && refresh && jwt === refresh) {
    out.push('JWT_SECRET y REFRESH_TOKEN_SECRET deben ser distintos');
  }
  return out;
}

const errs = problems();
if (errs.length > 0) {
  const help =
    'Define JWT_SECRET, REFRESH_TOKEN_SECRET y CSRF_SECRET (mín. 32 caracteres cada uno). ' +
    'Local: `npm run setup:env` o copia `.env.example` a `.dev.vars`. ' +
    'Producción: `wrangler secret put JWT_SECRET` (y análogos).';
  throw new Error(`[validate-env] ${errs.join(' | ')}. ${help}`);
}
