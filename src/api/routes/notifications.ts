import { Hono } from 'hono';
import { eq, desc, and, count } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import { notifications as notificationsTable } from '../database/schema';
import {
  assertCanNotifyUser,
  isClientNotificationType,
} from '../security/notification-policy';
import { createNotification } from '../utils/notifications-service';
import { checkAndRecordActionRateLimit } from '../utils/action-rate-limit';
import { sanitizePathParam } from '../utils/sanitization';

const notificationsRoutes = new Hono();
notificationsRoutes.use('*', requireAuth);

const createNotificationBodySchema = z.object({
  userId: z.string().min(1).max(128).optional(),
  type: z.string().min(1).max(32),
  title: z.string().min(1).max(500),
  message: z.string().min(1).max(5000),
  metadata: z.record(z.unknown()).optional(),
});

type NotificationType = 'reassignment' | 'appointment' | 'credit' | 'system' | 'admin_message';

function mapRow(row: typeof notificationsTable.$inferSelect) {
  let metadata: Record<string, unknown> | undefined;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata) as Record<string, unknown>;
    } catch {
      /* */
    }
  }
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    read: row.read,
    createdAt: row.createdAt,
    metadata,
  };
}

/**
 * POST /api/notifications
 * Crear notificación con política estricta de destinatario y tipo.
 * Preferir notificaciones generadas en el servidor (citas, reasignaciones).
 */
notificationsRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const rawBody = await c.req.json().catch(() => ({}));
    const parsed = createNotificationBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json(
        { error: 'Datos inválidos', message: 'Cuerpo de notificación inválido', issues: parsed.error.flatten() },
        400
      );
    }

    const rateLimit = await checkAndRecordActionRateLimit('notification_create', user.userId, 30, 60_000);
    if (!rateLimit.allowed) {
      c.header('Retry-After', String(rateLimit.retryAfterSeconds ?? 60));
      return c.json(
        { error: 'rate_limit', message: 'Demasiadas notificaciones en poco tiempo' },
        429
      );
    }

    const { title, message, metadata } = parsed.data;
    const requestedType = parsed.data.type.trim();

    if (!isClientNotificationType(requestedType)) {
      return c.json(
        {
          error: 'Tipo no permitido',
          message:
            'Este endpoint no admite notificaciones administrativas. Usa los flujos de negocio del servidor.',
        },
        403
      );
    }

    const targetUserId = (parsed.data.userId ?? user.userId).trim();
    const policy = await assertCanNotifyUser(user, targetUserId, requestedType);
    if (!policy.allowed) {
      return c.json({ error: 'Acceso denegado', message: policy.message }, 403);
    }

    const id = await createNotification({
      userId: policy.recipientUserId,
      type: requestedType,
      title,
      message,
      metadata: {
        ...metadata,
        fromUserId: user.userId,
      },
    });

    const [row] = await database.select().from(notificationsTable).where(eq(notificationsTable.id, id)).limit(1);
    return c.json({ success: true, notification: row ? mapRow(row) : null });
  } catch (err) {
    console.error('Error creando notificación:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/notifications
 * Lista notificaciones del usuario autenticado
 */
notificationsRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const userId = user.userId;
    const unreadOnly = c.req.query('unread') === '1';
    const type = c.req.query('type');
    const includeUnreadCount = c.req.query('includeUnreadCount') === '1';
    const limitRaw = parseInt(c.req.query('limit') || '100', 10);
    const offsetRaw = parseInt(c.req.query('offset') || '0', 10);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 100, 1), 500);
    const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0);

    const conditions = [eq(notificationsTable.userId, userId)];
    if (unreadOnly) conditions.push(eq(notificationsTable.read, false));
    if (type) conditions.push(eq(notificationsTable.type, type));
    const where = and(...conditions);

    const rows = await database
      .select()
      .from(notificationsTable)
      .where(where)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const notifications = rows.map(mapRow);

    let unreadCount: number | undefined;
    if (includeUnreadCount) {
      const [row] = await database
        .select({ value: count() })
        .from(notificationsTable)
        .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
      unreadCount = row?.value ?? 0;
    }

    return c.json({
      success: true,
      notifications,
      pagination: { limit, offset, hasMore: rows.length === limit },
      ...(includeUnreadCount ? { unreadCount } : {}),
    });
  } catch (err) {
    console.error('Error listando notificaciones:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/notifications/unread-count
 */
notificationsRoutes.get('/unread-count', async (c) => {
  try {
    const user = c.get('user');
    const userId = user.userId;
    const [row] = await database
      .select({ value: count() })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
    const unreadCount = row?.value ?? 0;
    return c.json({ success: true, unreadCount });
  } catch (err) {
    console.error('Error obteniendo unread-count:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
notificationsRoutes.patch('/:id/read', async (c) => {
  try {
    const user = c.get('user');
    const id = sanitizePathParam(c.req.param('id'), 64);
    if (!id) return c.json({ error: 'ID de notificación inválido' }, 400);

    const rows = await database.select().from(notificationsTable).where(eq(notificationsTable.id, id)).limit(1);
    if (!rows.length) return c.json({ error: 'Notificación no encontrada' }, 404);
    if (rows[0].userId !== user.userId) return c.json({ error: 'Acceso denegado' }, 403);

    await database.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id));
    return c.json({ success: true });
  } catch (err) {
    console.error('Error marcando notificación:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/notifications/read-all
 */
notificationsRoutes.post('/read-all', async (c) => {
  try {
    const user = c.get('user');
    const userId = user.userId;

    await database.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.userId, userId));
    return c.json({ success: true });
  } catch (err) {
    console.error('Error marcando todas como leídas:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * DELETE /api/notifications/:id
 */
notificationsRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = sanitizePathParam(c.req.param('id'), 64);
    if (!id) return c.json({ error: 'ID de notificación inválido' }, 400);

    const rows = await database.select().from(notificationsTable).where(eq(notificationsTable.id, id)).limit(1);
    if (!rows.length) return c.json({ error: 'Notificación no encontrada' }, 404);
    if (rows[0].userId !== user.userId) return c.json({ error: 'Acceso denegado' }, 403);

    await database.delete(notificationsTable).where(eq(notificationsTable.id, id));
    return c.json({ success: true });
  } catch (err) {
    console.error('Error eliminando notificación:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default notificationsRoutes;
