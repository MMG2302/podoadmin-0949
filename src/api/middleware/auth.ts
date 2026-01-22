import { createMiddleware } from 'hono/factory';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { extractCookie } from '../utils/cookies';
import type { JWTPayload } from '../utils/jwt';

// Extender el tipo de contexto de Hono para incluir el usuario
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload | null;
  }
}

/**
 * Middleware de autenticación
 * Verifica el token JWT en cada solicitud y adjunta el usuario al contexto
 * 
 * Prioridad de lectura:
 * 1. Cookie HTTP-only (preferido para seguridad)
 * 2. Header Authorization (compatibilidad)
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  // Intentar leer de cookie primero (más seguro)
  const cookieHeader = c.req.header('Cookie');
  let token = extractCookie(cookieHeader, 'access-token');

  // Si no hay en cookie, intentar header (compatibilidad)
  if (!token) {
    const authHeader = c.req.header('Authorization');
    token = extractTokenFromHeader(authHeader);
  }

  if (!token) {
    c.set('user', null);
    return next();
  }

  const payload = await verifyAccessToken(token);
  c.set('user', payload);

  return next();
});

/**
 * Middleware que requiere autenticación
 * Rechaza solicitudes sin token válido
 */
export const requireAuth = createMiddleware(async (c, next) => {
  const user = c.get('user');

  if (!user) {
    return c.json(
      { error: 'No autorizado', message: 'Se requiere autenticación' },
      401
    );
  }

  return next();
});
