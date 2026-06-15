import { createMiddleware } from 'hono/factory';
import type { JWTPayload } from '../utils/jwt';
import {
  buildTenantRateLimitKey,
  checkGlobalBurstRateLimit,
  checkGlobalIPRateLimit,
  checkTenantRateLimit,
} from '../utils/action-rate-limit';
import { getClientIP, getIPWhitelist, isIPWhitelisted } from '../utils/ip-tracking';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Rutas exentas del rate limit global (health, config estática). */
const EXEMPT_PATHS = new Set(['/api/ping', '/api/public/config']);

function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method);
}

function shouldSkipGlobalRateLimit(path: string): boolean {
  return EXEMPT_PATHS.has(path);
}

function globalTier(
  user: JWTPayload | null,
  isMutating: boolean
): 'anon_read' | 'anon_write' | 'auth_read' | 'auth_write' {
  if (user) {
    return isMutating ? 'auth_write' : 'auth_read';
  }
  return isMutating ? 'anon_write' : 'anon_read';
}

function rateLimitResponse(
  c: { header: (name: string, value: string) => void; json: (body: unknown, status: number) => Response },
  retryAfterSeconds: number | undefined,
  scope: 'ip' | 'tenant'
) {
  const retry = retryAfterSeconds ?? 60;
  c.header('Retry-After', String(retry));
  const message =
    scope === 'tenant'
      ? 'La clínica ha superado el límite de solicitudes. Espera un momento e inténtalo de nuevo.'
      : 'Demasiadas solicitudes desde esta red. Espera un momento e inténtalo de nuevo.';
  return c.json(
    {
      error: 'rate_limit',
      message,
      retryAfter: retry,
      scope,
    },
    429
  );
}

/**
 * Rate limit global por IP + ráfaga corta. Protege toda la API ante DDoS y abuso masivo.
 * Debe montarse después de authMiddleware para distinguir tráfico autenticado.
 */
export const globalRateLimitMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.path;
  if (shouldSkipGlobalRateLimit(path)) {
    return next();
  }

  const clientIP = getClientIP(c.req.raw.headers);
  if (!clientIP || clientIP === 'unknown') {
    return next();
  }

  if (isIPWhitelisted(clientIP, getIPWhitelist())) {
    return next();
  }

  const burst = await checkGlobalBurstRateLimit(clientIP);
  if (!burst.allowed) {
    return rateLimitResponse(c, burst.retryAfterSeconds, 'ip');
  }

  const user = c.get('user');
  const tier = globalTier(user, isMutatingMethod(c.req.method));
  const global = await checkGlobalIPRateLimit(clientIP, tier);
  if (!global.allowed) {
    return rateLimitResponse(c, global.retryAfterSeconds, 'ip');
  }

  return next();
});

/**
 * Rate limit por tenant (clinicId). Evita que una clínica consuma todos los recursos del Worker/D1.
 */
export const tenantRateLimitMiddleware = createMiddleware(async (c, next) => {
  const path = c.req.path;
  if (shouldSkipGlobalRateLimit(path)) {
    return next();
  }

  const user = c.get('user');
  if (!user) {
    return next();
  }

  const clientIP = getClientIP(c.req.raw.headers);
  if (clientIP && isIPWhitelisted(clientIP, getIPWhitelist())) {
    return next();
  }

  const tenantKey = buildTenantRateLimitKey(user.clinicId, user.userId);
  const tier = isMutatingMethod(c.req.method) ? 'write' : 'read';
  const tenant = await checkTenantRateLimit(tenantKey, tier);
  if (!tenant.allowed) {
    return rateLimitResponse(c, tenant.retryAfterSeconds, 'tenant');
  }

  return next();
});
