import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import {
  getMetricsByType,
  getMetricsByTimeRange,
  getSecurityStats,
  type SecurityMetricType,
} from '../utils/security-metrics';

const metricsRoutes = new Hono();

// Todas las rutas requieren autenticación
metricsRoutes.use('*', requireAuth);

// Solo super_admin puede ver métricas de seguridad
metricsRoutes.use('*', requireRole('super_admin'));

/**
 * GET /api/security-metrics/stats
 * Obtiene estadísticas generales de seguridad
 */
metricsRoutes.get('/stats', async (c) => {
  try {
    const startTime = c.req.query('startTime');
    const endTime = c.req.query('endTime');

    const stats = await getSecurityStats(startTime || undefined, endTime || undefined);

    return c.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/security-metrics/by-type/:type
 * Obtiene métricas por tipo
 */
metricsRoutes.get('/by-type/:type', async (c) => {
  try {
    const type = c.req.param('type') as SecurityMetricType;
    const limit = parseInt(c.req.query('limit') || '100');

    const metrics = await getMetricsByType(type, limit);

    return c.json({
      success: true,
      metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error('Error obteniendo métricas por tipo:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/security-metrics/by-time-range
 * Obtiene métricas en un rango de tiempo
 */
metricsRoutes.get('/by-time-range', async (c) => {
  try {
    const startTime = c.req.query('startTime');
    const endTime = c.req.query('endTime');
    const limit = parseInt(c.req.query('limit') || '500');

    if (!startTime || !endTime) {
      return c.json(
        { error: 'Parámetros faltantes', message: 'Se requiere startTime y endTime' },
        400
      );
    }

    const metrics = await getMetricsByTimeRange(startTime, endTime, limit);

    return c.json({
      success: true,
      metrics,
      count: metrics.length,
    });
  } catch (error) {
    console.error('Error obteniendo métricas por rango de tiempo:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default metricsRoutes;
