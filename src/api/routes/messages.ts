import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { database } from '../database';
import { sentMessages as sentMessagesTable, notifications as notificationsTable } from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';

const messagesRoutes = new Hono();
messagesRoutes.use('*', requireAuth);

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function mapSentMessage(row: typeof sentMessagesTable.$inferSelect) {
  let recipientIds: string[] = [];
  try {
    recipientIds = JSON.parse(row.recipientIds || '[]') as string[];
  } catch {
    /* */
  }
  return {
    id: row.id,
    senderId: row.senderId,
    senderName: row.senderName,
    subject: row.subject,
    body: row.body,
    recipientIds,
    recipientType: row.recipientType as 'all' | 'specific' | 'single',
    sentAt: row.sentAt,
  };
}

/**
 * GET /api/messages
 * Lista mensajes enviados por el usuario (super_admin) con readStatus por mensaje
 */
messagesRoutes.get('/', requireRole('super_admin'), async (c) => {
  try {
    const user = c.get('user');
    const rows = await database
      .select()
      .from(sentMessagesTable)
      .where(eq(sentMessagesTable.senderId, user.userId))
      .orderBy(desc(sentMessagesTable.sentAt))
      .limit(200);
    const messages = rows.map(mapSentMessage);

    const adminNotifs = await database.select().from(notificationsTable).where(eq(notificationsTable.type, 'admin_message'));
    const byMessageId: Record<string, { total: number; read: number }> = {};
    for (const n of adminNotifs) {
      try {
        const m = JSON.parse(n.metadata || '{}') as { messageId?: string };
        const mid = m.messageId;
        if (!mid) continue;
        if (!byMessageId[mid]) byMessageId[mid] = { total: 0, read: 0 };
        byMessageId[mid].total += 1;
        if (n.read) byMessageId[mid].read += 1;
      } catch {
        /* */
      }
    }
    const messagesWithStatus = messages.map((msg) => ({
      ...msg,
      readStatus: byMessageId[msg.id] ? { total: byMessageId[msg.id].total, read: byMessageId[msg.id].read, unread: byMessageId[msg.id].total - byMessageId[msg.id].read } : { total: 0, read: 0, unread: 0 },
    }));

    return c.json({ success: true, messages: messagesWithStatus });
  } catch (err) {
    console.error('Error listando mensajes:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/messages/:id/read-status
 * Devuelve { total, read, unread } para un mensaje (notificaciones admin_message con metadata.messageId)
 */
messagesRoutes.get('/:id/read-status', requireRole('super_admin'), async (c) => {
  try {
    const user = c.get('user');
    const messageId = c.req.param('id');

    const rows = await database.select().from(sentMessagesTable).where(eq(sentMessagesTable.id, messageId)).limit(1);
    if (!rows.length) return c.json({ error: 'Mensaje no encontrado' }, 404);
    if (rows[0].senderId !== user.userId) return c.json({ error: 'Acceso denegado' }, 403);

    const allNotifs = await database.select().from(notificationsTable).where(eq(notificationsTable.type, 'admin_message'));
    const messageNotifs = allNotifs.filter((n) => {
      if (!n.metadata) return false;
      try {
        const m = JSON.parse(n.metadata) as { messageId?: string };
        return m.messageId === messageId;
      } catch {
        return false;
      }
    });
    const read = messageNotifs.filter((n) => n.read).length;
    return c.json({
      success: true,
      readStatus: {
        total: messageNotifs.length,
        read,
        unread: messageNotifs.length - read,
      },
    });
  } catch (err) {
    console.error('Error obteniendo read-status:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/messages
 * Enviar mensaje: crea sent_message y notificaciones para cada destinatario
 * Body: { subject, body, recipientIds, recipientType }
 */
messagesRoutes.post('/', requireRole('super_admin'), async (c) => {
  try {
    const user = c.get('user');
    const body = (await c.req.json().catch(() => ({}))) as {
      subject?: string;
      body?: string;
      recipientIds?: string[];
      recipientType?: 'all' | 'specific' | 'single';
    };
    const subject = (body.subject || '').trim();
    const messageBody = (body.body || '').trim();
    const recipientIds = Array.isArray(body.recipientIds) ? body.recipientIds : [];
    const recipientType = body.recipientType || 'specific';

    if (!subject || !messageBody) return c.json({ error: 'subject y body son requeridos' }, 400);
    if (recipientIds.length === 0) return c.json({ error: 'recipientIds no puede estar vacío' }, 400);

    const id = generateId();
    const now = new Date().toISOString();

    await database.insert(sentMessagesTable).values({
      id,
      senderId: user.userId,
      senderName: user.name || '',
      subject,
      body: messageBody,
      recipientIds: JSON.stringify(recipientIds),
      recipientType,
      sentAt: now,
    });

    for (const recipientId of recipientIds) {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${recipientId.slice(0, 8)}`;
      await database.insert(notificationsTable).values({
        id: notifId,
        userId: recipientId,
        type: 'admin_message',
        title: subject,
        message: messageBody,
        read: false,
        metadata: JSON.stringify({
          senderId: user.userId,
          senderName: user.name,
          messageId: id,
          sentAt: now,
          subject,
        }),
        createdAt: now,
      });
    }

    await logAuditEvent({
      userId: user.userId,
      action: 'CREATE',
      resourceType: 'message',
      resourceId: id,
      details: { action: 'admin_message_sent', recipientCount: recipientIds.length, recipientType, subject },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: c.req.header('User-Agent') ?? undefined,
    });

    const [row] = await database.select().from(sentMessagesTable).where(eq(sentMessagesTable.id, id)).limit(1);
    return c.json({ success: true, message: row ? mapSentMessage(row) : null });
  } catch (err) {
    console.error('Error enviando mensaje:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default messagesRoutes;
