import { createMiddleware } from 'hono/factory';
import { escapeHtmlObject, sanitizeInput } from '../utils/sanitization';

/**
 * Middleware de sanitización
 * Escapa HTML en todos los inputs para prevenir XSS
 */
export const sanitizationMiddleware = createMiddleware(async (c, next) => {
  // Sanitizar query parameters
  const query = c.req.query();
  if (Object.keys(query).length > 0) {
    const sanitizedQuery = sanitizeInput(query);
    // Reemplazar query params sanitizados
    for (const [key, value] of Object.entries(sanitizedQuery)) {
      c.req.query(key, value as string);
    }
  }

  // Sanitizar body si existe
  try {
    const body = await c.req.json().catch(() => null);
    if (body && typeof body === 'object') {
      const sanitizedBody = sanitizeInput(body);
      // Reemplazar body sanitizado
      c.req.json = () => Promise.resolve(sanitizedBody);
    }
  } catch {
    // Si no hay body o no es JSON, continuar
  }

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
