/**
 * Dominios CSP adicionales según proveedor CAPTCHA configurado.
 */

import { getCaptchaConfig } from './captcha';

export function getCaptchaCspSources(): {
  scriptSrc: string[];
  frameSrc: string[];
  connectSrc: string[];
  workerSrc: string[];
} {
  const empty = { scriptSrc: [] as string[], frameSrc: [] as string[], connectSrc: [] as string[], workerSrc: [] as string[] };
  const config = getCaptchaConfig();
  if (!config?.provider || !config.siteKey) {
    return empty;
  }

  switch (config.provider) {
    case 'turnstile':
      return {
        scriptSrc: ['https://challenges.cloudflare.com'],
        frameSrc: ['https://challenges.cloudflare.com'],
        connectSrc: ['https://challenges.cloudflare.com'],
        workerSrc: [],
      };
    case 'hcaptcha':
      return {
        scriptSrc: ['https://js.hcaptcha.com', 'https://hcaptcha.com'],
        frameSrc: ['https://hcaptcha.com', 'https://*.hcaptcha.com'],
        connectSrc: ['https://hcaptcha.com', 'https://*.hcaptcha.com'],
        workerSrc: [],
      };
    case 'recaptcha':
      return {
        scriptSrc: ['https://www.google.com', 'https://www.gstatic.com'],
        frameSrc: ['https://www.google.com', 'https://www.recaptcha.net'],
        connectSrc: ['https://www.google.com', 'https://www.gstatic.com'],
        workerSrc: [],
      };
    default:
      return empty;
  }
}
