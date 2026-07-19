import { createMiddleware } from 'hono/factory';
import { resolveSystemAccessCached } from '../utils/access-cache';
import { entitlementsForTier, type FeatureKey } from '../utils/plan-entitlements';

/**
 * Bloquea la ruta si el plan contratado no incluye la funcionalidad.
 * Ortogonal al rol: aplicar después de requireAuth (y de los permisos de rol si los hay).
 */
export function requireFeature(feature: FeatureKey) {
  return createMiddleware(async (c, next) => {
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
          billingPath: '/settings?tab=billing',
        },
        402
      );
    }

    // Entradas de caché anteriores al deploy pueden no traer entitlements: derivar del tier.
    const entitlements = access.entitlements ?? entitlementsForTier(access.planTier ?? 'base');
    if (!entitlements[feature]) {
      return c.json(
        {
          error: 'feature_not_included',
          feature,
          requiredTier: 'premium',
          message: 'Esta funcionalidad está disponible en el plan Premium.',
          billingPath: '/settings?tab=billing',
        },
        402
      );
    }

    return next();
  });
}
