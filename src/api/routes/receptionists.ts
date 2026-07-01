import { Hono } from 'hono';
import { eq, and, inArray, or } from 'drizzle-orm';
import { getCreatedUserByIdOrUserId, invalidateAssignedPodiatristCache } from '../utils/tenant-isolation';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import { createdUsers, userCredits } from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import { hashPassword } from '../utils/password';
import { sanitizePathParam } from '../utils/sanitization';
import {
  assertClinicCanAddActiveReceptionist,
  assertIndependentCanAddReceptionist,
  filterValidClinicPodiatristIds,
  getClinicPodiatristUserIds,
  MAX_CLINIC_ACTIVE_RECEPTIONISTS,
} from '../utils/receptionist-limits';

const receptionistsRoutes = new Hono();

receptionistsRoutes.use('*', requireAuth);

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
    id: row.userId,
    email: row.email,
    name: row.name,
    role: row.role as 'receptionist',
    clinicId: row.clinicId ?? undefined,
    assignedPodiatristIds: assigned,
    isBlocked: row.isBlocked ?? false,
    isEnabled: row.isEnabled !== false,
    mustChangePassword: row.mustChangePassword ?? false,
    createdAt: row.createdAt,
    createdBy: row.createdBy ?? '',
  };
}

function canManageReceptionistAssignments(
  requester: { role: string; userId: string; clinicId?: string | null },
  row: typeof createdUsers.$inferSelect
): boolean {
  if (requester.role === 'super_admin' || requester.role === 'admin') return true;
  if (row.createdBy === requester.userId) return true;
  if (requester.role === 'clinic_admin' && requester.clinicId && row.clinicId === requester.clinicId) {
    return true;
  }
  if (
    requester.role === 'receptionist' &&
    requester.userId === row.userId &&
    row.clinicId
  ) {
    return true;
  }
  return false;
}

/**
 * GET /api/receptionists
 * Lista recepcionistas creados por el usuario actual (podólogo independiente) o de su clínica (clinic_admin)
 */
receptionistsRoutes.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'No autorizado' }, 401);
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
 * Crea una recepcionista (podólogo independiente o clinic_admin). Body: { name, email, password }
 */
receptionistsRoutes.post('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  if (user.role !== 'podiatrist' && user.role !== 'clinic_admin') {
    return c.json({ error: 'Solo podólogos o administradores de clínica pueden crear recepcionistas' }, 403);
  }
  if (user.role === 'podiatrist' && user.clinicId) {
    return c.json(
      {
        error: 'Acceso denegado',
        message: 'Los podólogos de clínica deben pedir al administrador que cree recepcionistas desde Gestión de clínica.',
      },
      403
    );
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

  try {
    if (user.role === 'clinic_admin' && user.clinicId) {
      await assertClinicCanAddActiveReceptionist(user.clinicId);
    } else if (user.role === 'podiatrist') {
      await assertIndependentCanAddReceptionist(user.userId);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Límite de recepcionistas alcanzado';
    return c.json({ error: 'Límite alcanzado', message }, 403);
  }

  const existing = await database.select().from(createdUsers).where(eq(createdUsers.email, email)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: 'Ya existe una cuenta con este correo electrónico' }, 400);
  }

  const id = generateId();
  const now = new Date().toISOString();
  let assignedPodiatristIds: string[] | null = null;
  if (user.role === 'podiatrist') {
    assignedPodiatristIds = [user.userId];
  } else if (user.role === 'clinic_admin' && user.clinicId) {
    assignedPodiatristIds = await getClinicPodiatristUserIds(user.clinicId);
  }

  const hashedPwd = await hashPassword(password);
  await database.insert(createdUsers).values({
    id,
    userId: id,
    email,
    name,
    role: 'receptionist',
    clinicId: user.clinicId ?? null,
    assignedPodiatristIds: assignedPodiatristIds?.length ? JSON.stringify(assignedPodiatristIds) : null,
    password: hashedPwd,
    createdAt: now,
    updatedAt: now,
    createdBy: user.userId,
    isBlocked: false,
    isBanned: false,
    isEnabled: true,
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
    details: {
      action: user.role === 'clinic_admin' ? 'receptionist_create_by_clinic_admin' : 'receptionist_create_by_podiatrist',
      receptionistEmail: email,
      podiatristId: user.userId,
    },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId: user.clinicId ?? undefined,
  });
  const inserted = (await database.select().from(createdUsers).where(eq(createdUsers.id, id)).limit(1))[0];
  return c.json({ success: true, user: toCreatedUser(inserted) }, 201);
});

/**
 * GET /api/receptionists/assigned-podiatrists/:receptionistId
 */
