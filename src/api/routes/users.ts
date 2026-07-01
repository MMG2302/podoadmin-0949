import { Hono } from 'hono';
import { eq, or, and, inArray, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { validateData, createUserSchema, updateUserSchema, validateQuery, roleFilterQuerySchema } from '../utils/validation';
import { sanitizePathParam } from '../utils/sanitization';
import { database } from '../database';
import { createdUsers, clinics as clinicsTable, notifications as notificationsTable } from '../database/schema';
import { hashPassword } from '../utils/password';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import { deleteUserCascade } from '../utils/delete-user-cascade';
import {
  buildClinicalStatsMap,
  buildUserClinicalExport,
  buildPodiatristClinicalHistoriesBundle,
  getClinicalProfileForUserId,
  getUserRowByAnyId as getClinicalUserRow,
  transferClinicalHistory,
} from '../utils/clinical-admin';
import { resolveInitialIsEnabled } from '../utils/access-control';
import { mapUsersWithAccessBadge } from '../utils/user-access-badge';
import {
  assertClinicCanAddActiveReceptionist,
  canPodiatristManageReceptionist,
  getClinicPodiatristUserIds,
} from '../utils/receptionist-limits';

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
    /** Identificador de negocio (JWT / createdBy / assignedPodiatristIds), no la PK interna */
    id: row.userId,
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
    const roleResult = validateQuery(roleFilterQuerySchema, c.req.query());
    if (!roleResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: roleResult.error, issues: roleResult.issues }, 400);
    }
    const roleFilter = roleResult.data.role;

    let rows = await database.select().from(createdUsers);

    if (requester.role === 'clinic_admin') {
      if (!requester.clinicId) return c.json({ success: true, users: [] });
      rows = rows.filter((u) => u.clinicId === requester.clinicId);
    }
    if (roleFilter) rows = rows.filter((u) => u.role === roleFilter);

    const mapped = rows.map(mapDbUser);
    if (requester.role === 'super_admin' || requester.role === 'admin') {
      const users = await mapUsersWithAccessBadge(mapped, rows);
      return c.json({ success: true, users });
    }

    return c.json({ success: true, users: mapped });
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
    const roleResult = validateQuery(roleFilterQuerySchema, c.req.query());
    if (!roleResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: roleResult.error, issues: roleResult.issues }, 400);
    }
    const roleFilter = roleResult.data.role;

    if (requester.role === 'super_admin' || requester.role === 'admin') {
      let rows = await database.select().from(createdUsers);
      if (roleFilter) rows = rows.filter((u) => u.role === roleFilter);
      const mapped = rows.map(mapDbUser);
      const users = await mapUsersWithAccessBadge(mapped, rows);
      return c.json({ success: true, users });
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

    const { getAuditLogsByUser } = await import('../utils/audit-log');
    const auditLogs = await getAuditLogsByUser(user.userId, 100);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile,
      clinic,
      subscription: await (async () => {
        const { getSubscriptionForUser } = await import('../utils/subscription-service');
        return getSubscriptionForUser(user.userId, row.clinicId);
      })(),
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
 * GET /api/users/me/clinical-histories-export
 * Datos clínicos del podólogo autenticado para generar HTML/PDF en el cliente (no JSON de descarga).
 */
usersRoutes.get('/me/clinical-histories-export', async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'podiatrist') {
      return c.json({ error: 'No autorizado', message: 'Solo podólogos pueden exportar historiales clínicos' }, 403);
    }

    const bundle = await buildPodiatristClinicalHistoriesBundle(user.userId);
    if (!bundle) {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }

    await logAuditEvent({
      userId: user.userId,
      action: 'EXPORT',
      resourceType: 'clinical_history',
      resourceId: user.userId,
      details: {
        exportType: 'podiatry_histories_html',
        patientCount: bundle.statistics.patientCount,
        sessionCount: bundle.statistics.sessionCount,
      },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    return c.json({ success: true, ...bundle });
  } catch (error) {
    console.error('Error exportando historiales clínicos:', error);
    return c.json({ error: 'Error interno', message: 'Error al exportar historiales clínicos' }, 500);
  }
});

function canManageClinicalData(
  requester: { role: string; userId: string; clinicId?: string | null },
  target: { userId: string; clinicId: string | null }
): boolean {
  if (requester.role === 'super_admin' || requester.role === 'admin') return true;
  if (requester.role === 'clinic_admin' && requester.clinicId && target.clinicId === requester.clinicId) {
    return true;
  }
  return false;
}

/**
 * GET /api/users/clinical-stats
 * Conteos de pacientes/sesiones por userId (createdBy), según visibilidad del solicitante.
 */
