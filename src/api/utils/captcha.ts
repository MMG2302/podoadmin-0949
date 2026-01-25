/**
 * Utilidades para CAPTCHA
 * Integración con servicios de CAPTCHA (reCAPTCHA, hCaptcha, etc.)
 */

export interface CaptchaConfig {
  provider: 'recaptcha' | 'hcaptcha' | 'turnstile';
  siteKey?: string;
  secretKey?: string;
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

/**
 * Verifica reCAPTCHA v2/v3
 */
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
      success: data.success === true && (data.score || 0) >= 0.5, // Score mínimo 0.5 para v3
      error: data['error-codes']?.[0],
    };
  } catch (error) {
    return { success: false, error: 'Error de conexión con reCAPTCHA' };
  }
}

/**
 * Verifica hCaptcha
 */
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
  } catch (error) {
    return { success: false, error: 'Error de conexión con hCaptcha' };
  }
}

/**
 * Verifica Cloudflare Turnstile
 */
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
  } catch (error) {
    return { success: false, error: 'Error de conexión con Turnstile' };
  }
}

/**
 * Obtiene la configuración de CAPTCHA desde variables de entorno
 */
export function getCaptchaConfig(): CaptchaConfig | null {
  const provider = process.env.CAPTCHA_PROVIDER as 'recaptcha' | 'hcaptcha' | 'turnstile' | undefined;
  const siteKey = process.env.CAPTCHA_SITE_KEY;
  const secretKey = process.env.CAPTCHA_SECRET_KEY;

  if (!provider || !siteKey || !secretKey) {
    return null;
  }

  return {
    provider,
    siteKey,
    secretKey,
  };
}

/**
 * Determina si se debe mostrar CAPTCHA basado en intentos fallidos
 */
export function shouldShowCaptcha(failedAttempts: number, threshold: number = 3): boolean {
  return failedAttempts >= threshold;
}