receptionistsRoutes.get('/assigned-podiatrists/:receptionistId', async (c) => {
  const user = c.get('user');
  const receptionistId = sanitizePathParam(c.req.param('receptionistId'), 128);
  if (!receptionistId) return c.json({ error: 'ID de recepcionista inválido' }, 400);
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  const row = await getCreatedUserByIdOrUserId(receptionistId);
  if (!row || row.role !== 'receptionist') return c.json({ error: 'Recepcionista no encontrada' }, 404);
  const canAccess =
    user.role === 'super_admin' ||
    user.role === 'admin' ||
    row.createdBy === user.userId ||
    user.userId === row.userId ||
    (user.clinicId && row.clinicId === user.clinicId);
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
      .select({ userId: createdUsers.userId, name: createdUsers.name })
      .from(createdUsers)
      .where(or(inArray(createdUsers.userId, ids), inArray(createdUsers.id, ids)));
    podiatrists = podRows.map((r) => ({ id: r.userId, name: r.name }));
    ids = podiatrists.map((p) => p.id);
  }
  return c.json({ success: true, assignedPodiatristIds: ids, podiatrists });
});

/**
 * PATCH /api/receptionists/:receptionistId/assigned-podiatrists
 * Actualiza los podólogos asignados a una recepcionista. Body: { assignedPodiatristIds: string[] }
 */
receptionistsRoutes.patch('/:receptionistId/assigned-podiatrists', async (c) => {
  const user = c.get('user');
  const receptionistId = sanitizePathParam(c.req.param('receptionistId'), 128);
  if (!receptionistId) return c.json({ error: 'ID de recepcionista inválido' }, 400);
  if (!user) return c.json({ error: 'No autorizado' }, 401);
  const row = await getCreatedUserByIdOrUserId(receptionistId);
  if (!row || row.role !== 'receptionist') return c.json({ error: 'Recepcionista no encontrada' }, 404);
  if (!canManageReceptionistAssignments(user, row)) {
    return c.json({ error: 'Acceso denegado' }, 403);
  }

  const body = (await c.req.json().catch(() => ({}))) as { assignedPodiatristIds?: string[] };
  let ids = Array.isArray(body.assignedPodiatristIds) ? body.assignedPodiatristIds : [];

  if (row.clinicId) {
    ids = await filterValidClinicPodiatristIds(row.clinicId, ids);
  } else if (user.role === 'receptionist' && user.userId === row.userId) {
    return c.json({ error: 'Acceso denegado', message: 'No puedes modificar la asignación en modo independiente' }, 403);
  }

  await database
    .update(createdUsers)
    .set({
      assignedPodiatristIds: JSON.stringify(ids),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(createdUsers.id, row.id));

  invalidateAssignedPodiatristCache(row.userId);

  await logAuditEvent({
    userId: user.userId,
    action: 'UPDATE',
    resourceType: 'receptionist_assigned_podiatrists',
    resourceId: row.id,
    details: { action: 'receptionist_edit_assigned_podiatrists', assignedPodiatristIds: ids },
    ipAddress: getClientIP(c.req.raw.headers),
    userAgent: getSafeUserAgent(c),
    clinicId: user.clinicId ?? undefined,
  });
  return c.json({ success: true, assignedPodiatristIds: ids });
});

/**
 * GET /api/receptionists/limits
 * Límites de recepcionistas para el contexto actual (clínica o independiente).
 */
receptionistsRoutes.get('/limits', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'No autorizado' }, 401);

  if (user.role === 'clinic_admin' && user.clinicId) {
    const { countActiveReceptionistsForClinic } = await import('../utils/receptionist-limits');
    const activeCount = await countActiveReceptionistsForClinic(user.clinicId);
    return c.json({
      success: true,
      maxActive: MAX_CLINIC_ACTIVE_RECEPTIONISTS,
      activeCount,
      canCreate: activeCount < MAX_CLINIC_ACTIVE_RECEPTIONISTS,
    });
  }

  if (user.role === 'podiatrist' && !user.clinicId) {
    const { countReceptionistsForIndependentPodiatrist, MAX_INDEPENDENT_RECEPTIONISTS } = await import(
      '../utils/receptionist-limits'
    );
    const count = await countReceptionistsForIndependentPodiatrist(user.userId);
    return c.json({
      success: true,
      maxTotal: MAX_INDEPENDENT_RECEPTIONISTS,
      currentCount: count,
      canCreate: count < MAX_INDEPENDENT_RECEPTIONISTS,
    });
  }

  return c.json({ success: true, canCreate: false });
});

export default receptionistsRoutes;
