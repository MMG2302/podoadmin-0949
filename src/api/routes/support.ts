import { Hono } from 'hono';
import { eq, desc, and, ne } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import { supportConversations, supportMessages, createdUsers } from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';

const supportRoutes = new Hono();
supportRoutes.use('*', requireAuth);

const generateId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;

function isSupportRole(role: string) {
  return role === 'super_admin' || role === 'admin';
}

/**
 * POST /api/support/conversations
 * Crear nueva conversación (cualquier usuario autenticado)
 */
supportRoutes.post('/conversations', async (c) => {
  try {
    const user = c.get('user');
    const body = (await c.req.json().catch(() => ({}))) as { subject?: string; message?: string };
    const subject = (body.subject || '').trim().slice(0, 200);
    const messageBody = (body.message || '').trim().slice(0, 5000);

    if (!subject || !messageBody) {
      return c.json({ error: 'Asunto y mensaje son requeridos' }, 400);
    }

    const convId = generateId('sup_conv');
    const msgId = generateId('sup_msg');
    const now = new Date().toISOString();

    await database.insert(supportConversations).values({
      id: convId,
      userId: user.userId,
      subject,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    });

    await database.insert(supportMessages).values({
      id: msgId,
      conversationId: convId,
      senderId: user.userId,
      body: messageBody,
      createdAt: now,
    });

    await logAuditEvent({
      userId: user.userId,
      action: 'CREATE',
      resourceType: 'support_conversation',
      resourceId: convId,
      details: { subject },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    return c.json({
      success: true,
      conversation: {
        id: convId,
        subject,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (err) {
    console.error('Error creando conversación de soporte:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/support/conversations
 * Usuario: sus conversaciones. Admin/SuperAdmin: todas
 */
supportRoutes.get('/conversations', async (c) => {
  try {
    const user = c.get('user');
    const isAdmin = isSupportRole(user.role || '');

    let rows;
    if (isAdmin) {
      rows = await database
        .select({
          id: supportConversations.id,
          userId: supportConversations.userId,
          subject: supportConversations.subject,
          status: supportConversations.status,
          createdAt: supportConversations.createdAt,
          updatedAt: supportConversations.updatedAt,
          userName: createdUsers.name,
          userEmail: createdUsers.email,
        })
        .from(supportConversations)
        .leftJoin(createdUsers, eq(supportConversations.userId, createdUsers.id))
        .orderBy(desc(supportConversations.updatedAt))
        .limit(100);
    } else {
      rows = await database
        .select()
        .from(supportConversations)
        .where(eq(supportConversations.userId, user.userId))
        .orderBy(desc(supportConversations.updatedAt))
        .limit(50);
    }

    const conversations = rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: row.id,
        userId: row.userId,
        subject: row.subject,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        userName: row.userName ?? null,
        userEmail: row.userEmail ?? null,
      };
    });

    return c.json({ success: true, conversations });
  } catch (err) {
    console.error('Error listando conversaciones:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/support/conversations/:id
 * Obtener conversación con mensajes
 */
supportRoutes.get('/conversations/:id', async (c) => {
  try {
    const user = c.get('user');
    const convId = c.req.param('id');
    const isAdmin = isSupportRole(user.role || '');

    const [conv] = await database
      .select()
      .from(supportConversations)
      .where(eq(supportConversations.id, convId))
      .limit(1);

    if (!conv) return c.json({ error: 'Conversación no encontrada' }, 404);
    if (!isAdmin && conv.userId !== user.userId) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const msgRows = await database
      .select()
      .from(supportMessages)
      .where(eq(supportMessages.conversationId, convId))
      .orderBy(supportMessages.createdAt);

    const messages = msgRows.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt,
      readAt: m.readAt,
      isFromSupport: m.senderId !== conv.userId,
    }));

    return c.json({
      success: true,
      conversation: {
        id: conv.id,
        userId: conv.userId,
        subject: conv.subject,
        status: conv.status,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      },
      messages,
    });
  } catch (err) {
    console.error('Error obteniendo conversación:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/support/conversations/:id/messages
 * Enviar mensaje en la conversación
 */
supportRoutes.post('/conversations/:id/messages', async (c) => {
  try {
    const user = c.get('user');
    const convId = c.req.param('id');
    const isAdmin = isSupportRole(user.role || '');
    const body = (await c.req.json().catch(() => ({}))) as { body?: string };
    const messageBody = (body.body || '').trim().slice(0, 5000);

    if (!messageBody) return c.json({ error: 'El mensaje no puede estar vacío' }, 400);

    const [conv] = await database
      .select()
      .from(supportConversations)
      .where(eq(supportConversations.id, convId))
      .limit(1);

    if (!conv) return c.json({ error: 'Conversación no encontrada' }, 404);
    if (conv.status === 'closed' && !isAdmin) {
      return c.json({ error: 'Esta conversación está cerrada' }, 400);
    }

    if (!isAdmin && conv.userId !== user.userId) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const msgId = generateId('sup_msg');
    const now = new Date().toISOString();

    await database.insert(supportMessages).values({
      id: msgId,
      conversationId: convId,
      senderId: user.userId,
      body: messageBody,
      createdAt: now,
    });

    await database
      .update(supportConversations)
      .set({ updatedAt: now })
      .where(eq(supportConversations.id, convId));

    return c.json({
      success: true,
      message: {
        id: msgId,
        senderId: user.userId,
        body: messageBody,
        createdAt: now,
        readAt: null,
        isFromSupport: isAdmin,
      },
    });
  } catch (err) {
    console.error('Error enviando mensaje:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * PATCH /api/support/conversations/:id
 * Marcar mensajes como leídos o cerrar (admin)
 */
supportRoutes.patch('/conversations/:id', async (c) => {
  try {
    const user = c.get('user');
    const convId = c.req.param('id');
    const isAdmin = isSupportRole(user.role || '');
    const body = (await c.req.json().catch(() => ({}))) as { markRead?: boolean; status?: 'open' | 'closed' };

    const [conv] = await database
      .select()
      .from(supportConversations)
      .where(eq(supportConversations.id, convId))
      .limit(1);

    if (!conv) return c.json({ error: 'Conversación no encontrada' }, 404);
    if (!isAdmin && conv.userId !== user.userId) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const now = new Date().toISOString();

    if (body.markRead) {
      // Marcar como leídos los mensajes que recibimos (enviados por el otro)
      const condition = isAdmin
        ? and(eq(supportMessages.conversationId, convId), eq(supportMessages.senderId, conv.userId))
        : and(eq(supportMessages.conversationId, convId), ne(supportMessages.senderId, user.userId));
      await database.update(supportMessages).set({ readAt: now }).where(condition!);
    }

    if (body.status && isAdmin && (body.status === 'open' || body.status === 'closed')) {
      await database
        .update(supportConversations)
        .set({ status: body.status, updatedAt: now })
        .where(eq(supportConversations.id, convId));
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Error actualizando conversación:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default supportRoutes;
