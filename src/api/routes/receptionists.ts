import { Hono } from 'hono';
import { eq, and, inArray } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import { createdUsers, userCredits } from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import { hashPassword } from '../utils/password';

const receptionistsRoutes = new Hono();

receptionistsRoutes.use('*', requireAuth);

// UUID criptográfico: evita acceso por rutas predecibles
function generateId() {
  return `user_created_${crypto.randomUUID().replace(/-/g, '')}`;
}

function toCreatedUser(row: typeof createdUsers.$inferSelect) {
  let assigned: string[] = [];
  if (row.assignedPodiatristIds) {
    try {
      assigned = JSON.parse(row.assignedPodiatristIds) as string[];
    } catch {
      assigned = [];
    }
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as 'receptionist',
    clinicId: row.clinicId ?? undefined,
    assignedPodiatristIds: assigned,
    createdAt: row.createdAt,
    createdBy: row.createdBy ?? '',
  };
}

/**
 * GET /api/receptionists
 * Lista recepcionistas creados por el usuario actual (podólogo independiente) o de su clínica (clinic_admin)
 */
receptionistsRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  // - clinic_admin: ver todas las recepcionistas de su clínica
  // - podiatrist: ver las recepcionistas que él mismo creó (modo independiente)
  const whereClause =
    user.role === 'clinic_admin' && user.clinicId
      ? and(eq(createdUsers.role, 'receptionist'), eq(createdUsers.clinicId, user.clinicId))
      : and(eq(createdUsers.role, 'receptionist'), eq(createdUsers.createdBy, user.userId));

  const rows = await database.select().from(createdUsers).where(whereClause);
  const list = rows.map(toCreatedUser);
  return c.json({ success: true, receptionists: list });
});

/**
 * POST /api/receptionists
 * Crea una recepcionista (podólogo independiente). Body: { name, email, password }
 */
receptionistsRoutes.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  if (user.role !== 'podiatrist' && user.role !== 'clinic_admin') {
    return c.json({ error: 'Solo podólogos o administradores de clínica pueden crear recepcionistas' }, 403);
  }
  const body = (await c.req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string };
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!name || !email || !password) {
    return c.json({ error: 'Nombre, email y contraseña son requeridos' }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, 400);
  }
  const existing = await database.select().from(createdUsers).where(eq(createdUsers.email, email)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: 'Ya existe una cuenta con este correo electrónico' }, 400);
  }
  const id = generateId();
  const now = new Date().toISOString();
  const assignedPodiatristIds = user.role === 'podiatrist' ? [user.userId] : undefined;
  const hashedPwd = await hashPassword(password);
  await database.insert(createdUsers).values({
    id,
    userId: id,
    email,
    name,
    role: 'receptionist',
    clinicId: user.clinicId ?? null,
    assignedPodiatristIds: assignedPodiatristIds ? JSON.stringify(assignedPodiatristIds) : null,
    password: hashedPwd,
    createdAt: now,
    updatedAt: now,
    createdBy: user.userId,
    mustChangePassword: true,
  } as any);
  await database.insert(userCredits).values({
    userId: id,
    totalCredits: 0,
    usedCredits: 0,
    createdAt: now,
    updatedAt: now,
  });
  await logAuditEvent({
    userId: user.userId,
    action: 'CREATE',
    resourceType: 'receptionist',
    resourceId: id,
    details: { action: 'receptionist_create_by_podiatrist', receptionistEmail: email, podiatristId: user.userId },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId: user.clinicId ?? undefined,
  });
  const inserted = (await database.select().from(createdUsers).where(eq(createdUsers.id, id)).limit(1))[0];
  return c.json({ success: true, user: toCreatedUser(inserted) }, 201);
});

/**
 * GET /api/receptionists/assigned-podiatrists/:receptionistId
 * Devuelve los podólogos asignados a una recepcionista.
 * Respuesta: { assignedPodiatristIds: string[], podiatrists: { id, name }[] }
 */
receptionistsRoutes.get('/assigned-podiatrists/:receptionistId', async (c) => {
  const user = c.get('user');
  const receptionistId = c.req.param('receptionistId');
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  const rows = await database.select().from(createdUsers).where(eq(createdUsers.id, receptionistId)).limit(1);
  const row = rows[0];
  if (!row || row.role !== 'receptionist') return c.json({ error: 'Recepcionista no encontrada' }, 404);
  const canAccess = user.role === 'super_admin' || user.role === 'admin' || row.createdBy === user.userId || (user.clinicId && row.clinicId === user.clinicId);
  if (!canAccess) return c.json({ error: 'Acceso denegado' }, 403);
  let ids: string[] = [];
  if (row.assignedPodiatristIds) {
    try {
      ids = JSON.parse(row.assignedPodiatristIds) as string[];
    } catch {
      ids = [];
    }
  }
  let podiatrists: { id: string; name: string }[] = [];
  if (ids.length > 0) {
    const podRows = await database
      .select({ id: createdUsers.id, name: createdUsers.name })
      .from(createdUsers)
      .where(inArray(createdUsers.id, ids));
    podiatrists = podRows;
  }
  return c.json({ success: true, assignedPodiatristIds: ids, podiatrists });
});

/**
 * PATCH /api/receptionists/:receptionistId/assigned-podiatrists
 * Actualiza los podólogos asignados a una recepcionista. Body: { assignedPodiatristIds: string[] }
 */
receptionistsRoutes.patch('/:receptionistId/assigned-podiatrists', async (c) => {
  const user = c.get('user');
  const receptionistId = c.req.param('receptionistId');
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  const rows = await database.select().from(createdUsers).where(eq(createdUsers.id, receptionistId)).limit(1);
  const row = rows[0];
  if (!row || row.role !== 'receptionist') return c.json({ error: 'Recepcionista no encontrada' }, 404);
  const canEdit = user.role === 'super_admin' || user.role === 'admin' || row.createdBy === user.userId || (user.role === 'clinic_admin' && user.clinicId && row.clinicId === user.clinicId);
  if (!canEdit) return c.json({ error: 'Acceso denegado' }, 403);
  const body = (await c.req.json().catch(() => ({}))) as { assignedPodiatristIds?: string[] };
  const ids = Array.isArray(body.assignedPodiatristIds) ? body.assignedPodiatristIds : [];
  await database.update(createdUsers).set({
    assignedPodiatristIds: JSON.stringify(ids),
    updatedAt: new Date().toISOString(),
  }).where(eq(createdUsers.id, receptionistId));
  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'receptionist_assigned_podiatrists',
    resourceId: receptionistId,
    details: { action: 'receptionist_edit_assigned_podiatrists', assignedPodiatristIds: ids },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId: user.clinicId ?? undefined,
  });
  return c.json({ success: true });
});

export default receptionistsRoutes;
