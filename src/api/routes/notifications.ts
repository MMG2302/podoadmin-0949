import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import { notifications as notificationsTable } from '../database/schema';

const notificationsRoutes = new Hono();
notificationsRoutes.use('*', requireAuth);

// UUID criptográfico: evita acceso por rutas predecibles
const generateId = () => `notif_${crypto.randomUUID().replace(/-/g, '')}`;

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
 * Crear notificación (para que calendar/messages puedan escribir en DB)
 * Body: { userId, type, title, message, metadata? }
 */
notificationsRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = (await c.req.json().catch(() => ({}))) as {
      userId?: string;
      type?: string;
      title?: string;
      message?: string;
      metadata?: Record<string, unknown>;
    };
    const userId = body.userId ?? user.userId;
    const type = (body.type as NotificationType) ?? 'system';
    const title = body.title ?? '';
    const message = body.message ?? '';
    const id = generateId();
    const now = new Date().toISOString();

    await database.insert(notificationsTable).values({
      id,
      userId,
      type,
      title,
      message,
      read: false,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      createdAt: now,
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

    let rows = await database
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt));

    if (unreadOnly) rows = rows.filter((r) => !r.read);
    if (type) rows = rows.filter((r) => r.type === type);

    const notifications = rows.map(mapRow);
    return c.json({ success: true, notifications });
  } catch (err) {
    console.error('Error listando notificaciones:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/notifications/unread-count
 * Devuelve el número de notificaciones no leídas del usuario autenticado
 */
notificationsRoutes.get('/unread-count', async (c) => {
  try {
    const user = c.get('user');
    const userId = user.userId;
    const rows = await database
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId));
    const unreadCount = rows.filter((r) => !r.read).length;
    return c.json({ success: true, unreadCount });
  } catch (err) {
    console.error('Error obteniendo unread-count:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marcar una notificación como leída
 */
notificationsRoutes.patch('/:id/read', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

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
 * Marcar todas las notificaciones del usuario como leídas
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
 * Eliminar una notificación
 */
notificationsRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

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
