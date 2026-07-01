import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCaptchaConfig,
  isCaptchaEnabled,
  isCaptchaExplicitlyDisabledInDev,
  isCaptchaRequiredForForms,
} from './captcha';

const ENV_KEYS = [
  'NODE_ENV',
  'CAPTCHA_FORCE_IN_DEV',
  'CAPTCHA_PROVIDER',
  'CAPTCHA_SITE_KEY',
  'CAPTCHA_SECRET_KEY',
] as const;

function snapshotEnv(): Record<string, string | undefined> {
  const snap: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) snap[k] = process.env[k];
  return snap;
}

function restoreEnv(snap: Record<string, string | undefined>) {
  for (const k of ENV_KEYS) {
    const v = snap[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe('captcha env policy', () => {
  const base = snapshotEnv();

  afterEach(() => {
    restoreEnv(base);
    vi.unstubAllEnvs();
  });

  it('desactiva CAPTCHA en desarrollo por defecto', () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.CAPTCHA_FORCE_IN_DEV;
    process.env.CAPTCHA_PROVIDER = 'turnstile';
    process.env.CAPTCHA_SITE_KEY = '1x00000000000000000000AA';
    process.env.CAPTCHA_SECRET_KEY = '1x0000000000000000000000000000000AA';

    expect(isCaptchaEnabled()).toBe(false);
    expect(isCaptchaExplicitlyDisabledInDev()).toBe(true);
    expect(getCaptchaConfig()).toBeNull();
    expect(isCaptchaRequiredForForms()).toBe(false);
  });

  it('activa CAPTCHA en desarrollo solo con CAPTCHA_FORCE_IN_DEV=1', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CAPTCHA_FORCE_IN_DEV', '1');
    vi.stubEnv('CAPTCHA_PROVIDER', 'turnstile');
    vi.stubEnv('CAPTCHA_SITE_KEY', '1x00000000000000000000AA');
    vi.stubEnv('CAPTCHA_SECRET_KEY', '1x0000000000000000000000000000000AA');

    expect(isCaptchaEnabled()).toBe(true);
    expect(getCaptchaConfig()?.provider).toBe('turnstile');
    expect(isCaptchaRequiredForForms()).toBe(true);
  });

  it('en producción requiere claves configuradas', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.CAPTCHA_FORCE_IN_DEV;
    delete process.env.CAPTCHA_SITE_KEY;
    delete process.env.CAPTCHA_SECRET_KEY;

    expect(isCaptchaEnabled()).toBe(true);
    expect(getCaptchaConfig()).toBeNull();
    expect(isCaptchaRequiredForForms()).toBe(false);
  });

  it('en producción con Turnstile configurado exige formularios', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CAPTCHA_PROVIDER', 'turnstile');
    vi.stubEnv('CAPTCHA_SITE_KEY', '0xPROD_SITE');
    vi.stubEnv('CAPTCHA_SECRET_KEY', '0xPROD_SECRET');

    expect(isCaptchaRequiredForForms()).toBe(true);
    expect(getCaptchaConfig()?.provider).toBe('turnstile');
  });
});
