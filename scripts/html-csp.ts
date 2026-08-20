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


/**
 * Archivo `_headers` de Cloudflare para lo que sirve el asset handler.
 *
 * Por qué existe: el Worker solo corre para `/api/*` (`run_worker_first`), así que el
 * middleware de seguridad de `src/api/middleware/csp.ts` nunca ve las páginas HTML. Hasta
 * ahora la landing, el login y el panel se servían **sin una sola cabecera de seguridad**,
 * y el `<meta http-equiv>` de index.html no cubre el hueco: el navegador ignora
 * `frame-ancestors` cuando llega por meta, y `X-Frame-Options` no existe como meta. Es el
 * finding F17 del escaneo, y este archivo es lo que lo cierra.
 *
 * La política CSP es la misma que la del meta, generada de la misma función, para que no
 * puedan desincronizarse.
 */
export function buildAssetHeaders(): string {
  const csp = buildHtmlCspMetaContent();

  return [
    '# Generado en build por vite.config.ts — no editar a mano.',
    '',
    '/*',
    `  Content-Security-Policy: ${csp}`,
    '  X-Frame-Options: DENY',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: geolocation=(), microphone=(), camera=()',
    '  X-XSS-Protection: 1; mode=block',
    // Mismo valor que ya manda el Worker en /api/*, así que HSTS ya estaba activo para
    // quien tocara la API; esto solo lo extiende a quien solo visita la web.
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    '',
    // Estos llevan hash en el nombre: si cambia el contenido cambia la URL, así que
    // cachearlos un año es seguro. Antes se servían con max-age=0 y se revalidaba el
    // bundle entero en cada visita.
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    // Los clips y los iconos NO llevan hash: un año dejaría la versión vieja clavada en
    // el navegador de quien ya vino. Un día es suficiente para la visita repetida.
    '/landing/*',
    '  Cache-Control: public, max-age=86400',
    '',
    // Iconos y la imagen de compartir: tampoco llevan hash, mismo criterio.
    '/favicon.*',
    '  Cache-Control: public, max-age=86400',
    '',
    '/apple-touch-icon.png',
    '  Cache-Control: public, max-age=86400',
    '',
    '/og-image.png',
    '  Cache-Control: public, max-age=86400',
    '',
  ].join('\n');
}
