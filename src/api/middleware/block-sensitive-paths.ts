import type { Context, Next } from 'hono';

/**
 * Lista blanca: únicos prefijos de ruta bajo /api que se consideran válidos.
 * Cualquier otra petición (node_modules, migraciones, traversal, etc.) se rechaza con 404.
 * Reduce superficie de ataque y previene directory traversal / acceso a recursos internos.
 */
const ALLOWED_API_FIRST_SEGMENTS: ReadonlySet<string> = new Set([
  'ping',
  'public',
  'csrf',
  'test',       // en producción la ruta no existe, Hono devolverá 404
  'auth',
  'users',
  'patients',
  'sessions',
  '2fa',
  'security-metrics',
  'audit-logs',
  'clinics',
  'professionals',
  'receptionists',
  'consent-document',
  'appointments',
  'notifications',
  'messages',
  'support',
]);

/** Caracteres permitidos en un segmento de path (evita encoding raro o inyección). */
const SEGMENT_REGEX = /^[a-zA-Z0-9_-]+$/;

function normalizePathname(pathname: string): string {
  try {
    return decodeURIComponent(pathname).replace(/\/+/g, '/');
  } catch {
    return pathname.replace(/\/+/g, '/');
  }
}

/**
 * Middleware allowlist: solo permite rutas bajo /api que empiecen por un segmento conocido.
 * Bloquea todo lo demás (directory traversal, node_modules, .sql, rutas inventadas, etc.).
 */
export async function blockSensitivePaths(c: Context, next: Next): Promise<Response | void> {
  const rawPath = new URL(c.req.url).pathname;
  const path = normalizePathname(rawPath);

  // Bloquear path traversal
  if (path.includes('..')) {
    return c.json({ error: 'Not Found' }, 404);
  }

  const segments = path.split('/').filter(Boolean);

  // Debe ser /api/<algo> como mínimo
  if (segments.length < 1 || segments[0] !== 'api') {
    return c.json({ error: 'Not Found' }, 404);
  }

  if (segments.length < 2) {
    // /api sin más → no hay ruta definida
    return c.json({ error: 'Not Found' }, 404);
  }

  const firstSegment = segments[1];

  // Solo segmentos alfanuméricos, guión y guión bajo
  if (!SEGMENT_REGEX.test(firstSegment)) {
    return c.json({ error: 'Not Found' }, 404);
  }

  if (!ALLOWED_API_FIRST_SEGMENTS.has(firstSegment)) {
    return c.json({ error: 'Not Found' }, 404);
  }

  return next();
}
