import { createMiddleware } from 'hono/factory';
import { escapeHtmlObject, sanitizeInput } from '../utils/sanitization';
import { parseAndSanitizeHeaders } from '../utils/request-headers';

/**
 * Pipeline único de entradas:
 * 1. Query + body → normalizar (trim, longitud) + escapar HTML (sanitizeInput)
 * 2. Headers seleccionados → parse y sanitizar (sin control chars, longitud)
 * Los path params se validan en cada ruta (el middleware no tiene acceso al match).
 */
const BODY_METHODS = ['POST', 'PUT', 'PATCH'];

/** Rutas con payloads binarios grandes: no parsear/sanitizar el body en middleware. */
function shouldSkipBodySanitization(path: string, method: string): boolean {
  if (!BODY_METHODS.includes(method)) return false;
  if (path.endsWith('/stripe/webhook')) return true;
  if (path === '/api/users/me/avatar') return true;
  if (/^\/api\/professionals\/logo\/[^/]+$/.test(path)) return true;
  if (/^\/api\/clinics\/[^/]+\/logo$/.test(path)) return true;
  return false;
}

export const sanitizationMiddleware = createMiddleware(async (c, next) => {
  if (c.req.path === '/stripe/webhook' || c.req.path.endsWith('/stripe/webhook')) {
    return next();
  }

  const skipBody = shouldSkipBodySanitization(c.req.path, c.req.method);

  // 1. Query: mismo pipeline (normalize + escape en sanitizeInput)
  const query = c.req.query();
  if (Object.keys(query).length > 0) {
    const sanitizedQuery = sanitizeInput(query);
    for (const [key, value] of Object.entries(sanitizedQuery)) {
      c.req.query(key, value as string);
    }
  }

  // 2. Body: solo para métodos que envían body (evita colgar en GET/OPTIONS al leer stream vacío)
  if (!skipBody && BODY_METHODS.includes(c.req.method)) {
    try {
      const body = await c.req.json().catch(() => null);
      if (body && typeof body === 'object') {
        const sanitizedBody = sanitizeInput(body);
        c.req.json = () => Promise.resolve(sanitizedBody);
      }
    } catch {
      // Sin body o no JSON
    }
  }

  // 3. Headers: parsing robusto (Referer, User-Agent, Origin, etc.) para logs/respuestas
  const safeHeaders = parseAndSanitizeHeaders(c.req.raw.headers);
  c.set('safeHeaders', safeHeaders);

  return next();
});

/**
 * Middleware que escapa HTML en las respuestas JSON
 * Útil para prevenir XSS en datos devueltos al cliente
 */
export const escapeResponseMiddleware = createMiddleware(async (c, next) => {
  await next();

  // Obtener la respuesta
  const response = c.res;
  
  // Si es JSON, escapar strings
  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      const data = await response.clone().json().catch(() => null);
      if (data) {
        const escaped = escapeHtmlObject(data);
        return c.json(escaped);
      }
    } catch {
      // Si no se puede parsear, continuar con respuesta original
    }
  }
});
