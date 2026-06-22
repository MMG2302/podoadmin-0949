import { createMiddleware } from 'hono/factory';
import { resolveSystemAccessCached } from '../utils/access-cache';

/**
 * Bloquea acceso si no hay grant de super_admin ni pago Stripe acreditado.
 */
export const requireActiveSubscription = createMiddleware(async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json(
      { error: 'No autorizado', message: 'Se requiere autenticación' },
      401
    );
  }

  const access = await resolveSystemAccessCached(user.userId, user.role);
  if (!access.granted) {
    return c.json(
      {
        error: 'access_not_granted',
        message: access.message ?? 'Tu acceso no está activo. Completa el pago o contacta al administrador.',
        billingPath: '/billing',
      },
      402
    );
  }

  return next();
});
