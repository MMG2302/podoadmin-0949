/**
 * Utilidades para CAPTCHA (Cloudflare Turnstile por defecto; también reCAPTCHA y hCaptcha).
 */

export type CaptchaProvider = 'turnstile' | 'recaptcha' | 'hcaptcha';

const SUPPORTED_PROVIDERS: CaptchaProvider[] = ['turnstile', 'recaptcha', 'hcaptcha'];

export interface CaptchaConfig {
  provider: CaptchaProvider;
  siteKey?: string;
  secretKey?: string;
}

function resolveProvider(): CaptchaProvider | null {
  const raw = (process.env.CAPTCHA_PROVIDER?.trim() || 'turnstile').toLowerCase();
  if ((SUPPORTED_PROVIDERS as string[]).includes(raw)) {
    return raw as CaptchaProvider;
  }
  console.warn(`CAPTCHA_PROVIDER no soportado: ${raw}. Usa turnstile, recaptcha o hcaptcha.`);
  return null;
}

/**
 * Verifica un token CAPTCHA con el servicio correspondiente
 */
export async function verifyCaptcha(
  token: string,
  config: CaptchaConfig
): Promise<{ success: boolean; error?: string }> {
  if (!config.secretKey) {
    console.warn('CAPTCHA secret key no configurada');
    return { success: false, error: 'CAPTCHA no configurado' };
  }

  try {
    switch (config.provider) {
      case 'recaptcha':
        return await verifyRecaptcha(token, config.secretKey);
      case 'hcaptcha':
        return await verifyHcaptcha(token, config.secretKey);
      case 'turnstile':
        return await verifyTurnstile(token, config.secretKey);
      default:
        return { success: false, error: 'Proveedor CAPTCHA no soportado' };
    }
  } catch (error) {
    console.error('Error verificando CAPTCHA:', error);
    return { success: false, error: 'Error al verificar CAPTCHA' };
  }
}

async function verifyRecaptcha(
  token: string,
  secretKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return {
      success: data.success === true && (data.score || 0) >= 0.5,
      error: data['error-codes']?.[0],
    };
  } catch {
    return { success: false, error: 'Error de conexión con reCAPTCHA' };
  }
}

async function verifyHcaptcha(
  token: string,
  secretKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return {
      success: data.success === true,
      error: data['error-codes']?.[0],
    };
  } catch {
    return { success: false, error: 'Error de conexión con hCaptcha' };
  }
}

async function verifyTurnstile(
  token: string,
  secretKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return {
      success: data.success === true,
      error: data['error-codes']?.[0],
    };
  } catch {
    return { success: false, error: 'Error de conexión con Turnstile' };
  }
}

export function isProductionDeploy(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * CAPTCHA activo en este entorno.
 * - Producción: siempre (requiere CAPTCHA_* configurado).
 * - Desarrollo/local: desactivado salvo CAPTCHA_FORCE_IN_DEV=1 para pruebas.
 */
export function isCaptchaEnabled(): boolean {
  if (isProductionDeploy()) return true;
  return process.env.CAPTCHA_FORCE_IN_DEV === '1';
}

export function isCaptchaExplicitlyDisabledInDev(): boolean {
  return !isCaptchaEnabled();
}

export function getCaptchaConfig(): CaptchaConfig | null {
  if (!isCaptchaEnabled()) return null;

  const provider = resolveProvider();
  const siteKey = process.env.CAPTCHA_SITE_KEY?.trim();
  const secretKey = process.env.CAPTCHA_SECRET_KEY?.trim();

  if (!provider || !siteKey || !secretKey) {
    return null;
  }

  return { provider, siteKey, secretKey };
}

export function isCaptchaRequiredForForms(): boolean {
  return getCaptchaConfig() !== null;
}
