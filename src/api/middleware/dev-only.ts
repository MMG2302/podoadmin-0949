import { createMiddleware } from 'hono/factory';

/**
 * Restringe rutas solo a entornos no productivos.
 * Si DEV_API_SECRET está definido, exige el header X-Dev-Secret con el mismo valor.
 */
export const requireNonProductionDev = createMiddleware(async (c, next) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ error: 'No encontrado' }, 404);
  }

  const secret = process.env.DEV_API_SECRET?.trim();
  if (secret) {
    const provided = c.req.header('X-Dev-Secret')?.trim();
    if (!provided || provided !== secret) {
      return c.json(
        { error: 'Acceso denegado', message: 'Se requiere credencial de desarrollo válida' },
        403
      );
    }
  }

  return next();
});
