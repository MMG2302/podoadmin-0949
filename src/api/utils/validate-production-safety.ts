/**
 * Validación de secretos al arranque + comprobaciones de producción (email, Safe Browsing).
 * Sustituye import de validate-env.ts cuando ese archivo no es legible (p. ej. Escritorio solo-en-nube).
 */
const MIN_SECRET_LEN = 32;
const REQUIRED_SECRETS = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET', 'CSRF_SECRET'] as const;

function validateRequiredSecrets(): void {
  if (process.env.SKIP_ENV_VALIDATION === '1') return;

  const errs: string[] = [];
  for (const name of REQUIRED_SECRETS) {
    const v = process.env[name];
    if (v === undefined || v.trim() === '') {
      errs.push(`${name} no está definida o está vacía`);
    } else if (v.length < MIN_SECRET_LEN) {
      errs.push(`${name} debe tener al menos ${MIN_SECRET_LEN} caracteres`);
    }
  }
  const jwt = process.env.JWT_SECRET?.trim();
  const refresh = process.env.REFRESH_TOKEN_SECRET?.trim();
  if (jwt && refresh && jwt === refresh) {
    errs.push('JWT_SECRET y REFRESH_TOKEN_SECRET deben ser distintos');
  }
  if (errs.length > 0) {
    const help =
      'Define JWT_SECRET, REFRESH_TOKEN_SECRET y CSRF_SECRET (mín. 32 caracteres). ' +
      'Local: npm run setup:env o .dev.vars. Producción: wrangler secret put.';
    throw new Error(`[validate-env] ${errs.join(' | ')}. ${help}`);
  }
}

validateRequiredSecrets();

import { isEmailProviderConfigured } from './email-service';
import { getCaptchaConfig } from './captcha';
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

if (isProduction() && !getCaptchaConfig()) {
  console.warn(
    '[startup] Producción sin CAPTCHA (CAPTCHA_PROVIDER, CAPTCHA_SITE_KEY, CAPTCHA_SECRET_KEY): ' +
      'el registro público responderá 503 hasta configurarlo.'
  );
}

if (isProduction() && !isEmailProviderConfigured()) {
  console.warn(
    '[startup] Producción sin RESEND_API_KEY ni SENDGRID_API_KEY: ' +
      'no se enviarán correos reales (alertas de login, reset de contraseña).'
  );
}

const sbKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim();
if (sbKey && isProduction() && sbKey.length < 20) {
  console.warn('[startup] GOOGLE_SAFE_BROWSING_API_KEY parece inválida.');
}
