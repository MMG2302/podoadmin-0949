import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import {
  getAuditLogsByUser,
  getAuditLogsByAction,
  getAllAuditLogs,
  logAuditEvent,
  getRecentPrintViolationCount,
} from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { database } from '../database';
import { createdUsers, notifications as notificationsTable } from '../database/schema';

const auditLogRoutes = new Hono();

// Normaliza el registro de auditoría de la base de datos
// al shape usado por el frontend (AuditLog de web/lib/storage)
function mapDbLogToApiLog(log: any) {
  const rawDetails = log.details;
  const detailsString =
    typeof rawDetails === 'string'
      ? rawDetails
      : rawDetails
      ? JSON.stringify(rawDetails)
      : '';

  return {
    id: log.id,
    userId: log.userId,
    userName: log.userName || log.userId, // DB no almacena userName, usamos userId como fallback
    action: log.action,
    entityType: log.resourceType,
    entityId: log.resourceId || '',
    details: detailsString,
    createdAt: log.createdAt,
    // Campos adicionales disponibles para futuros usos
    ipAddress: log.ipAddress || null,
    userAgent: log.userAgent || null,
    clinicId: log.clinicId || null,
  };
}

// Todas las rutas requieren autenticación
auditLogRoutes.use('*', requireAuth);

/**
 * POST /api/audit-logs
 * Registra un evento de auditoría desde el frontend (solo para eventos UI/cliente).
 * IMPORTANTE: Acciones críticas deben registrarse dentro de los endpoints de negocio.
 */
auditLogRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = (await c.req.json().catch(() => ({}))) as {
      action?: string;
      resourceType?: string;
      resourceId?: string;
      details?: Record<string, unknown>;
      clinicId?: string;
    };

    const action = String(body.action ?? '').trim();
    const resourceType = String(body.resourceType ?? '').trim();
    const resourceId = body.resourceId ? String(body.resourceId) : undefined;

    if (!action || !resourceType) {
      return c.json({ error: 'action y resourceType son requeridos' }, 400);
    }

    await logAuditEvent({
      userId: user.userId,
      action,
      resourceType,
      resourceId,
      details: body.details ?? undefined,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: c.req.header('User-Agent') || undefined,
      clinicId: body.clinicId ?? user.clinicId ?? undefined,
    });

    // Si es violación de impresión, comprobar si hay >= 5 en la última hora y notificar a super admins
    if (action === 'PRINT_VIOLATION_FORM') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const count = await getRecentPrintViolationCount(user.userId, oneHourAgo);
      if (count >= 5) {
        const details = (body.details ?? {}) as Record<string, unknown>;
        const violatorName = (details.podiatristName as string) ?? user.userId;
        // Seleccionar userId (no id): las notificaciones se filtran por JWT userId = createdUsers.userId
        const superAdminRows = await database
          .select({ userId: createdUsers.userId })
          .from(createdUsers)
          .where(eq(createdUsers.role, 'super_admin'));
        const now = new Date().toISOString();
        const title = '⚠️ Alerta: Múltiples violaciones de impresión';
        const message = `El usuario ${violatorName} (${user.userId}) ha intentado imprimir desde el formulario 5 veces consecutivas en la última hora. Esto indica un incumplimiento repetido con el servicio otorgado.`;
        const metadata = JSON.stringify({
          fromUserId: user.userId,
          fromUserName: violatorName,
          reason: 'multiple_print_violations_alert',
        });
        for (const row of superAdminRows) {
          const notifId = `notif_${Date.now()}_${row.userId}_${Math.random().toString(36).slice(2, 9)}`;
          await database.insert(notificationsTable).values({
            id: notifId,
            userId: row.userId,
            type: 'system',
            title,
            message,
            read: false,
            metadata,
            createdAt: now,
          });
        }
        await logAuditEvent({
          userId: user.userId,
          action: 'ALERT_MULTIPLE_PRINT_VIOLATIONS',
          resourceType: 'user',
          resourceId: user.userId,
          details: {
            message: 'Alerta generada: 5 intentos consecutivos de impresión desde formulario detectados',
            violations: count,
            timeWindow: '1 hora',
            userId: user.userId,
            userName: violatorName,
            timestamp: now,
          },
        });
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error registrando evento de auditoría:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

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

    const dbLogs = await getAuditLogsByUser(userId, limit);
    const logs = dbLogs.map(mapDbLogToApiLog);

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

      const dbLogs = await getAuditLogsByAction(action, limit);
      const logs = dbLogs.map(mapDbLogToApiLog);

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

    const dbLogs = await getAllAuditLogs(limit);
    const logs = dbLogs.map(mapDbLogToApiLog);

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
