/**
 * Dominios CSP adicionales según proveedor CAPTCHA configurado.
 */

import { getCaptchaConfig } from './captcha';

export function getCaptchaCspSources(): {
  scriptSrc: string[];
  frameSrc: string[];
  connectSrc: string[];
} {
  const config = getCaptchaConfig();
  if (!config?.provider || !config.siteKey) {
    return { scriptSrc: [], frameSrc: [], connectSrc: [] };
  }

  const provider = config.provider;

  switch (provider) {
    case 'turnstile':
      return {
        scriptSrc: ['https://challenges.cloudflare.com'],
        frameSrc: ['https://challenges.cloudflare.com'],
        connectSrc: ['https://challenges.cloudflare.com'],
      };
    case 'hcaptcha':
      return {
        scriptSrc: ['https://js.hcaptcha.com', 'https://hcaptcha.com'],
        frameSrc: ['https://hcaptcha.com', 'https://*.hcaptcha.com'],
        connectSrc: ['https://hcaptcha.com', 'https://*.hcaptcha.com'],
      };
    case 'recaptcha':
      return {
        scriptSrc: ['https://www.google.com', 'https://www.gstatic.com'],
        frameSrc: ['https://www.google.com', 'https://www.recaptcha.net'],
        connectSrc: ['https://www.google.com', 'https://www.gstatic.com'],
      };
    default:
      return { scriptSrc: [], frameSrc: [], connectSrc: [] };
  }
}
