import { createMiddleware } from 'hono/factory';
import { checkRateLimitD1 } from '../utils/rate-limit-d1';

/**
 * Middleware de rate limiting para endpoints de autenticación
 * Usa D1 para persistencia entre Workers y cold starts.
 */
export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  // Obtener identificador (email, IP, etc.)
  const body = await c.req.json().catch(() => ({}));
  const email = body.email;
  
  if (!email) {
    return next(); // Si no hay email, continuar (será validado en la ruta)
  }

  const identifier = email.toLowerCase().trim();
  const rateLimitCheck = await checkRateLimitD1(identifier);

  if (!rateLimitCheck.allowed) {
    const delayMs = rateLimitCheck.delay || 0;
    const delaySeconds = Math.ceil(delayMs / 1000);
    const delayMinutes = Math.ceil(delayMs / 60000);

    if (rateLimitCheck.blockedUntil) {
      const blockedUntilDate = new Date(rateLimitCheck.blockedUntil);
      return c.json(
        {
          error: 'Cuenta temporalmente bloqueada',
          message: `Demasiados intentos fallidos. Tu cuenta está bloqueada hasta ${blockedUntilDate.toLocaleTimeString()}. Por favor, intenta más tarde.`,
          retryAfter: delaySeconds,
          blockedUntil: rateLimitCheck.blockedUntil,
        },
        429
      );
    }

    return c.json(
      {
        error: 'Demasiados intentos',
        message: `Demasiados intentos fallidos. Por favor, espera ${delayMinutes > 1 ? `${delayMinutes} minutos` : `${delaySeconds} segundos`} antes de intentar nuevamente.`,
        retryAfter: delaySeconds,
      },
      429
    );
  }

  return next();
});