usersRoutes.get('/clinical-stats', requireRole('super_admin', 'admin', 'clinic_admin'), async (c) => {
  try {
    const requester = c.get('user');
    const stats = await buildClinicalStatsMap(requester);
    return c.json({ success: true, stats });
  } catch (error) {
    console.error('Error obteniendo estadísticas clínicas:', error);
    return c.json({ error: 'Error interno', message: 'Error al obtener estadísticas' }, 500);
  }
});

/**
 * POST /api/users/transfer-clinical-history
 * Transfiere pacientes y sesiones de un usuario a otro (D1).
 */
usersRoutes.post('/transfer-clinical-history', requireRole('super_admin', 'clinic_admin'), async (c) => {
  try {
    const requester = c.get('user');
    const body = await c.req.json().catch(() => ({}));
    const sourceUserId = typeof body.sourceUserId === 'string' ? body.sourceUserId.trim() : '';
    const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : '';

    if (!sourceUserId || !targetUserId) {
      return c.json({ error: 'Datos inválidos', message: 'sourceUserId y targetUserId son obligatorios' }, 400);
    }
    if (sourceUserId === targetUserId) {
      return c.json({ error: 'Datos inválidos', message: 'Origen y destino deben ser distintos' }, 400);
    }

    const source = await getClinicalUserRow(sourceUserId);
    const target = await getClinicalUserRow(targetUserId);
    if (!source || !target) {
      return c.json({ error: 'Usuario no encontrado', message: 'Usuario origen o destino no existe' }, 404);
    }

    if (requester.role === 'clinic_admin') {
      if (!requester.clinicId || source.clinicId !== requester.clinicId || target.clinicId !== requester.clinicId) {
        return c.json({ error: 'Acceso denegado', message: 'Solo puedes transferir entre usuarios de tu clínica' }, 403);
      }
    }

    const result = await transferClinicalHistory(sourceUserId, targetUserId);

    await logAuditEvent({
      userId: requester.userId,
      action: 'TRANSFER',
      resourceType: 'clinical_history',
      resourceId: source.userId,
      details: {
        action: 'clinical_history_transfer',
        sourceUserId: source.userId,
        sourceUserName: source.name,
        targetUserId: target.userId,
        targetUserName: target.name,
        patientsTransferred: result.patientsTransferred,
        sessionsTransferred: result.sessionsTransferred,
      },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: requester.clinicId ?? undefined,
    });

    return c.json({
      success: true,
      patientsTransferred: result.patientsTransferred,
      sessionsTransferred: result.sessionsTransferred,
      message: `Se han transferido ${result.patientsTransferred} paciente(s) correctamente.`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'USER_NOT_FOUND') {
      return c.json({ error: 'Usuario no encontrado' }, 404);
    }
    if (msg === 'SAME_USER') {
      return c.json({ error: 'Datos inválidos', message: 'Origen y destino deben ser distintos' }, 400);
    }
    console.error('Error transfiriendo historial clínico:', error);
    return c.json({ error: 'Error interno', message: 'Error al transferir historial' }, 500);
  }
});

/**
 * GET /api/users/:userId/clinical-profile
 * Resumen clínico de un usuario (conteos y lista de pacientes).
 */
usersRoutes.get('/:userId/clinical-profile', requireRole('super_admin', 'admin', 'clinic_admin'), async (c) => {
  try {
    const requester = c.get('user');
    const userId = sanitizePathParam(c.req.param('userId'), 128);
    if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
    const row = await getClinicalUserRow(userId);
    if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);

    if (!canManageClinicalData(requester, { userId: row.userId, clinicId: row.clinicId })) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const profile = await getClinicalProfileForUserId(userId);
    if (!profile) return c.json({ error: 'Usuario no encontrado' }, 404);

    return c.json({
      success: true,
      patientCount: profile.patientCount,
      sessionCount: profile.sessionCount,
      patients: profile.patients,
    });
  } catch (error) {
    console.error('Error obteniendo perfil clínico:', error);
    return c.json({ error: 'Error interno', message: 'Error al obtener perfil clínico' }, 500);
  }
});

/**
 * GET /api/users/:userId/clinical-export
 * Exportación JSON del historial clínico de un usuario.
 */
