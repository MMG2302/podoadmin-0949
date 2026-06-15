import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole, requirePermission } from '../middleware/authorization';
import {
  getAuditLogsByUser,
  getAuditLogsByAction,
  getAllAuditLogs,
  getAuditLogsForExport,
  logAuditEvent,
  getRecentPrintViolationCount,
} from '../utils/audit-log';
import { validateClientAuditBody, sanitizeClientAuditForUser } from '../security/client-audit-policy';
import { validateQuery, auditLogExportQuerySchema, limitQuerySchema, limitQuery500Schema } from '../utils/validation';
import { sanitizePathParam } from '../utils/sanitization';
import { createNotification } from '../utils/notifications-service';
import { checkAndRecordActionRateLimit } from '../utils/action-rate-limit';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import { database } from '../database';
import { createdUsers } from '../database/schema';

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
    const rawBody = await c.req.json().catch(() => ({}));

    const rateLimit = await checkAndRecordActionRateLimit('client_audit', user.userId, 20, 60_000);
    if (!rateLimit.allowed) {
      c.header('Retry-After', String(rateLimit.retryAfterSeconds ?? 60));
      return c.json({ error: 'rate_limit', message: 'Demasiados eventos de auditoría en poco tiempo' }, 429);
    }

    const validation = validateClientAuditBody(rawBody);
    if (!validation.success) {
      return c.json(
        { error: 'Datos inválidos', message: validation.message, issues: validation.issues },
        400
      );
    }

    const sanitized = sanitizeClientAuditForUser(validation.data, user.userId, user.clinicId);
    const { action, resourceType, resourceId, details, clinicId } = sanitized;

    await logAuditEvent({
      userId: user.userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId,
    });

    // Si es violación de impresión, comprobar si hay >= 5 en la última hora y notificar a super admins
    if (action === 'PRINT_VIOLATION_FORM') {
      await createNotification({
        userId: user.userId,
        type: 'system',
        title: 'Incumplimiento detectado',
        message:
          'Está incumpliendo con el servicio otorgado. No se permite imprimir desde el formulario de sesión.',
        metadata: {
          patientId: (details as { patientId?: string })?.patientId,
          violationType: 'print_from_form',
        },
      });
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const count = await getRecentPrintViolationCount(user.userId, oneHourAgo);
      if (count >= 5) {
        const violationDetails = (details ?? {}) as Record<string, unknown>;
        const violatorName = (violationDetails.podiatristName as string) ?? user.userId;
        // Seleccionar userId (no id): las notificaciones se filtran por JWT userId = createdUsers.userId
        const superAdminRows = await database
          .select({ userId: createdUsers.userId })
          .from(createdUsers)
          .where(eq(createdUsers.role, 'super_admin'));
        const now = new Date().toISOString();
        const title = '⚠️ Alerta: Múltiples violaciones de impresión';
        const message = `El usuario ${violatorName} (${user.userId}) ha intentado imprimir desde el formulario 5 veces consecutivas en la última hora. Esto indica un incumplimiento repetido con el servicio otorgado.`;
        for (const row of superAdminRows) {
          await createNotification({
            userId: row.userId,
            type: 'system',
            title,
            message,
            metadata: {
              fromUserId: user.userId,
              fromUserName: violatorName,
              reason: 'multiple_print_violations_alert',
            },
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
    const userId = sanitizePathParam(c.req.param('userId'), 128);
    if (!userId) {
      return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
    }
    const limitResult = validateQuery(limitQuerySchema, c.req.query());
    if (!limitResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: limitResult.error, issues: limitResult.issues }, 400);
    }
    const limit = limitResult.data.limit;

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
      const action = sanitizePathParam(c.req.param('action'), 64);
      if (!action || !/^[A-Z0-9_]+$/.test(action)) {
        return c.json({ error: 'Acción inválida', message: 'Parámetro action no válido' }, 400);
      }
      const limitResult = validateQuery(limitQuerySchema, c.req.query());
      if (!limitResult.success) {
        return c.json({ error: 'Parámetros inválidos', message: limitResult.error, issues: limitResult.issues }, 400);
      }
      const limit = limitResult.data.limit;

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
    const limitResult = validateQuery(limitQuery500Schema, c.req.query());
    if (!limitResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: limitResult.error, issues: limitResult.issues }, 400);
    }
    const limit = limitResult.data.limit;

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

/**
 * GET /api/audit-logs/export
 * Exportación de auditoría para evidencias / compliance (CSV o JSON).
 * Requiere permiso view_audit_log. Parámetros: format=csv|json, from, to, userId, clinicId, action, limit.
 */
auditLogRoutes.get('/export', requirePermission('view_audit_log'), async (c) => {
  try {
    const queryResult = validateQuery(auditLogExportQuerySchema, c.req.query());
    if (!queryResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: queryResult.error, issues: queryResult.issues }, 400);
    }
    const { format, from, to, userId, clinicId, action, limit } = queryResult.data;

    const logs = await getAuditLogsForExport({ from, to, userId, clinicId, action, limit });

    const filename = `auditoria-${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`;

    if (format === 'csv') {
      const header = 'id,userId,action,resourceType,resourceId,details,ipAddress,userAgent,clinicId,createdAt';
      const escapeCsv = (v: unknown): string => {
        if (v == null) return '';
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const rows = logs.map(
        (l) =>
          [l.id, l.userId, l.action, l.resourceType, l.resourceId ?? '', escapeCsv(l.details), l.ipAddress ?? '', l.userAgent ?? '', l.clinicId ?? '', l.createdAt].join(',')
      );
      const csv = [header, ...rows].join('\n');
      c.header('Content-Type', 'text/csv; charset=utf-8');
      c.header('Content-Disposition', `attachment; filename="${filename}"`);
      return c.body(csv, 200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      });
    }

    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.json({ exportedAt: new Date().toISOString(), count: logs.length, logs }, 200, {
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
  } catch (error) {
    console.error('Error exportando auditoría:', error);
    return c.json({ error: 'Error interno', message: 'Error al exportar auditoría' }, 500);
  }
});

export default auditLogRoutes;
