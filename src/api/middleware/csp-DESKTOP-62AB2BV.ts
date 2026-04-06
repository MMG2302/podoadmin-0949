import { createMiddleware } from 'hono/factory';

/**
 * Configuración de Content Security Policy (CSP)
 * Protege contra XSS, clickjacking, y otros ataques
 */
export const cspMiddleware = createMiddleware(async (c, next) => {
  await next();

  // Construir CSP header
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-inline y unsafe-eval para desarrollo
    "style-src 'self' 'unsafe-inline'", // unsafe-inline para estilos inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'", // Prevenir clickjacking
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests", // Forzar HTTPS
  ];

  // En producción, hacer CSP más estricto y añadir HSTS
  const isProduction = process.env.NODE_ENV === 'production';
  const forwardedProto = c.req.header('x-forwarded-proto');
  const isHttps = isProduction && (forwardedProto === 'https' || forwardedProto === undefined);

  if (isProduction) {
    // Remover unsafe-inline y unsafe-eval en producción
    cspDirectives[1] = "script-src 'self'";
  }

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