usersRoutes.get('/:userId/clinical-export', requireRole('super_admin', 'admin', 'clinic_admin'), async (c) => {
  try {
    const requester = c.get('user');
    const userId = sanitizePathParam(c.req.param('userId'), 128);
    if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
    const row = await getClinicalUserRow(userId);
    if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);

    if (!canManageClinicalData(requester, { userId: row.userId, clinicId: row.clinicId })) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const requesterRow = await getClinicalUserRow(requester.userId);
    const exportData = await buildUserClinicalExport(userId, requesterRow?.name);
    if (!exportData) return c.json({ error: 'Usuario no encontrado' }, 404);

    await logAuditEvent({
      userId: requester.userId,
      action: 'EXPORT',
      resourceType: 'user_data',
      resourceId: row.userId,
      details: {
        action: 'user_clinical_history_export',
        targetUserId: row.userId,
        targetUserName: row.name,
        patientsExported: exportData.statistics.totalPatients,
        sessionsExported: exportData.statistics.totalSessions,
        exportType: 'json',
      },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: requester.clinicId ?? undefined,
    });

    return c.json(exportData, 200, {
      'Content-Disposition': `attachment; filename="user_${row.userId}_clinical_history.json"`,
    });
  } catch (error) {
    console.error('Error exportando historial clínico:', error);
    return c.json({ error: 'Error interno', message: 'Error al exportar' }, 500);
  }
});

/**
 * GET /api/users/:userId
 * super_admin/admin, el mismo usuario, o clinic_admin si pertenece a su clínica
 */
