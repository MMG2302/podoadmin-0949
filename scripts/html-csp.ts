/**
 * CSP del documento HTML (index.html). Turnstile y otros proveedores hosted.
 */
export function buildHtmlCspMetaContent(): string {
  return [
    "default-src 'self'",
    [
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      'https://challenges.cloudflare.com',
      'https://js.hcaptcha.com',
      'https://www.google.com',
      'https://www.gstatic.com',
      // Beacon de Cloudflare Web Analytics: lo inyecta el proxy, y sin esta entrada la
      // propia CSP lo bloquea y el sitio deja de medir visitas sin avisar.
      'https://static.cloudflareinsights.com',
    ].join(' '),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    [
      "connect-src 'self'",
      'http://localhost:*',
      'https://localhost:*',
      'http://127.0.0.1:*',
      'https://127.0.0.1:*',
      'ws://localhost:*',
      'wss://localhost:*',
      'https://challenges.cloudflare.com',
      'https://hcaptcha.com',
      'https://*.hcaptcha.com',
      'https://www.google.com',
      // Destino al que el beacon manda la medición (/cdn-cgi/rum).
      'https://cloudflareinsights.com',
    ].join(' '),
    [
      "frame-src 'self'",
      'https://challenges.cloudflare.com',
      'https://hcaptcha.com',
      'https://*.hcaptcha.com',
      'https://www.google.com',
      'https://www.recaptcha.net',
    ].join(' '),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
