import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import {
  getAuditLogsByUser,
  getAuditLogsByAction,
  getAllAuditLogs,
} from '../utils/audit-log';

const auditLogRoutes = new Hono();

// Todas las rutas requieren autenticación
auditLogRoutes.use('*', requireAuth);

/**
 * GET /api/audit-logs/user/:userId
 * Obtiene logs de auditoría para un usuario específico
 * Requiere: super_admin o el mismo usuario
 */
auditLogRoutes.get('/user/:userId', async (c) => {
  try {
    const user = c.get('user');
    const userId = c.req.param('userId');
    const limit = parseInt(c.req.query('limit') || '100');

    // Verificar permisos: solo super_admin o el mismo usuario
    if (user?.role !== 'super_admin' && user?.userId !== userId) {
      return c.json(
        { error: 'Acceso denegado', message: 'No tienes permisos para ver estos logs' },
        403
      );
    }

    const logs = await getAuditLogsByUser(userId, limit);

    return c.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error obteniendo logs por usuario:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/audit-logs/action/:action
 * Obtiene logs de auditoría por tipo de acción
 * Requiere: super_admin
 */
auditLogRoutes.get(
  '/action/:action',
  requireRole('super_admin'),
  async (c) => {
    try {
      const action = c.req.param('action');
      const limit = parseInt(c.req.query('limit') || '100');

      const logs = await getAuditLogsByAction(action, limit);

      return c.json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (error) {
      console.error('Error obteniendo logs por acción:', error);
      return c.json({ error: 'Error interno' }, 500);
    }
  }
);

/**
 * GET /api/audit-logs/all
 * Obtiene todos los logs de auditoría
 * Requiere: super_admin
 */
auditLogRoutes.get('/all', requireRole('super_admin'), async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '500');

    const logs = await getAllAuditLogs(limit);

    return c.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error obteniendo todos los logs:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default auditLogRoutes;
