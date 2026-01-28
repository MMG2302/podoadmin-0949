import { Hono } from 'hono';
import { eq, or, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { validateData, createUserSchema, updateUserSchema } from '../utils/validation';
import { database } from '../database';
import { createdUsers } from '../database/schema';
import { hashPassword } from '../utils/password';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';

const usersRoutes = new Hono();
usersRoutes.use('*', requireAuth);

function safeJsonParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mapDbUser(row: typeof createdUsers.$inferSelect) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    clinicId: row.clinicId ?? undefined,
    assignedPodiatristIds: row.assignedPodiatristIds ? safeJsonParseArray(row.assignedPodiatristIds) : undefined,
    isBlocked: !!row.isBlocked,
    isBanned: !!row.isBanned,
    isEnabled: row.isEnabled !== undefined ? !!row.isEnabled : true,
    emailVerified: !!row.emailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy ?? undefined,
  };
}

async function getUserRowByAnyId(userIdOrId: string) {
  const rows = await database
    .select()
    .from(createdUsers)
    .where(or(eq(createdUsers.id, userIdOrId), eq(createdUsers.userId, userIdOrId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * GET /api/users
 * - super_admin/admin: todos
 * - clinic_admin: solo usuarios de su clínica (opcional role=...)
 */
usersRoutes.get('/', requireRole('super_admin', 'admin', 'clinic_admin'), async (c) => {
  try {
    const requester = c.get('user');
    const roleFilter = c.req.query('role');

    let rows = await database.select().from(createdUsers);

    if (requester.role === 'clinic_admin') {
      if (!requester.clinicId) return c.json({ success: true, users: [] });
      rows = rows.filter((u) => u.clinicId === requester.clinicId);
    }
    if (roleFilter) rows = rows.filter((u) => u.role === roleFilter);

    return c.json({ success: true, users: rows.map(mapDbUser) });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return c.json({ error: 'Error interno', message: 'Error al obtener usuarios' }, 500);
  }
});

/**
 * GET /api/users/:userId
 * super_admin/admin, el mismo usuario, o clinic_admin si pertenece a su clínica
 */
usersRoutes.get('/:userId', async (c) => {
  try {
    const requester = c.get('user');
    const userId = c.req.param('userId');
    const row = await getUserRowByAnyId(userId);
    if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);

    const canAccess =
      requester.role === 'super_admin' ||
      requester.role === 'admin' ||
      requester.userId === row.userId ||
      (requester.role === 'clinic_admin' && requester.clinicId && row.clinicId === requester.clinicId);

    if (!canAccess) {
      return c.json({ error: 'Acceso denegado', message: 'No tienes permisos para ver este usuario' }, 403);
    }

    return c.json({ success: true, user: mapDbUser(row) });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return c.json({ error: 'Error interno', message: 'Error al obtener usuario' }, 500);
  }
});

/**
 * POST /api/users
 * Crea un nuevo usuario (super_admin)
 */
usersRoutes.post('/', requireRole('super_admin'), async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(createUserSchema, rawBody);
    if (!validation.success) {
      return c.json({ error: 'Datos inválidos', message: validation.error, issues: validation.issues }, 400);
    }

    const { email, name, role, clinicId, password } = validation.data;
    const requester = c.get('user');
    const emailLower = email.toLowerCase().trim();

    const existing = await database.select().from(createdUsers).where(eq(createdUsers.email, emailLower)).limit(1);
    if (existing.length) return c.json({ error: 'Datos inválidos', message: 'Ya existe una cuenta con este correo electrónico' }, 400);

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const hashedPwd = await hashPassword(password);

    await database.insert(createdUsers).values({
      id,
      userId: id,
      email: emailLower,
      name,
      role,
      clinicId: clinicId || null,
      password: hashedPwd,
      createdAt: now,
      updatedAt: now,
      createdBy: requester.userId,
      isBlocked: false,
      isBanned: false,
      isEnabled: true,
      emailVerified: false,
      termsAccepted: false,
      termsAcceptedAt: null,
      registrationSource: 'admin',
      assignedPodiatristIds: null,
      googleId: null,
      appleId: null,
      oauthProvider: null,
      avatarUrl: null,
    } as any);

    await logAuditEvent({
      userId: requester.userId,
      action: 'CREATE_USER',
      resourceType: 'user',
      resourceId: id,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: c.req.header('User-Agent') || undefined,
      details: { email: emailLower, role, clinicId: clinicId || null },
    });

    const row = await getUserRowByAnyId(id);
    return c.json({ success: true, user: mapDbUser(row!) }, 201);
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    return c.json({ error: 'Error al crear usuario', message: error.message || 'Error desconocido' }, 400);
  }
});

/**
 * PUT /api/users/:userId
 * Actualiza un usuario (super_admin)
 */
usersRoutes.put('/:userId', requireRole('super_admin'), async (c) => {
  try {
    const userId = c.req.param('userId');
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(updateUserSchema, rawBody);
    if (!validation.success) {
      return c.json({ error: 'Datos inválidos', message: validation.error, issues: validation.issues }, 400);
    }

    const existing = await getUserRowByAnyId(userId);
    if (!existing) return c.json({ error: 'Usuario no encontrado' }, 404);

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (validation.data.email !== undefined) updateData.email = String(validation.data.email).toLowerCase().trim();
    if (validation.data.name !== undefined) updateData.name = validation.data.name;
    if (validation.data.role !== undefined) updateData.role = validation.data.role;
    if (validation.data.clinicId !== undefined) updateData.clinicId = validation.data.clinicId || null;
    if ((validation.data as any).assignedPodiatristIds !== undefined) {
      updateData.assignedPodiatristIds = JSON.stringify((validation.data as any).assignedPodiatristIds || []);
    }
    if ((validation.data as any).password) {
      updateData.password = await hashPassword(String((validation.data as any).password));
    }

    await database.update(createdUsers).set(updateData).where(eq(createdUsers.id, existing.id));

    const requester = c.get('user');
    await logAuditEvent({
      userId: requester.userId,
      action: 'UPDATE_USER',
      resourceType: 'user',
      resourceId: existing.id,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: c.req.header('User-Agent') || undefined,
      details: { userId: existing.id, updates: Object.keys(updateData) },
    });

    const row = await getUserRowByAnyId(existing.id);
    return c.json({ success: true, user: mapDbUser(row!) });
  } catch (error: any) {
    console.error('Error actualizando usuario:', error);
    return c.json({ error: 'Error interno', message: error.message || 'Error al actualizar usuario' }, 500);
  }
});

/**
 * DELETE /api/users/:userId (super_admin)
 */
usersRoutes.delete('/:userId', requireRole('super_admin'), async (c) => {
  try {
    const userId = c.req.param('userId');
    const row = await getUserRowByAnyId(userId);
    if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
    await database.delete(createdUsers).where(eq(createdUsers.id, row.id));
    await logAuditEvent({
      userId: c.get('user').userId,
      action: 'DELETE_USER',
      resourceType: 'user',
      resourceId: row.id,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: c.req.header('User-Agent') || undefined,
    });
    return c.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return c.json({ error: 'Error interno', message: 'Error al eliminar usuario' }, 500);
  }
});

async function setUserFlag(id: string, updates: Partial<typeof createdUsers.$inferInsert>) {
  await database.update(createdUsers).set({ ...updates, updatedAt: new Date().toISOString() } as any).where(eq(createdUsers.id, id));
}

usersRoutes.post('/:userId/block', requireRole('super_admin'), async (c) => {
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  await setUserFlag(row.id, { isBlocked: true } as any);
  return c.json({ success: true });
});
usersRoutes.post('/:userId/unblock', requireRole('super_admin'), async (c) => {
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  await setUserFlag(row.id, { isBlocked: false } as any);
  return c.json({ success: true });
});
usersRoutes.post('/:userId/ban', requireRole('super_admin'), async (c) => {
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  await setUserFlag(row.id, { isBanned: true } as any);
  return c.json({ success: true });
});
usersRoutes.post('/:userId/unban', requireRole('super_admin'), async (c) => {
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  await setUserFlag(row.id, { isBanned: false } as any);
  return c.json({ success: true });
});
usersRoutes.post('/:userId/enable', requireRole('super_admin'), async (c) => {
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  await setUserFlag(row.id, { isEnabled: true } as any);
  return c.json({ success: true });
});
usersRoutes.post('/:userId/disable', requireRole('super_admin'), async (c) => {
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  await setUserFlag(row.id, { isEnabled: false } as any);
  return c.json({ success: true });
});

/**
 * GET /api/users/:userId/status
 */
usersRoutes.get('/:userId/status', requireRole('super_admin', 'admin'), async (c) => {
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  return c.json({
    success: true,
    status: {
      isBlocked: !!row.isBlocked,
      isBanned: !!row.isBanned,
      isEnabled: row.isEnabled !== undefined ? !!row.isEnabled : true,
      emailVerified: !!row.emailVerified,
    },
  });
});

export default usersRoutes;

