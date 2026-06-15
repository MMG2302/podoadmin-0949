import { createMiddleware } from 'hono/factory';
import { getCaptchaCspSources } from '../utils/csp-captcha';

/**
 * Configuración de Content Security Policy (CSP)
 * Protege contra XSS, clickjacking, y otros ataques
 */
export const cspMiddleware = createMiddleware(async (c, next) => {
  await next();

  const captcha = getCaptchaCspSources();
  const captchaScript = captcha.scriptSrc.length ? ` ${captcha.scriptSrc.join(' ')}` : '';
  const captchaFrame = captcha.frameSrc.length ? ` ${captcha.frameSrc.join(' ')}` : '';
  const captchaConnect = captcha.connectSrc.length ? ` ${captcha.connectSrc.join(' ')}` : '';

  const isProduction = process.env.NODE_ENV === 'production';
  const forwardedProto = c.req.header('x-forwarded-proto');
  const isHttps = isProduction && (forwardedProto === 'https' || forwardedProto === undefined);

  const scriptSrc = isProduction
    ? `script-src 'self'${captchaScript}`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval'${captchaScript}`;

  const connectSrc = isProduction
    ? `connect-src 'self'${captchaConnect}`
    : `connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:*${captchaConnect}`;

  const frameSrc = captcha.frameSrc.length ? `frame-src 'self'${captchaFrame}` : "frame-src 'none'";

  const cspDirectives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    connectSrc,
    frameSrc,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isHttps ? ['upgrade-insecure-requests'] : []),
  ];

  const cspHeader = cspDirectives.join('; ');

  // Establecer headers de seguridad
  c.header('Content-Security-Policy', cspHeader);
  c.header('X-Content-Type-Options', 'nosniff'); // Prevenir MIME sniffing
  c.header('X-Frame-Options', 'DENY'); // Prevenir clickjacking
  c.header('X-XSS-Protection', '1; mode=block'); // Protección XSS del navegador
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin'); // No enviar referrer completo a sitios externos (anti-phishing)
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()'); // Deshabilitar APIs sensibles

  // HSTS: forzar HTTPS en producción para evitar downgrade y phishing por HTTP
  if (isHttps) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
});
