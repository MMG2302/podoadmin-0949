import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import {
  getMetricsByType,
  getMetricsByTimeRange,
  getSecurityStats,
} from '../utils/security-metrics';
import { validateQuery, securityMetricTypeSchema, timeRangeQuerySchema, limitQuerySchema } from '../utils/validation';
import { sanitizePathParam } from '../utils/sanitization';

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
    const rangeResult = validateQuery(
      timeRangeQuerySchema.pick({ startTime: true, endTime: true }),
      c.req.query()
    );
    if (!rangeResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: rangeResult.error, issues: rangeResult.issues }, 400);
    }
    const { startTime, endTime } = rangeResult.data;

    const stats = await getSecurityStats(startTime, endTime);

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
    const typeParam = sanitizePathParam(c.req.param('type'), 64);
    if (!typeParam) {
      return c.json({ error: 'Tipo inválido', message: 'Parámetro type no válido' }, 400);
    }
    const typeResult = securityMetricTypeSchema.safeParse(typeParam);
    if (!typeResult.success) {
      return c.json({ error: 'Tipo inválido', message: 'Tipo de métrica no reconocido' }, 400);
    }
    const limitResult = validateQuery(limitQuerySchema, c.req.query());
    if (!limitResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: limitResult.error, issues: limitResult.issues }, 400);
    }

    const metrics = await getMetricsByType(typeResult.data, limitResult.data.limit);

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
    const rangeResult = validateQuery(timeRangeQuerySchema, c.req.query());
    if (!rangeResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: rangeResult.error, issues: rangeResult.issues }, 400);
    }
    const { startTime, endTime, limit } = rangeResult.data;

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
