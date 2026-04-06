import { createMiddleware } from 'hono/factory';
import { validateCsrfToken, extractCsrfTokenFromHeader, extractCsrfTokenFromCookie } from '../utils/csrf';

/**
 * Middleware de protección CSRF
 * Valida que las solicitudes que modifican estado incluyan un token CSRF válido
 * 
 * Usa el patrón double-submit cookie:
 * 1. El token se almacena en una cookie (csrf-token)
 * 2. El token se envía en el header X-CSRF-Token
 * 3. Se valida que ambos tokens coincidan
 */
export const csrfProtection = createMiddleware(async (c, next) => {
  // Solo validar métodos que modifican estado
  const method = c.req.method;
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!stateChangingMethods.includes(method)) {
    // Métodos seguros (GET, HEAD, OPTIONS) no requieren CSRF
    return next();
  }

  // Obtener token del header
  const headerToken = extractCsrfTokenFromHeader(c.req.header('X-CSRF-Token'));
  
  // Obtener token de la cookie
  const cookieHeader = c.req.header('Cookie');
  const cookieToken = extractCsrfTokenFromCookie(cookieHeader, 'csrf-token');

  // Validar que ambos tokens existan
  if (!headerToken || !cookieToken) {
    return c.json(
      {
        error: 'Token CSRF faltante',
        message: 'Se requiere un token CSRF válido para esta operación',
      },
      403
    );
  }

  // Validar que los tokens coincidan
  if (headerToken !== cookieToken) {
    return c.json(
      {
        error: 'Token CSRF inválido',
        message: 'El token CSRF no coincide',
      },
      403
    );
  }

  // Validar que el token tenga el formato correcto
  const isValid = await validateCsrfToken(headerToken);
  if (!isValid) {
    return c.json(
      {
        error: 'Token CSRF inválido',
        message: 'El token CSRF no es válido',
      },
      403
    );
  }

  // Token válido, continuar
  return next();
});

/**
 * Middleware de CSRF opcional
 * Solo valida si el token está presente, pero no lo requiere
 * Útil para rutas que pueden o no tener CSRF dependiendo del contexto
 */
export const optionalCsrfProtection = createMiddleware(async (c, next) => {
  const method = c.req.method;
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!stateChangingMethods.includes(method)) {
    return next();
  }

  const headerToken = extractCsrfTokenFromHeader(c.req.header('X-CSRF-Token'));
  const cookieHeader = c.req.header('Cookie');
  const cookieToken = extractCsrfTokenFromCookie(cookieHeader, 'csrf-token');

  // Si hay tokens, validarlos
  if (headerToken && cookieToken) {
    const isValid = await validateCsrfToken(headerToken);
    if (headerToken !== cookieToken || !isValid) {
      return c.json(
        {
          error: 'Token CSRF inválido',
          message: 'El token CSRF proporcionado no es válido',
        },
        403
      );
    }
  }

  return next();
});
