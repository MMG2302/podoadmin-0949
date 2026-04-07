import { createMiddleware } from 'hono/factory';
import { getClientIP, getIPWhitelist, isIPWhitelisted } from '../utils/ip-tracking';
import { checkAndRecordWindowLimit, GLOBAL_LIMITS } from '../utils/global-rate-limit-d1';

/** Rutas que no deben consumir cuota global (monitores, CORS, config pública). */
function isExemptPath(path: string, method: string): boolean {
  if (method === 'OPTIONS') return true;
  const exact = new Set([
    '/api/health',
    '/api/ping',
    '/api/public/config',
  ]);
  if (exact.has(path)) return true;
  if (path.startsWith('/api/csrf')) return true;
  return false;
}

/** Auth “estricto”: credenciales y tokens en URL pública (límite bajo por IP). */
function isAuthStrictPath(path: string, method: string): boolean {
  if (method !== 'POST') return false;
  const strict = new Set([
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
  ]);
  return strict.has(path);
}

/** Mutaciones en rutas de administración / alto impacto. */
function isSensitiveMutation(path: string, method: string): boolean {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false;
  const prefixes = [
    '/api/users',
    '/api/system',
    '/api/audit-logs',
    '/api/messages',
    '/api/registration-lists',
    '/api/clinics',
    '/api/receptionists',
    '/api/professionals',
  ];
  return prefixes.some((p) => path.startsWith(p));
}

/**
 * Rate limiting por IP con ventana de 15 minutos (D1).
 * - General: 100 req/IP
 * - Auth estricto (POST login, forgot, reset, verify-email): 5 req/IP
 * - Mutaciones sensibles (admin): 10 req/IP
 * Solo aplica un tier por petición (el más específico).
 */
export const globalApiRateLimitMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.path;
  const method = c.req.method;

  if (isExemptPath(path, method)) {
    return next();
  }

  const ip = getClientIP(c.req.raw.headers);
  const whitelist = getIPWhitelist();
  if (ip !== 'unknown' && isIPWhitelisted(ip, whitelist)) {
    return next();
  }

  let key: string;
  let max: number;
  let tier: string;

  if (isAuthStrictPath(path, method)) {
    key = `win:auth:${ip}`;
    max = GLOBAL_LIMITS.authStrictMax;
    tier = 'auth-strict';
  } else if (isSensitiveMutation(path, method)) {
    key = `win:sens:${ip}`;
    max = GLOBAL_LIMITS.sensitiveMax;
    tier = 'sensitive';
  } else {
    key = `win:api:${ip}`;
    max = GLOBAL_LIMITS.generalMax;
    tier = 'general';
  }

  const result = await checkAndRecordWindowLimit(key, max, GLOBAL_LIMITS.windowMs);

  if (!result.allowed) {
    const requestId = c.get('requestId');
    console.warn('[rate-limit]', requestId, tier, ip, method, path, 'retryAfter', result.retryAfterSeconds);
    if (result.retryAfterSeconds != null) {
      c.header('Retry-After', String(result.retryAfterSeconds));
    }
    return c.json(
      {
        error: 'Demasiadas peticiones',
        message:
          'Has superado el límite de solicitudes permitidas. Espera unos minutos e inténtalo de nuevo.',
        retryAfter: result.retryAfterSeconds,
      },
      429
    );
  }

  return next();
});
