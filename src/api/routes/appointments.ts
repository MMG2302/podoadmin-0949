import { Hono } from 'hono';
import { eq, and, ne } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { database } from '../database';
import { appointments as appointmentsTable, createdUsers as createdUsersTable } from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';

const appointmentsRoutes = new Hono();

/** Obtiene los IDs de podólogos asignados a una recepcionista (desde DB; no está en JWT). */
async function getAssignedPodiatristIds(userId: string): Promise<string[]> {
  const rows = await database
    .select({ assignedPodiatristIds: createdUsersTable.assignedPodiatristIds })
    .from(createdUsersTable)
    .where(eq(createdUsersTable.id, userId))
    .limit(1);
  if (!rows[0]?.assignedPodiatristIds) return [];
  try {
    const parsed = JSON.parse(rows[0].assignedPodiatristIds) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Obtiene el clinicId de un usuario (podólogo) desde la DB. */
async function getClinicIdForUser(userId: string): Promise<string | null> {
  const rows = await database
    .select({ clinicId: createdUsersTable.clinicId })
    .from(createdUsersTable)
    .where(eq(createdUsersTable.id, userId))
    .limit(1);
  return rows[0]?.clinicId ?? null;
}
appointmentsRoutes.use('*', requireAuth);

const generateId = () => `apt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

type DbAppointment = typeof appointmentsTable.$inferSelect;

// Mapeo DB → frontend (date, time, podiatristId, duration desde notes)
function mapDbToAppointment(row: DbAppointment) {
  let duration = 30;
  let notesText = row.notes ?? '';
  if (row.notes) {
    try {
      const parsed = JSON.parse(row.notes);
      if (typeof parsed === 'object' && typeof parsed.duration === 'number') {
        duration = parsed.duration;
        notesText = typeof parsed.text === 'string' ? parsed.text : '';
      }
    } catch {
      notesText = row.notes;
    }
  }
  return {
    id: row.id,
    patientId: row.patientId ?? null,
    podiatristId: row.createdBy,
    clinicId: row.clinicId ?? '',
    date: row.sessionDate,
    time: row.sessionTime,
    duration,
    notes: notesText,
    status: row.status as 'scheduled' | 'confirmed' | 'cancelled' | 'completed',
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pendingPatientName: row.pendingPatientName ?? undefined,
    pendingPatientPhone: row.pendingPatientPhone ?? undefined,
  };
}

// Persistir duration en notes como JSON cuando haga falta
function buildNotes(notes: string, duration: number): string {
  if (duration !== 30) {
    return JSON.stringify({ duration, text: notes || '' });
  }
  return notes || '';
}

function parseNotes(notes: string | null): { duration: number; text: string } {
  if (!notes) return { duration: 30, text: '' };
  try {
    const p = JSON.parse(notes);
    if (typeof p === 'object') return { duration: p.duration ?? 30, text: p.text ?? '' };
  } catch {
    /* */
  }
  return { duration: 30, text: notes };
}

/** Convierte "HH:mm" a minutos desde medianoche. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Comprueba si el slot (date, time, duration) se solapa con otras citas del mismo podólogo. */
async function hasOverlappingSlot(
  podiatristId: string,
  date: string,
  time: string,
  duration: number,
  excludeAppointmentId?: string
): Promise<boolean> {
  const conditions = [
    eq(appointmentsTable.createdBy, podiatristId),
    eq(appointmentsTable.sessionDate, date),
  ];
  if (excludeAppointmentId) {
    conditions.push(ne(appointmentsTable.id, excludeAppointmentId));
  }
  const rows = await database
    .select()
    .from(appointmentsTable)
    .where(and(...conditions));

  const newStart = timeToMinutes(time);
  const newEnd = newStart + duration;

  for (const row of rows) {
    const existingDuration = parseNotes(row.notes).duration;
    const existingStart = timeToMinutes(row.sessionTime);
    const existingEnd = existingStart + existingDuration;
    if (newStart < existingEnd && newEnd > existingStart) return true;
  }
  return false;
}

/**
 * GET /api/appointments
 * Lista citas. Podiatrist: sus citas (createdBy=userId). Clinic_admin: por clinicId. Receptionist: por assignedPodiatristIds.
 */
appointmentsRoutes.get('/', requirePermission('view_patients'), async (c) => {
  try {
    const user = c.get('user');
    const clinicId = c.req.query('clinicId');
    const podiatristId = c.req.query('podiatristId');
    const date = c.req.query('date');

    let rows = await database.select().from(appointmentsTable);

    if (user?.role === 'podiatrist') {
      rows = rows.filter((r) => r.createdBy === user.userId);
    } else if (user?.role === 'clinic_admin' && user.clinicId) {
      rows = rows.filter((r) => r.clinicId === user.clinicId);
    } else if (user?.role === 'receptionist') {
      const assignedIds = await getAssignedPodiatristIds(user.userId);
      if (assignedIds.length === 0) {
        rows = [];
      } else {
        rows = rows.filter((r) => assignedIds.includes(r.createdBy));
      }
    }
    if (clinicId) rows = rows.filter((r) => r.clinicId === clinicId);
    if (podiatristId) rows = rows.filter((r) => r.createdBy === podiatristId);
    if (date) rows = rows.filter((r) => r.sessionDate === date);
    // No devolver citas canceladas (si quedan registros antiguos con status cancelled)
    rows = rows.filter((r) => r.status !== 'cancelled');

    const appointments = rows.map(mapDbToAppointment);
    return c.json({ success: true, appointments });
  } catch (err) {
    console.error('Error listando citas:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/appointments/:id
 */
appointmentsRoutes.get('/:id', requirePermission('view_patients'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const rows = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
    if (!rows.length) return c.json({ error: 'Cita no encontrada' }, 404);
    const row = rows[0];
    if (user?.role === 'podiatrist' && row.createdBy !== user.userId) return c.json({ error: 'Acceso denegado' }, 403);
    if (user?.role === 'clinic_admin' && user.clinicId && row.clinicId !== user.clinicId) return c.json({ error: 'Acceso denegado' }, 403);
    if (user?.role === 'receptionist') {
      const assignedIds = await getAssignedPodiatristIds(user.userId);
      if (!assignedIds.includes(row.createdBy)) return c.json({ error: 'Acceso denegado' }, 403);
    }
    return c.json({ success: true, appointment: mapDbToAppointment(row) });
  } catch (err) {
    console.error('Error obteniendo cita:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/appointments
 * Body: patientId?, podiatristId, date, time, duration?, notes?, clinicId, pendingPatientName?, pendingPatientPhone?
 */
appointmentsRoutes.post('/', requirePermission('manage_appointments'), async (c) => {
  try {
    const user = c.get('user');
    const body = (await c.req.json().catch(() => ({}))) as {
      patientId?: string | null;
      podiatristId?: string;
      date?: string;
      time?: string;
      duration?: number;
      notes?: string;
      clinicId?: string;
      pendingPatientName?: string;
      pendingPatientPhone?: string;
    };
    let podiatristId = body.podiatristId || user?.userId;
    const date = body.date || new Date().toISOString().slice(0, 10);
    const time = body.time || '09:00';
    const duration = typeof body.duration === 'number' ? body.duration : 30;
    const notes = buildNotes(body.notes ?? '', duration);
    let clinicId = body.clinicId ?? user?.clinicId ?? null;

    // Recepcionista: debe enviar podiatristId (podólogo asignado) y debe estar en sus asignados; clinicId del podólogo si falta
    if (user?.role === 'receptionist') {
      if (!podiatristId || podiatristId === user.userId) {
        return c.json({ error: 'podiatristId requerido', message: 'Debes seleccionar un podólogo para la cita' }, 400);
      }
      const assignedIds = await getAssignedPodiatristIds(user.userId);
      if (!assignedIds.includes(podiatristId)) {
        return c.json({ error: 'Acceso denegado', message: 'No puedes crear citas para ese podólogo' }, 403);
      }
      if (!clinicId) {
        clinicId = await getClinicIdForUser(podiatristId);
      }
    }

    if (!podiatristId || !date || !time) {
      return c.json({ error: 'podiatristId, date y time son requeridos' }, 400);
    }

    const overlaps = await hasOverlappingSlot(podiatristId, date, time, duration);
    if (overlaps) {
      return c.json(
        { error: 'Horario no disponible', message: 'El horario se solapa con otra cita del mismo podólogo. Elige otra hora o fecha.', code: 'APPOINTMENT_OVERLAP' },
        409
      );
    }

    const id = generateId();
    const now = new Date().toISOString();

    await database.insert(appointmentsTable).values({
      id,
      patientId: body.patientId || null,
      sessionDate: date,
      sessionTime: time,
      reason: body.notes || 'scheduled',
      status: 'scheduled',
      notes,
      createdBy: podiatristId,
      createdAt: now,
      updatedAt: now,
      clinicId,
      pendingPatientName: body.pendingPatientName ?? null,
      pendingPatientPhone: body.pendingPatientPhone ?? null,
    });

    await logAuditEvent({
      userId: user!.userId,
      action: 'CREATE_APPOINTMENT',
      resourceType: 'appointment',
      resourceId: id,
      details: { appointmentId: id, patientId: body.patientId, podiatristId, date },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: clinicId ?? undefined,
    });

    const [row] = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
    return c.json({ success: true, appointment: mapDbToAppointment(row!) });
  } catch (err) {
    console.error('Error creando cita:', err);
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: 'Error interno', message }, 500);
  }
});

/**
 * PUT /api/appointments/:id
 */
appointmentsRoutes.put('/:id', requirePermission('manage_appointments'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = (await c.req.json().catch(() => ({}))) as {
      patientId?: string | null;
      podiatristId?: string;
      date?: string;
      time?: string;
      duration?: number;
      notes?: string;
      status?: string;
      pendingPatientName?: string;
      pendingPatientPhone?: string;
    };

    const rows = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
    if (!rows.length) return c.json({ error: 'Cita no encontrada' }, 404);
    const row = rows[0];

    if (user?.role === 'podiatrist' && row.createdBy !== user.userId) return c.json({ error: 'Acceso denegado' }, 403);
    if (user?.role === 'clinic_admin' && user.clinicId && row.clinicId !== user.clinicId) return c.json({ error: 'Acceso denegado' }, 403);
    if (user?.role === 'receptionist') {
      const assignedIds = await getAssignedPodiatristIds(user.userId);
      if (!assignedIds.includes(row.createdBy)) return c.json({ error: 'Acceso denegado' }, 403);
    }

    const duration = typeof body.duration === 'number' ? body.duration : parseNotes(row.notes).duration;
    const notes = buildNotes(body.notes ?? parseNotes(row.notes).text, duration);
    const now = new Date().toISOString();

    const effectivePodiatristId = body.podiatristId ?? row.createdBy;
    const effectiveDate = body.date ?? row.sessionDate;
    const effectiveTime = body.time ?? row.sessionTime;
    const overlaps = await hasOverlappingSlot(
      effectivePodiatristId,
      effectiveDate,
      effectiveTime,
      duration,
      id
    );
    if (overlaps) {
      return c.json(
        { error: 'Horario no disponible', message: 'El horario se solapa con otra cita del mismo podólogo. Elige otra hora o fecha.', code: 'APPOINTMENT_OVERLAP' },
        409
      );
    }

    await database
      .update(appointmentsTable)
      .set({
        patientId: body.patientId !== undefined ? body.patientId : row.patientId,
        sessionDate: body.date ?? row.sessionDate,
        sessionTime: body.time ?? row.sessionTime,
        reason: body.notes ?? row.reason,
        status: (body.status as any) ?? row.status,
        notes,
        createdBy: body.podiatristId ?? row.createdBy,
        updatedAt: now,
        pendingPatientName: body.pendingPatientName !== undefined ? body.pendingPatientName : row.pendingPatientName,
        pendingPatientPhone: body.pendingPatientPhone !== undefined ? body.pendingPatientPhone : row.pendingPatientPhone,
      })
      .where(eq(appointmentsTable.id, id));

    await logAuditEvent({
      userId: user!.userId,
      action: 'UPDATE_APPOINTMENT',
      resourceType: 'appointment',
      resourceId: id,
      details: { appointmentId: id, ...body },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: row.clinicId ?? undefined,
    });

    const [updated] = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
    return c.json({ success: true, appointment: mapDbToAppointment(updated!) });
  } catch (err) {
    console.error('Error actualizando cita:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * DELETE /api/appointments/:id
 * Elimina la cita del registro (borrado real).
 */
appointmentsRoutes.delete('/:id', requirePermission('manage_appointments'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const rows = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
    if (!rows.length) return c.json({ error: 'Cita no encontrada' }, 404);
    const row = rows[0];

    if (user?.role === 'podiatrist' && row.createdBy !== user.userId) return c.json({ error: 'Acceso denegado' }, 403);
    if (user?.role === 'clinic_admin' && user.clinicId && row.clinicId !== user.clinicId) return c.json({ error: 'Acceso denegado' }, 403);
    if (user?.role === 'receptionist') {
      const assignedIds = await getAssignedPodiatristIds(user.userId);
      if (!assignedIds.includes(row.createdBy)) return c.json({ error: 'Acceso denegado' }, 403);
    }

    await database.delete(appointmentsTable).where(eq(appointmentsTable.id, id));

    await logAuditEvent({
      userId: user!.userId,
      action: 'DELETE_APPOINTMENT',
      resourceType: 'appointment',
      resourceId: id,
      details: { appointmentId: id, patientId: row.patientId, date: row.sessionDate, time: row.sessionTime },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: row.clinicId ?? undefined,
    });

    return c.json({ success: true, message: 'Cita eliminada del registro' });
  } catch (err) {
    console.error('Error cancelando cita:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default appointmentsRoutes;