usersRoutes.get('/:userId', async (c) => {
  try {
    const requester = c.get('user');
    const userId = sanitizePathParam(c.req.param('userId'), 128);
    if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
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
        const { getEffectivePodiatristLimit, countActivePodiatristsForClinic } = await import(
          '../utils/billing-pricing'
        );
        const limit = await getEffectivePodiatristLimit(requester.clinicId);
        const activeCount = await countActivePodiatristsForClinic(requester.clinicId);
        if (activeCount >= limit) {
          return c.json(
            {
              error: 'Límite alcanzado',
              message: `Tu clínica alcanzó el límite de ${limit} podólogos. Contacta a PodoAdmin para ampliar tu plan.`,
              currentCount: activeCount,
              limit,
            },
            403
          );
        }
      }
      if (role === 'receptionist' && requester.clinicId) {
        try {
          await assertClinicCanAddActiveReceptionist(requester.clinicId);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Límite de recepcionistas alcanzado';
          return c.json({ error: 'Límite alcanzado', message }, 403);
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

    const initialEnabled = resolveInitialIsEnabled(role, requester.role);

    let assignedPodiatristIdsJson: string | null = null;
    if (role === 'receptionist' && finalClinicId) {
      const podIds = await getClinicPodiatristUserIds(finalClinicId);
      if (podIds.length > 0) assignedPodiatristIdsJson = JSON.stringify(podIds);
    }

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
      isEnabled: initialEnabled,
      emailVerified: false,
      termsAccepted: false,
      termsAcceptedAt: null,
      registrationSource: 'admin',
      assignedPodiatristIds: assignedPodiatristIdsJson,
      googleId: null,
      appleId: null,
      oauthProvider: null,
      avatarUrl: null,
      mustChangePassword: true, // Contraseña temporal: obligar cambio en primer login
    } as any);

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
    const userId = sanitizePathParam(c.req.param('userId'), 128);
    if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
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
usersRoutes.delete('/:userId', requireRole('super_admin', 'clinic_admin', 'podiatrist'), async (c) => {
  try {
    const userId = sanitizePathParam(c.req.param('userId'), 128);
    if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
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
    if (requester.role === 'podiatrist') {
      if (!canPodiatristManageReceptionist(requester, row)) {
        return c.json(
          {
            error: 'Acceso denegado',
            message: 'Solo puedes eliminar recepcionistas que hayas creado',
          },
          403
        );
      }
    }

    const clinicIdForBilling = row.clinicId;
    const roleForBilling = row.role;

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
// - podiatrist: recepcionistas que creó (independiente) o de su clínica
usersRoutes.post('/:userId/block', requireRole('super_admin', 'clinic_admin', 'podiatrist'), async (c) => {
  const requester = c.get('user');
  const userId = sanitizePathParam(c.req.param('userId'), 128);
  if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
  const row = await getUserRowByAnyId(userId);
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (requester.role === 'clinic_admin') {
    if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
  }
  if (requester.role === 'podiatrist') {
    if (!canPodiatristManageReceptionist(requester, row)) {
      return c.json({ error: 'Acceso denegado', message: 'Solo puedes bloquear recepcionistas que hayas creado' }, 403);
    }
  }
  await setUserFlag(row.id, { isBlocked: true } as any);
  if (row.role === 'clinic_admin' && row.clinicId) {
    await setClinicUsersBlockState(row.clinicId, true);
  }
  return c.json({ success: true });
});
usersRoutes.post('/:userId/unblock', requireRole('super_admin', 'clinic_admin', 'podiatrist'), async (c) => {
  const requester = c.get('user');
  const userId = sanitizePathParam(c.req.param('userId'), 128);
  if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
  const row = await getUserRowByAnyId(userId);
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (requester.role === 'clinic_admin') {
    if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
  }
  if (requester.role === 'podiatrist') {
    if (!canPodiatristManageReceptionist(requester, row)) {
      return c.json({ error: 'Acceso denegado', message: 'Solo puedes desbloquear recepcionistas que hayas creado' }, 403);
    }
  }
  if (row.role === 'receptionist' && row.clinicId && row.isBlocked) {
    try {
      await assertClinicCanAddActiveReceptionist(row.clinicId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Límite de recepcionistas activas alcanzado';
      return c.json({ error: 'Límite alcanzado', message }, 403);
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
  const userId = sanitizePathParam(c.req.param('userId'), 128);
  if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
  const row = await getUserRowByAnyId(userId);
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  await setUserFlag(row.id, { isBanned: true } as any);
  return c.json({ success: true });
});
usersRoutes.post('/:userId/unban', requireRole('super_admin'), async (c) => {
  const userId = sanitizePathParam(c.req.param('userId'), 128);
  if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
  const row = await getUserRowByAnyId(userId);
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  await setUserFlag(row.id, { isBanned: false } as any);
  return c.json({ success: true });
});

// Habilitar:
// - super_admin: cualquier usuario (p. ej. admin de plataforma)
// - clinic_admin: recepcionistas de su clínica
// - podiatrist: recepcionistas que creó o de su clínica
usersRoutes.post('/:userId/enable', requireRole('super_admin', 'clinic_admin', 'podiatrist'), async (c) => {
  const requester = c.get('user');
  const userId = sanitizePathParam(c.req.param('userId'), 128);
  if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
  const row = await getUserRowByAnyId(userId);
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (requester.role === 'clinic_admin') {
    if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado', message: 'Solo puedes habilitar recepcionistas de tu clínica' }, 403);
    }
  }
  if (requester.role === 'podiatrist') {
    if (row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado', message: 'Solo puedes habilitar recepcionistas' }, 403);
    }
    if (!canPodiatristManageReceptionist(requester, row)) {
      return c.json({ error: 'Acceso denegado', message: 'Solo puedes habilitar recepcionistas que hayas creado' }, 403);
    }
  }
  if (row.role === 'receptionist' && row.clinicId && row.isEnabled === false) {
    try {
      await assertClinicCanAddActiveReceptionist(row.clinicId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Límite de recepcionistas activas alcanzado';
      return c.json({ error: 'Límite alcanzado', message }, 403);
    }
  }
  await setUserFlag(row.id, { isEnabled: true, disabledAt: null } as any);
  return c.json({ success: true });
});
usersRoutes.post('/:userId/disable', requireRole('super_admin', 'clinic_admin', 'podiatrist'), async (c) => {
  const requester = c.get('user');
  const userId = sanitizePathParam(c.req.param('userId'), 128);
  if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
  const row = await getUserRowByAnyId(userId);
  if (!row) return c.json({ error: 'Usuario no encontrado' }, 404);
  if (requester.role === 'clinic_admin') {
    if (!requester.clinicId || row.clinicId !== requester.clinicId || row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado', message: 'Solo puedes deshabilitar recepcionistas de tu clínica' }, 403);
    }
  }
  if (requester.role === 'podiatrist') {
    if (row.role !== 'receptionist') {
      return c.json({ error: 'Acceso denegado', message: 'Solo puedes deshabilitar recepcionistas' }, 403);
    }
    if (!canPodiatristManageReceptionist(requester, row)) {
      return c.json({ error: 'Acceso denegado', message: 'Solo puedes deshabilitar recepcionistas que hayas creado' }, 403);
    }
  }

  const disabledAt = Date.now();
  await setUserFlag(row.id, { isEnabled: false, disabledAt } as any);

  try {
    const nowIso = new Date().toISOString();
    await database.insert(notificationsTable).values({
      id: `notif_${crypto.randomUUID().replace(/-/g, '')}`,
      userId: row.userId,
      type: 'system',
      title: 'Cuenta deshabilitada - período de gracia',
      message:
        'Por exceso de pago, durante los próximos 30 días naturales no podrás crear nuevas sesiones clínicas, pacientes ni citas. Podrás seguir accediendo a la aplicación y consultar pacientes y sesiones existentes.',
      read: false,
      metadata: JSON.stringify({
        reason: 'disabled_grace_period',
        disabledAt,
      }),
      createdAt: nowIso,
    });
  } catch (err) {
    console.error('Error creando notificación de deshabilitación:', err);
  }

  return c.json({ success: true });
});

/**
 * GET /api/users/:userId/status
 */
usersRoutes.get('/:userId/status', requireRole('super_admin', 'admin'), async (c) => {
  const userId = sanitizePathParam(c.req.param('userId'), 128);
  if (!userId) return c.json({ error: 'ID de usuario inválido', message: 'Parámetro userId no válido' }, 400);
  const row = await getUserRowByAnyId(userId);
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

