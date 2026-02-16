import { Hono } from 'hono';
import { eq, or, and, inArray, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { validateData, createUserSchema, updateUserSchema } from '../utils/validation';
import { database } from '../database';
import { createdUsers, userCredits as userCreditsTable, creditTransactions as creditTransactionsTable, clinics as clinicsTable } from '../database/schema';
import { hashPassword } from '../utils/password';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import { deleteUserCascade } from '../utils/delete-user-cascade';

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
    disabledAt: row.disabledAt ?? undefined,
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
 * GET /api/users/visible
 * Lista de usuarios que el usuario actual puede ver (todos los roles).
 * - super_admin/admin: todos
 * - clinic_admin: solo su clínica
 * - receptionist: solo sus podólogos asignados
 * - podiatrist: usuarios de su clínica (para dropdowns en calendario/pacientes)
 */
usersRoutes.get('/visible', async (c) => {
  try {
    const requester = c.get('user');
    const roleFilter = c.req.query('role');

    if (requester.role === 'super_admin' || requester.role === 'admin') {
      let rows = await database.select().from(createdUsers);
      if (roleFilter) rows = rows.filter((u) => u.role === roleFilter);
      return c.json({ success: true, users: rows.map(mapDbUser) });
    }

    if (requester.role === 'clinic_admin') {
      if (!requester.clinicId) return c.json({ success: true, users: [] });
      let rows = await database.select().from(createdUsers).where(eq(createdUsers.clinicId, requester.clinicId));
      if (roleFilter) rows = rows.filter((u) => u.role === roleFilter);
      return c.json({ success: true, users: rows.map(mapDbUser) });
    }

    if (requester.role === 'receptionist') {
      let ids: string[] = [];
      // JWT userId = createdUsers.userId; usar userId para coincidir con login/verify
      const me = await database.select().from(createdUsers).where(eq(createdUsers.userId, requester.userId)).limit(1);
      if (me[0]?.assignedPodiatristIds) {
        try {
          ids = JSON.parse(me[0].assignedPodiatristIds) as string[];
        } catch {
          ids = [];
        }
      }
      if (ids.length === 0) return c.json({ success: true, users: [] });
      // assignedPodiatristIds almacena userId (p. ej. al crear recepcionista desde podólogo); buscar por userId
      const rows = await database.select().from(createdUsers).where(inArray(createdUsers.userId, ids));
      return c.json({ success: true, users: rows.map(mapDbUser) });
    }

    if (requester.role === 'podiatrist' && requester.clinicId) {
      let rows = await database.select().from(createdUsers).where(eq(createdUsers.clinicId, requester.clinicId));
      if (roleFilter) rows = rows.filter((u) => u.role === roleFilter);
      return c.json({ success: true, users: rows.map(mapDbUser) });
    }

    return c.json({ success: true, users: [] });
  } catch (error) {
    console.error('Error obteniendo usuarios visibles:', error);
    return c.json({ error: 'Error interno', message: 'Error al obtener usuarios' }, 500);
  }
});

/**
 * GET /api/users/me/export
 * Exportación de datos del usuario autenticado (GDPR / LFPDPPP – derecho de acceso y portabilidad).
 * Devuelve perfil (sin contraseña), clínica si aplica, créditos, transacciones recientes y últimos logs de auditoría.
 */
usersRoutes.get('/me/export', async (c) => {
  try {
    const user = c.get('user');
    const row = await getUserRowByAnyId(user.userId);
    if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);

    const profile = mapDbUser(row);
    let clinic: Record<string, unknown> | null = null;
    if (row.clinicId) {
      const clinicRow = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, row.clinicId)).limit(1);
      if (clinicRow[0]) {
        const c0 = clinicRow[0];
        clinic = { clinicId: c0.clinicId, clinicName: c0.clinicName, clinicCode: c0.clinicCode, city: c0.city ?? null };
      }
    }

    const creditsRow = await database.select().from(userCreditsTable).where(eq(userCreditsTable.userId, user.userId)).limit(1);
    const credits = creditsRow[0] ? { totalCredits: creditsRow[0].totalCredits, usedCredits: creditsRow[0].usedCredits } : null;

    const transactions = await database
      .select()
      .from(creditTransactionsTable)
      .where(eq(creditTransactionsTable.userId, row.id))
      .orderBy(desc(creditTransactionsTable.createdAt))
      .limit(50);

    const { getAuditLogsByUser } = await import('../utils/audit-log');
    const auditLogs = await getAuditLogsByUser(user.userId, 100);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      clinic,
      credits,
      creditTransactions: transactions.map((t) => ({ id: t.id, amount: t.amount, type: t.type, description: t.description, createdAt: t.createdAt })),
      auditLogs: auditLogs.map((l) => ({ id: l.id, action: l.action, resourceType: l.resourceType, resourceId: l.resourceId, createdAt: l.createdAt })),
    };

    return c.json(exportData, 200, {
      'Content-Disposition': `attachment; filename="mis-datos-${user.userId.slice(0, 8)}-${Date.now()}.json"`,
    });
  } catch (error) {
    console.error('Error exportando datos de usuario:', error);
    return c.json({ error: 'Error interno', message: 'Error al exportar datos' }, 500);
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
 * - super_admin: crea cualquier usuario
 * - clinic_admin: solo podólogos y recepcionistas de su clínica (respeta podiatrist_limit)
 */
usersRoutes.post('/', requireRole('super_admin', 'clinic_admin'), async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(createUserSchema, rawBody);
    if (!validation.success) {
      return c.json({ error: 'Datos inválidos', message: validation.error, issues: validation.issues }, 400);
    }

    const { email, name, role, clinicId, password } = validation.data;
    const requester = c.get('user');
    const emailLower = email.toLowerCase().trim();

    // clinic_admin: solo podólogo o recepcionista, y clinicId debe ser su clínica
    if (requester.role === 'clinic_admin') {
      if (role !== 'podiatrist' && role !== 'receptionist') {
        return c.json({ error: 'Acceso denegado', message: 'Solo puedes crear podólogos y recepcionistas' }, 403);
      }
      const effectiveClinicId = clinicId || requester.clinicId;
      if (!requester.clinicId || effectiveClinicId !== requester.clinicId) {
        return c.json({ error: 'Acceso denegado', message: 'Solo puedes crear usuarios para tu clínica' }, 403);
      }
      // Para podólogos: verificar límite
      if (role === 'podiatrist') {
        const clinicRow = await database.select().from(clinicsTable).where(eq(clinicsTable.clinicId, requester.clinicId)).limit(1);
        const limit = clinicRow[0]?.podiatristLimit ?? null;
        if (limit !== null) {
          const podiatristRows = await database.select().from(createdUsers).where(and(eq(createdUsers.clinicId, requester.clinicId), eq(createdUsers.role, 'podiatrist')));
          if (podiatristRows.length >= limit) {
            return c.json({
              error: 'Límite alcanzado',
              message: `Tu clínica tiene un límite de ${limit} podólogos. Contacta a PodoAdmin para ampliarlo.`,
              currentCount: podiatristRows.length,
              limit,
            },
              403
            );
          }
        }
      }
    }

    const existing = await database.select().from(createdUsers).where(eq(createdUsers.email, emailLower)).limit(1);
    if (existing.length) return c.json({ error: 'Datos inválidos', message: 'Ya existe una cuenta con este correo electrónico' }, 400);

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();
    const hashedPwd = await hashPassword(password);

    // clinic_admin: clinicId fijo a su clínica
    const finalClinicId = requester.role === 'clinic_admin' ? requester.clinicId : (clinicId || null);

    await database.insert(createdUsers).values({
      id,
      userId: id,
      email: emailLower,
      name,
      role,
      clinicId: finalClinicId || null,
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

    // Recepcionistas necesitan entrada en user_credits (0 créditos)
    if (role === 'receptionist') {
      await database.insert(userCreditsTable).values({
        userId: id,
        totalCredits: 0,
        usedCredits: 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    await logAuditEvent({
      userId: requester.userId,
      action: 'CREATE_USER',
      resourceType: 'user',
      resourceId: id,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
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
      userAgent: getSafeUserAgent(c),
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
 * DELETE /api/users/:userId
 * - super_admin: puede eliminar cualquier usuario
 * - clinic_admin: solo puede eliminar recepcionistas de su propia clínica
 */
usersRoutes.delete('/:userId', requireRole('super_admin', 'clinic_admin'), async (c) => {
  try {
    const userId = c.req.param('userId');
    const requester = c.get('user');
    const row = await getUserRowByAnyId(userId);
    if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);

    if (requester.role === 'clinic_admin') {
      if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'Solo puedes eliminar recepcionistas de tu clínica',
          },
          403
        );
      }
    }

    const result = await deleteUserCascade(row.userId, row.id);
    if (!result.deleted) {
      return c.json({ error: 'Error al eliminar', message: result.error || 'No se pudo eliminar el usuario' }, 500);
    }
    await logAuditEvent({
      userId: c.get('user').userId,
      action: 'DELETE_USER',
      resourceType: 'user',
      resourceId: row.id,
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
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

/** Bloquea o desbloquea todos los usuarios de una clínica (podólogos, recepcionistas, clinic_admin). */
async function setClinicUsersBlockState(clinicId: string, blocked: boolean) {
  const updates = blocked
    ? ({ isBlocked: true, isEnabled: false, disabledAt: Date.now(), updatedAt: new Date().toISOString() } as any)
    : ({ isBlocked: false, isEnabled: true, disabledAt: null, updatedAt: new Date().toISOString() } as any);
  await database.update(createdUsers).set(updates).where(eq(createdUsers.clinicId, clinicId));
}

// Bloqueo / desbloqueo:
// - super_admin: cualquier usuario
// - clinic_admin: solo recepcionistas de su clínica
// - Si se bloquea/desbloquea un clinic_admin: en cascada a todos los usuarios de su clínica
usersRoutes.post('/:userId/block', requireRole('super_admin', 'clinic_admin'), async (c) => {
  const requester = c.get('user');
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (requester.role === 'clinic_admin') {
    if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
  }
  await setUserFlag(row.id, { isBlocked: true } as any);
  if (row.role === 'clinic_admin' && row.clinicId) {
    await setClinicUsersBlockState(row.clinicId, true);
  }
  return c.json({ success: true });
});
usersRoutes.post('/:userId/unblock', requireRole('super_admin', 'clinic_admin'), async (c) => {
  const requester = c.get('user');
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (requester.role === 'clinic_admin') {
    if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
  }
  await setUserFlag(row.id, { isBlocked: false } as any);
  if (row.role === 'clinic_admin' && row.clinicId) {
    await setClinicUsersBlockState(row.clinicId, false);
  }
  return c.json({ success: true });
});

// Ban / unban: solo super_admin (acción más extrema)
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

// Habilitar / deshabilitar:
// - super_admin: cualquier usuario
// - clinic_admin: solo recepcionistas de su clínica
usersRoutes.post('/:userId/enable', requireRole('super_admin', 'clinic_admin'), async (c) => {
  const requester = c.get('user');
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (requester.role === 'clinic_admin') {
    if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
  }
  await setUserFlag(row.id, { isEnabled: true, disabledAt: null } as any);
  return c.json({ success: true });
});
usersRoutes.post('/:userId/disable', requireRole('super_admin', 'clinic_admin'), async (c) => {
  const requester = c.get('user');
  const row = await getUserRowByAnyId(c.req.param('userId'));
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (requester.role === 'clinic_admin') {
    if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
  }
  await setUserFlag(row.id, { isEnabled: false, disabledAt: Date.now() } as any);
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

