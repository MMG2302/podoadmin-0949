import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { database } from '../database';
import {
  pendingRegistrationLists,
  pendingRegistrationEntries,
  createdUsers,
  notifications as notificationsTable,
  clinics as clinicsTable,
  clinicCredits as clinicCreditsTable,
  userCredits as userCreditsTable,
} from '../database/schema';
import { hashPassword } from '../utils/password';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';

const registrationListsRoutes = new Hono();
registrationListsRoutes.use('*', requireAuth);

const generateId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;

function isSupportRole(role: string) {
  return role === 'super_admin' || role === 'admin';
}

/**
 * GET /api/registration-lists
 * - admin: sus listas (draft + enviadas)
 * - super_admin: todas las listas
 */
registrationListsRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    const statusFilter = c.req.query('status'); // draft | pending | approved | rejected

    let rows;
    if (user.role === 'super_admin') {
      rows = await database
        .select({
          id: pendingRegistrationLists.id,
          name: pendingRegistrationLists.name,
          createdBy: pendingRegistrationLists.createdBy,
          status: pendingRegistrationLists.status,
          submittedAt: pendingRegistrationLists.submittedAt,
          reviewedBy: pendingRegistrationLists.reviewedBy,
          reviewedAt: pendingRegistrationLists.reviewedAt,
          createdAt: pendingRegistrationLists.createdAt,
          updatedAt: pendingRegistrationLists.updatedAt,
          creatorName: createdUsers.name,
        })
        .from(pendingRegistrationLists)
        .leftJoin(createdUsers, eq(pendingRegistrationLists.createdBy, createdUsers.userId))
        .orderBy(desc(pendingRegistrationLists.updatedAt))
        .limit(200);
    } else if (isSupportRole(user.role || '')) {
      rows = await database
        .select({
          id: pendingRegistrationLists.id,
          name: pendingRegistrationLists.name,
          createdBy: pendingRegistrationLists.createdBy,
          status: pendingRegistrationLists.status,
          submittedAt: pendingRegistrationLists.submittedAt,
          reviewedBy: pendingRegistrationLists.reviewedBy,
          reviewedAt: pendingRegistrationLists.reviewedAt,
          createdAt: pendingRegistrationLists.createdAt,
          updatedAt: pendingRegistrationLists.updatedAt,
          creatorName: createdUsers.name,
        })
        .from(pendingRegistrationLists)
        .leftJoin(createdUsers, eq(pendingRegistrationLists.createdBy, createdUsers.userId))
        .where(eq(pendingRegistrationLists.createdBy, user.userId))
        .orderBy(desc(pendingRegistrationLists.updatedAt))
        .limit(100);
    } else {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    let lists = rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdBy: r.createdBy,
      status: r.status,
      submittedAt: r.submittedAt,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      creatorName: (r as { creatorName?: string }).creatorName ?? null,
    }));

    if (statusFilter) {
      lists = lists.filter((l) => l.status === statusFilter);
    }

    return c.json({ success: true, lists });
  } catch (err) {
    console.error('Error listando listas:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/registration-lists
 * Crear lista (admin)
 */
registrationListsRoutes.post('/', requireRole('super_admin', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const body = (await c.req.json().catch(() => ({}))) as { name?: string };
    const name = (body.name || 'Nueva lista').trim().slice(0, 200);

    const id = generateId('reglist');
    const now = new Date().toISOString();

    await database.insert(pendingRegistrationLists).values({
      id,
      name: name || 'Nueva lista',
      createdBy: user.userId,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });

    await logAuditEvent({
      userId: user.userId,
      action: 'CREATE',
      resourceType: 'registration_list',
      resourceId: id,
      details: { name },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    return c.json({
      success: true,
      list: { id, name, createdBy: user.userId, status: 'draft', createdAt: now, updatedAt: now },
    });
  } catch (err) {
    console.error('Error creando lista:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/registration-lists/:id
 * Obtener lista con entradas
 */
registrationListsRoutes.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);

    if (user.role !== 'super_admin' && list.createdBy !== user.userId) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const entries = await database
      .select()
      .from(pendingRegistrationEntries)
      .where(eq(pendingRegistrationEntries.listId, listId))
      .orderBy(pendingRegistrationEntries.sortOrder, pendingRegistrationEntries.createdAt);

    return c.json({
      success: true,
      list: {
        id: list.id,
        name: list.name,
        createdBy: list.createdBy,
        status: list.status,
        submittedAt: list.submittedAt,
        reviewedBy: list.reviewedBy,
        reviewedAt: list.reviewedAt,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      },
      entries: entries.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        clinicId: e.clinicId,
        clinicMode: e.clinicMode,
        podiatristLimit: e.podiatristLimit ?? null,
        notes: e.notes,
      })),
    });
  } catch (err) {
    console.error('Error obteniendo lista:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * PATCH /api/registration-lists/:id
 * Actualizar nombre (solo draft)
 */
registrationListsRoutes.patch('/:id', requireRole('super_admin', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');
    const body = (await c.req.json().catch(() => ({}))) as { name?: string };

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);
    if (list.createdBy !== user.userId && user.role !== 'super_admin') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
    if (list.status !== 'draft') {
      return c.json({ error: 'Solo se pueden editar listas en borrador' }, 400);
    }

    const name = body.name ? String(body.name).trim().slice(0, 200) : list.name;
    const now = new Date().toISOString();

    await database
      .update(pendingRegistrationLists)
      .set({ name, updatedAt: now })
      .where(eq(pendingRegistrationLists.id, listId));

    return c.json({ success: true });
  } catch (err) {
    console.error('Error actualizando lista:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * DELETE /api/registration-lists/:id
 * Eliminar lista
 * - admin: solo listas en borrador propias
 * - super_admin: cualquier lista
 */
registrationListsRoutes.delete('/:id', requireRole('super_admin', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);
    if (list.createdBy !== user.userId && user.role !== 'super_admin') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
    if (list.status !== 'draft' && user.role !== 'super_admin') {
      return c.json({ error: 'Solo se pueden eliminar listas en borrador' }, 400);
    }

    await database.delete(pendingRegistrationLists).where(eq(pendingRegistrationLists.id, listId));

    await logAuditEvent({
      userId: user.userId,
      action: 'DELETE',
      resourceType: 'registration_list',
      resourceId: listId,
      details: { name: list.name },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    return c.json({ success: true });
  } catch (err) {
    console.error('Error eliminando lista:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/registration-lists/:id/entries
 * Añadir entrada a lista (solo draft)
 */
registrationListsRoutes.post('/:id/entries', requireRole('super_admin', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');
    const body = (await c.req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      role?: string;
      clinicId?: string;
      clinicMode?: string;
      podiatristLimit?: number | string | null;
      notes?: string;
    };

    const name = (body.name || '').trim().slice(0, 200);
    const email = (body.email || '').trim().toLowerCase().slice(0, 255);
    if (!name || !email) {
      return c.json({ error: 'Nombre y email son requeridos' }, 400);
    }

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);
    if (list.createdBy !== user.userId && user.role !== 'super_admin') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
    if (list.status !== 'draft') {
      return c.json({ error: 'Solo se pueden editar listas en borrador' }, 400);
    }

    const validRoles = ['podiatrist', 'clinic_admin'];
    const role = validRoles.includes((body.role || '').toLowerCase()) ? body.role!.toLowerCase() : 'podiatrist';

    let podiatristLimit: number | null = null;
    if (role === 'clinic_admin' && body.podiatristLimit != null && body.podiatristLimit !== '') {
      const n = typeof body.podiatristLimit === 'number' ? body.podiatristLimit : parseInt(String(body.podiatristLimit), 10);
      if (!Number.isNaN(n) && n >= 1) podiatristLimit = Math.min(999, Math.floor(n));
    }

    const entryId = generateId('regentry');
    const now = new Date().toISOString();

    const orderRows = await database
      .select({ sortOrder: pendingRegistrationEntries.sortOrder })
      .from(pendingRegistrationEntries)
      .where(eq(pendingRegistrationEntries.listId, listId))
      .orderBy(desc(pendingRegistrationEntries.sortOrder))
      .limit(1);
    const sortOrder = (orderRows[0]?.sortOrder ?? 0) + 1;

    await database.insert(pendingRegistrationEntries).values({
      id: entryId,
      listId,
      name,
      email,
      role,
      clinicId: body.clinicId?.trim() || null,
      clinicMode: body.clinicMode?.trim() || null,
      podiatristLimit,
      notes: body.notes?.trim().slice(0, 500) || null,
      sortOrder,
      createdAt: now,
    });

    return c.json({
      success: true,
      entry: {
        id: entryId,
        name,
        email,
        role,
        clinicId: body.clinicId || null,
        clinicMode: body.clinicMode || null,
        podiatristLimit,
        notes: body.notes || null,
      },
    });
  } catch (err) {
    console.error('Error añadiendo entrada:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * DELETE /api/registration-lists/:id/entries/:entryId
 * Eliminar entrada (solo draft)
 */
registrationListsRoutes.delete('/:id/entries/:entryId', requireRole('super_admin', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');
    const entryId = c.req.param('entryId');

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);
    if (list.createdBy !== user.userId && user.role !== 'super_admin') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
    if (list.status !== 'draft') {
      return c.json({ error: 'Solo se pueden editar listas en borrador' }, 400);
    }

    await database
      .delete(pendingRegistrationEntries)
      .where(and(eq(pendingRegistrationEntries.listId, listId), eq(pendingRegistrationEntries.id, entryId)));

    return c.json({ success: true });
  } catch (err) {
    console.error('Error eliminando entrada:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/registration-lists/:id/submit
 * Enviar lista para aprobación (admin)
 */
registrationListsRoutes.post('/:id/submit', requireRole('super_admin', 'admin'), async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);
    if (list.createdBy !== user.userId && user.role !== 'super_admin') {
      return c.json({ error: 'Acceso denegado' }, 403);
    }
    if (list.status !== 'draft') {
      return c.json({ error: 'La lista ya fue enviada' }, 400);
    }

    const entries = await database
      .select()
      .from(pendingRegistrationEntries)
      .where(eq(pendingRegistrationEntries.listId, listId));

    if (entries.length === 0) {
      return c.json({ error: 'La lista debe tener al menos un registro' }, 400);
    }

    const now = new Date().toISOString();

    await database
      .update(pendingRegistrationLists)
      .set({ status: 'pending', submittedAt: now, updatedAt: now })
      .where(eq(pendingRegistrationLists.id, listId));

    await logAuditEvent({
      userId: user.userId,
      action: 'SUBMIT',
      resourceType: 'registration_list',
      resourceId: listId,
      details: { name: list.name, entryCount: entries.length },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    // Notificar a super_admin
    try {
      const adminRows = await database
        .select({ userId: createdUsers.userId })
        .from(createdUsers)
        .where(eq(createdUsers.role, 'super_admin'));
      const creatorName = user.name || user.email || 'Soporte';
      for (const row of adminRows) {
        const notifId = `notif_${crypto.randomUUID().replace(/-/g, '')}`;
        await database.insert(notificationsTable).values({
          id: notifId,
          userId: row.userId,
          type: 'system',
          title: '📋 Nueva lista de registros pendiente',
          message: `${creatorName} ha enviado la lista "${list.name}" con ${entries.length} registro(s) para aprobación.`,
          read: false,
          metadata: JSON.stringify({ listId, listName: list.name, entryCount: entries.length }),
          createdAt: now,
        });
      }
    } catch (err) {
      console.error('Error creando notificación:', err);
    }

    return c.json({ success: true });
  } catch (err) {
    console.error('Error enviando lista:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/registration-lists/:id/csv
 * Descargar lista completa como CSV (formato compatible con import)
 */
registrationListsRoutes.get('/:id/csv', async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);

    if (user.role !== 'super_admin' && list.createdBy !== user.userId) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const entries = await database
      .select()
      .from(pendingRegistrationEntries)
      .where(eq(pendingRegistrationEntries.listId, listId))
      .orderBy(pendingRegistrationEntries.sortOrder, pendingRegistrationEntries.createdAt);

    // Formato: nombre;email;password;rol;clinicMode;clinicId;podiatrist_limit (password vacío = usar default en import)
    const header = 'nombre;email;password;rol;clinicMode;clinicId;podiatrist_limit';
    const rows = entries.map(
      (e) =>
        `${escapeCsv(e.name)};${escapeCsv(e.email)};;${e.role};${e.clinicMode || 'existing'};${e.clinicId || ''};${e.podiatristLimit ?? ''}`
    );
    const csv = [header, ...rows].join('\n');

    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="lista_${list.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`);
    return c.body(csv, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
    });
  } catch (err) {
    console.error('Error generando CSV:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/registration-lists/:id/csv
 * Descargar CSV solo con las entradas seleccionadas (por ejemplo, pagados)
 */
registrationListsRoutes.post('/:id/csv', async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');
    const body = (await c.req.json().catch(() => ({}))) as { entryIds?: string[] };
    const entryIds = Array.isArray(body.entryIds) ? body.entryIds.filter((id) => typeof id === 'string') : [];

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);

    if (user.role !== 'super_admin' && list.createdBy !== user.userId) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    let entries = await database
      .select()
      .from(pendingRegistrationEntries)
      .where(eq(pendingRegistrationEntries.listId, listId))
      .orderBy(pendingRegistrationEntries.sortOrder, pendingRegistrationEntries.createdAt);

    if (entryIds.length > 0) {
      const set = new Set(entryIds);
      entries = entries.filter((e) => set.has(e.id));
    }

    if (entries.length === 0) {
      return c.json({ error: 'No hay registros seleccionados para exportar' }, 400);
    }

    const header = 'nombre;email;password;rol;clinicMode;clinicId;podiatrist_limit';
    const rows = entries.map(
      (e) =>
        `${escapeCsv(e.name)};${escapeCsv(e.email)};;${e.role};${e.clinicMode || 'existing'};${e.clinicId || ''};${e.podiatristLimit ?? ''}`
    );
    const csv = [header, ...rows].join('\n');

    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="lista_${list.name.replace(/[^a-zA-Z0-9]/g, '_')}_seleccion.csv"`);
    return c.body(csv, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
    });
  } catch (err) {
    console.error('Error generando CSV (selección):', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

function escapeCsv(val: string): string {
  if (val.includes(';') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function generateTempPassword(): string {
  return `Podo${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

/**
 * POST /api/registration-lists/:id/approve
 * Aprobar lista (super_admin) - crea usuarios y marca como aprobada
 */
registrationListsRoutes.post('/:id/approve', requireRole('super_admin'), async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);
    if (list.status !== 'pending') {
      return c.json({ error: 'Solo se pueden aprobar listas pendientes' }, 400);
    }

    const entries = await database
      .select()
      .from(pendingRegistrationEntries)
      .where(eq(pendingRegistrationEntries.listId, listId))
      .orderBy(pendingRegistrationEntries.sortOrder, pendingRegistrationEntries.createdAt);

    if (entries.length === 0) {
      return c.json({ error: 'La lista no tiene registros' }, 400);
    }

    const now = new Date().toISOString();
    const results: { created: number; skipped: string[]; errors: { email: string; error: string }[] } = {
      created: 0,
      skipped: [],
      errors: [],
    };

    for (const e of entries) {
      const emailLower = e.email.toLowerCase().trim();
      const name = (e.name || '').trim().slice(0, 200);
      const role = e.role === 'clinic_admin' ? 'clinic_admin' : 'podiatrist';

      const existingUser = await database.select().from(createdUsers).where(eq(createdUsers.email, emailLower)).limit(1);
      if (existingUser.length) {
        results.skipped.push(`${name} (${emailLower}): ya existe`);
        continue;
      }

      try {
        const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const tempPassword = generateTempPassword();
        const hashedPwd = await hashPassword(tempPassword);

        let clinicIdToSet = e.clinicId?.trim() || null;
        const clinicMode = (e.clinicMode || 'existing').toLowerCase();

        if ((role === 'clinic_admin' || role === 'podiatrist') && clinicMode === 'new') {
          const existingIds = await database.select({ clinicId: clinicsTable.clinicId }).from(clinicsTable);
          const numbers = existingIds
            .map((r) => {
              const m = r.clinicId.match(/^clinic_(\d+)$/);
              return m ? parseInt(m[1], 10) : 0;
            })
            .filter((n) => n > 0);
          const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
          const newClinicId = `clinic_${String(nextNum).padStart(3, '0')}`;

          const existingCodes = await database.select({ clinicCode: clinicsTable.clinicCode }).from(clinicsTable);
          const codeNums = existingCodes
            .map((r) => {
              const m = (r.clinicCode || '').match(/^C(\d+)$/);
              return m ? parseInt(m[1], 10) : 0;
            })
            .filter((n) => n > 0);
          const nextCodeNum = codeNums.length > 0 ? Math.max(...codeNums) + 1 : 1;
          const clinicCode = `C${String(nextCodeNum).padStart(3, '0')}`;

          const pl =
            role === 'clinic_admin' && e.podiatristLimit != null && e.podiatristLimit >= 1
              ? Math.min(999, Math.floor(e.podiatristLimit))
              : null;

          await database.insert(clinicsTable).values({
            clinicId: newClinicId,
            clinicName: 'Clínica pendiente de configuración',
            clinicCode,
            ownerId: id,
            logo: null,
            podiatristLimit: pl,
            phone: null,
            email: null,
            address: null,
            city: null,
            postalCode: null,
            licenseNumber: null,
            website: null,
            consentText: null,
            consentTextVersion: 0,
            createdAt: now,
          });
          await database.insert(clinicCreditsTable).values({
            clinicId: newClinicId,
            totalCredits: 0,
            distributedToDate: 0,
            createdAt: now,
            updatedAt: now,
          });
          clinicIdToSet = newClinicId;

          await logAuditEvent({
            userId: user.userId,
            action: 'CREATE',
            resourceType: 'clinic',
            resourceId: newClinicId,
            details: { clinicName: 'Clínica pendiente', ownerId: id },
            ipAddress: getClientIP(c.req.raw.headers),
            userAgent: getSafeUserAgent(c),
            clinicId: newClinicId,
          });
        }

        await database.insert(createdUsers).values({
          id,
          userId: id,
          email: emailLower,
          name,
          role,
          clinicId: clinicIdToSet,
          password: hashedPwd,
          createdAt: now,
          updatedAt: now,
          createdBy: user.userId,
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
          mustChangePassword: true,
        } as Record<string, unknown>);

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
          userId: user.userId,
          action: 'CREATE_USER',
          resourceType: 'user',
          resourceId: id,
          ipAddress: getClientIP(c.req.raw.headers),
          userAgent: getSafeUserAgent(c),
          details: { email: emailLower, role, clinicId: clinicIdToSet, source: 'registration_list_approve' },
        });

        results.created++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        results.errors.push({ email: emailLower, error: msg });
        console.error(`Error creando usuario ${emailLower}:`, err);
      }
    }

    await database
      .update(pendingRegistrationLists)
      .set({ status: 'approved', reviewedBy: user.userId, reviewedAt: now, updatedAt: now })
      .where(eq(pendingRegistrationLists.id, listId));

    await logAuditEvent({
      userId: user.userId,
      action: 'APPROVE',
      resourceType: 'registration_list',
      resourceId: listId,
      details: { name: list.name, created: results.created, skipped: results.skipped.length, errors: results.errors.length },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    return c.json({
      success: true,
      created: results.created,
      skipped: results.skipped,
      errors: results.errors.length > 0 ? results.errors : undefined,
      message:
        results.created > 0
          ? `Se crearon ${results.created} usuario(s). Los usuarios deben usar "Restablecer contraseña" para acceder.`
          : results.errors.length > 0
            ? 'No se crearon usuarios. Revise los errores.'
            : 'Todos los emails ya existían.',
    });
  } catch (err) {
    console.error('Error aprobando lista:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/registration-lists/:id/reject
 * Rechazar lista (super_admin)
 */
registrationListsRoutes.post('/:id/reject', requireRole('super_admin'), async (c) => {
  try {
    const user = c.get('user');
    const listId = c.req.param('id');
    const body = (await c.req.json().catch(() => ({}))) as { reason?: string };

    const [list] = await database
      .select()
      .from(pendingRegistrationLists)
      .where(eq(pendingRegistrationLists.id, listId))
      .limit(1);

    if (!list) return c.json({ error: 'Lista no encontrada' }, 404);
    if (list.status !== 'pending') {
      return c.json({ error: 'Solo se pueden rechazar listas pendientes' }, 400);
    }

    const now = new Date().toISOString();

    await database
      .update(pendingRegistrationLists)
      .set({ status: 'rejected', reviewedBy: user.userId, reviewedAt: now, updatedAt: now })
      .where(eq(pendingRegistrationLists.id, listId));

    await logAuditEvent({
      userId: user.userId,
      action: 'REJECT',
      resourceType: 'registration_list',
      resourceId: listId,
      details: { name: list.name, reason: body.reason },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
    });

    return c.json({ success: true });
  } catch (err) {
    console.error('Error rechazando lista:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default registrationListsRoutes;
