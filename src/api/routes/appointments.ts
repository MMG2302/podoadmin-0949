import { Hono } from 'hono';
import { eq, and, ne } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { sanitizePathParam } from '../utils/sanitization';
import {
  validateData,
  validateQuery,
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentsListQuerySchema,
  appointmentsExportQuerySchema,
} from '../utils/validation';
import {
  assertAppointmentsExportAccess,
  buildAppointmentsIcsForUser,
  getClinicContactForAgendaExport,
  getPodiatristDirectPhoneForExport,
  resolveAgendaClinicId,
  listAppointmentsForExport,
} from '../utils/appointments-export';
import { database } from '../database';
import { appointments as appointmentsTable, createdUsers as createdUsersTable } from '../database/schema';
import { canUserAccess } from '../utils/user-retention';
import { logAuditEvent } from '../utils/audit-log';
import { notifyPodiatristAboutAppointment } from '../utils/notifications-service';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import {
  getAssignedPodiatristUserIds,
  getCreatedUserByIdOrUserId,
  getSessionAccessDeniedReason,
  isClinicAdminWithoutClinic,
} from '../utils/tenant-isolation';
import { assertReceptionistAgendaSlot, getAgendaOutsideHoursAdvisory } from '../utils/agenda-settings';const appointmentsRoutes = new Hono();

appointmentsRoutes.use('*', requireAuth);

// UUID criptográfico: evita acceso por rutas predecibles
const generateId = () => `apt_${crypto.randomUUID().replace(/-/g, '')}`;

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
    status: row.status as 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show',
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pendingPatientName: row.pendingPatientName ?? undefined,
    pendingPatientPhone: row.pendingPatientPhone ?? undefined,
    checkInStatus: (row.checkInStatus as 'none' | 'waiting' | 'in_room' | 'seen') ?? 'none',
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
    const user = c.get('user')!;
    if (isClinicAdminWithoutClinic(user)) {
      return c.json({ error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' }, 403);
    }
    const queryResult = validateQuery(appointmentsListQuerySchema, c.req.query());
    if (!queryResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: queryResult.error, issues: queryResult.issues }, 400);
    }
    const { clinicId, podiatristId, date, from, to } = queryResult.data;

    if (user.role === 'clinic_admin' && clinicId && clinicId !== user.clinicId) {
      return c.json({ error: 'Acceso denegado', message: 'No puedes consultar otra clínica' }, 403);
    }
    if (user.role === 'podiatrist' && podiatristId && podiatristId !== user.userId) {
      return c.json({ error: 'Acceso denegado', message: 'No puedes filtrar por otro podólogo' }, 403);
    }
    if (user.role === 'receptionist' && podiatristId) {
      const assignedIds = await getAssignedPodiatristUserIds(user.userId);
      if (!assignedIds.includes(podiatristId)) {
        return c.json({ error: 'Acceso denegado', message: 'No tienes acceso a ese podólogo' }, 403);
      }
    }

    let rows = await database.select().from(appointmentsTable);

    if (user?.role === 'podiatrist') {
      rows = rows.filter((r) => r.createdBy === user.userId);
    } else if (user?.role === 'clinic_admin') {
      rows = rows.filter((r) => r.clinicId === user.clinicId);
    } else if (user?.role === 'receptionist') {
      const assignedIds = await getAssignedPodiatristUserIds(user.userId);
      if (assignedIds.length === 0) {
        rows = [];
      } else {
        rows = rows.filter((r) => assignedIds.includes(r.createdBy));
      }
    }
    if (clinicId) rows = rows.filter((r) => r.clinicId === clinicId);
    if (podiatristId) rows = rows.filter((r) => r.createdBy === podiatristId);
    if (date) rows = rows.filter((r) => r.sessionDate === date);
    if (from) rows = rows.filter((r) => r.sessionDate >= from);
    if (to) rows = rows.filter((r) => r.sessionDate <= to);
    // No devolver citas canceladas (si quedan registros antiguos con status cancelled)
    rows = rows.filter((r) => r.status !== 'cancelled');

    const appointments = rows.map(mapDbToAppointment);
    return c.json({ success: true, appointments });
  } catch (err) {
    console.error('Error listando citas:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

function resolveExportPodiatristId(
  user: { userId: string; role: string },
  podiatristId?: string
): string | undefined {
  if (user.role === 'podiatrist') return user.userId;
  return podiatristId;
}

/**
 * GET /api/appointments/export/preview
 * Vista previa de agenda del día (texto WhatsApp + datos de clínica).
 */
appointmentsRoutes.get('/export/preview', requirePermission('manage_appointments'), async (c) => {
  try {
    const user = c.get('user')!;
    const queryResult = validateQuery(appointmentsExportQuerySchema, c.req.query());
    if (!queryResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: queryResult.error, issues: queryResult.issues }, 400);
    }
    const { date } = queryResult.data;
    const podiatristId = resolveExportPodiatristId(user, queryResult.data.podiatristId);

    const access = await assertAppointmentsExportAccess(user, podiatristId);
    if (!access.ok) {
      return c.json({ error: 'Acceso denegado', message: access.message }, access.status);
    }

    const items = await listAppointmentsForExport(user, date, podiatristId);
    const targetPodiatristId = podiatristId ?? items[0]?.podiatristId;
    const agendaClinicId = await resolveAgendaClinicId(user, targetPodiatristId ?? undefined);
    const { clinicPhone, clinicCountryCode } = await getClinicContactForAgendaExport(agendaClinicId);
    const podiatristContact = targetPodiatristId
      ? await getPodiatristDirectPhoneForExport(targetPodiatristId)
      : { phone: null, countryCode: null };

    return c.json({
      success: true,
      date,
      podiatristId: targetPodiatristId ?? null,
      podiatristName: items[0]?.podiatristName ?? null,
      podiatristPhone: podiatristContact.phone,
      podiatristCountryCode: podiatristContact.countryCode,
      clinicPhone,
      clinicCountryCode,
      appointments: items,
      count: items.length,
    });
  } catch (err) {
    console.error('Error en vista previa de agenda:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/appointments/export/ics
 * Descarga .ics del día para importar en calendario móvil.
 */
appointmentsRoutes.get('/export/ics', requirePermission('manage_appointments'), async (c) => {
  try {
    const user = c.get('user')!;
    const queryResult = validateQuery(appointmentsExportQuerySchema, c.req.query());
    if (!queryResult.success) {
      return c.json({ error: 'Parámetros inválidos', message: queryResult.error, issues: queryResult.issues }, 400);
    }
    const { date } = queryResult.data;
    const podiatristId = resolveExportPodiatristId(user, queryResult.data.podiatristId);

    const access = await assertAppointmentsExportAccess(user, podiatristId);
    if (!access.ok) {
      return c.json({ error: 'Acceso denegado', message: access.message }, access.status);
    }

    const { ics, count, calendarName } = await buildAppointmentsIcsForUser(user, date, podiatristId);

    await logAuditEvent({
      userId: user.userId,
      action: 'EXPORT',
      resourceType: 'appointment',
      resourceId: podiatristId ?? user.userId,
      details: {
        exportType: 'agenda_ics',
        date,
        appointmentCount: count,
        podiatristId: podiatristId ?? null,
      },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: user.clinicId ?? undefined,
    });

    const safeDate = date.replace(/[^\d-]/g, '');
    const filename = `agenda-${safeDate}.ics`;
    c.header('Content-Type', 'text/calendar; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.body(ics);
  } catch (err) {
    console.error('Error exportando agenda ICS:', err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * GET /api/appointments/:id
 */
appointmentsRoutes.get('/:id', requirePermission('view_patients'), async (c) => {
  try {
    const user = c.get('user')!;
    const id = sanitizePathParam(c.req.param('id'), 64);
    if (!id) return c.json({ error: 'ID de cita inválido' }, 400);
    const rows = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
    if (!rows.length) return c.json({ error: 'Cita no encontrada' }, 404);
    const row = rows[0];
    const deny = await getSessionAccessDeniedReason(user, row);
    if (deny) return c.json({ error: 'Acceso denegado', message: 'No tienes permiso para ver esta cita' }, 403);
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
    const user = c.get('user')!;
    if (isClinicAdminWithoutClinic(user)) {
      return c.json({ error: 'Acceso denegado', message: 'Cuenta de administrador de clínica sin clínica asignada' }, 403);
    }
    // Restringir creación de citas para usuarios en período de gracia (cuenta deshabilitada)
    if (user?.userId) {
      const creatorRows = await database
        .select()
        .from(createdUsersTable)
        .where(eq(createdUsersTable.userId, user.userId))
        .limit(1);
      const creator = creatorRows[0];
      if (creator && creator.isEnabled === false && canUserAccess(creator.disabledAt)) {
        return c.json(
          {
            error: 'usuario_en_periodo_gracia',
            message:
              'Tu cuenta está en período de gracia por exceso de pago. Durante 30 días puedes ver tus datos, pero no crear nuevas citas.',
          },
          403
        );
      }
    }
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(createAppointmentSchema, rawBody);
    if (!validation.success) {
      return c.json({ error: 'Datos inválidos', message: validation.error, issues: validation.issues }, 400);
    }
    const body = validation.data;
    const podiatristRaw = body.podiatristId || user.userId;
    const podiatristRow = await getCreatedUserByIdOrUserId(String(podiatristRaw));
    if (!podiatristRow || podiatristRow.role !== 'podiatrist') {
      return c.json({ error: 'Podólogo no válido', message: 'El podólogo indicado no existe o no es válido' }, 400);
    }
    const podiatristUserId = podiatristRow.userId;

    if (user.role === 'podiatrist' && podiatristUserId !== user.userId) {
      return c.json({ error: 'Acceso denegado', message: 'No puedes crear citas para otro podólogo' }, 403);
    }
    if (user.role === 'clinic_admin' && podiatristRow.clinicId !== user.clinicId) {
      return c.json({ error: 'Acceso denegado', message: 'El podólogo no pertenece a tu clínica' }, 403);
    }
    if (user.role === 'receptionist') {
      if (!body.podiatristId || podiatristUserId === user.userId) {
        return c.json({ error: 'podiatristId requerido', message: 'Debes seleccionar un podólogo para la cita' }, 400);
      }
      const assignedIds = await getAssignedPodiatristUserIds(user.userId);
      if (!assignedIds.includes(podiatristUserId)) {
        return c.json({ error: 'Acceso denegado', message: 'No puedes crear citas para ese podólogo' }, 403);
      }
    }

    const date = body.date || new Date().toISOString().slice(0, 10);
    const time = body.time || '09:00';
    const duration = typeof body.duration === 'number' ? body.duration : 30;
    const notes = buildNotes(body.notes ?? '', duration);
    let clinicId =
      user.role === 'clinic_admin'
        ? user.clinicId ?? null
        : body.clinicId ?? user.clinicId ?? podiatristRow.clinicId ?? null;

    if (!podiatristUserId || !date || !time) {
      return c.json({ error: 'podiatristId, date y time son requeridos' }, 400);
    }

    const overlaps = await hasOverlappingSlot(podiatristUserId, date, time, duration);
    if (overlaps) {
      return c.json(
        { error: 'Horario no disponible', message: 'El horario se solapa con otra cita del mismo podólogo. Elige otra hora o fecha.', code: 'APPOINTMENT_OVERLAP' },
        409
      );
    }

    const agendaBlock = await assertReceptionistAgendaSlot(user, podiatristUserId, time, duration);
    if (agendaBlock) {
      return c.json(
        { error: 'Fuera de horario', message: agendaBlock.message, code: agendaBlock.code },
        403
      );
    }

    const agendaWarning = await getAgendaOutsideHoursAdvisory(user, podiatristUserId, time, duration);

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
      createdBy: podiatristUserId,
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
      details: { appointmentId: id, patientId: body.patientId, podiatristUserId, date },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: clinicId ?? undefined,
    });

    const [row] = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);

    if (podiatristUserId !== user.userId) {
      const actorName =
        (await database.select({ name: createdUsersTable.name }).from(createdUsersTable).where(eq(createdUsersTable.userId, user.userId)).limit(1))[0]
          ?.name ?? user.email;
      const notesText = parseNotes(notes).text;
      await notifyPodiatristAboutAppointment({
        podiatristUserId,
        actorUserId: user.userId,
        actorName,
        patientId: body.patientId ?? null,
        date,
        time,
        notes: notesText,
        isReassignment: false,
      }).catch((err) => console.error('Error enviando notificación de cita:', err));
    }

    return c.json({
      success: true,
      appointment: mapDbToAppointment(row!),
      ...(agendaWarning ? { agendaWarning } : {}),
    });
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
    const user = c.get('user')!;
    const id = sanitizePathParam(c.req.param('id'), 64);
    if (!id) return c.json({ error: 'ID de cita inválido' }, 400);
    const rawBody = await c.req.json().catch(() => ({}));
    const validation = validateData(updateAppointmentSchema, rawBody);
    if (!validation.success) {
      return c.json({ error: 'Datos inválidos', message: validation.error, issues: validation.issues }, 400);
    }
    const body = validation.data;

    const rows = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
    if (!rows.length) return c.json({ error: 'Cita no encontrada' }, 404);
    const row = rows[0];
    const previousPodiatristId = row.createdBy;

    const denyPut = await getSessionAccessDeniedReason(user, row);
    if (denyPut) return c.json({ error: 'Acceso denegado', message: 'No tienes permiso para modificar esta cita' }, 403);

    const duration = typeof body.duration === 'number' ? body.duration : parseNotes(row.notes).duration;
    const notes = buildNotes(body.notes ?? parseNotes(row.notes).text, duration);
    const now = new Date().toISOString();

    let effectivePodiatristId = row.createdBy;
    if (body.podiatristId !== undefined && body.podiatristId !== null && String(body.podiatristId).trim() !== '') {
      const pr = await getCreatedUserByIdOrUserId(String(body.podiatristId).trim());
      if (!pr || pr.role !== 'podiatrist') {
        return c.json({ error: 'Podólogo no válido' }, 400);
      }
      if (user.role === 'podiatrist' && pr.userId !== user.userId) {
        return c.json({ error: 'Acceso denegado' }, 403);
      }
      if (user.role === 'clinic_admin' && pr.clinicId !== user.clinicId) {
        return c.json({ error: 'Acceso denegado' }, 403);
      }
      if (user.role === 'receptionist') {
        const ax = await getAssignedPodiatristUserIds(user.userId);
        if (!ax.includes(pr.userId)) return c.json({ error: 'Acceso denegado' }, 403);
      }
      effectivePodiatristId = pr.userId;
    }
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

    const schedulingTouched =
      body.date != null ||
      body.time != null ||
      body.duration != null ||
      (body.podiatristId !== undefined && body.podiatristId !== null && String(body.podiatristId).trim() !== '');

    if (schedulingTouched) {
      const agendaBlock = await assertReceptionistAgendaSlot(
        user,
        effectivePodiatristId,
        effectiveTime,
        duration
      );
      if (agendaBlock) {
        return c.json(
          { error: 'Fuera de horario', message: agendaBlock.message, code: agendaBlock.code },
          403
        );
      }
    }

    const agendaWarning =
      schedulingTouched
        ? await getAgendaOutsideHoursAdvisory(user, effectivePodiatristId, effectiveTime, duration)
        : null;

    await database
      .update(appointmentsTable)
      .set({
        patientId: body.patientId !== undefined ? body.patientId : row.patientId,
        sessionDate: body.date ?? row.sessionDate,
        sessionTime: body.time ?? row.sessionTime,
        reason: body.notes ?? row.reason,
        status: (body.status as any) ?? row.status,
        notes,
        createdBy: effectivePodiatristId,
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

    if (effectivePodiatristId !== previousPodiatristId) {
      const actorName =
        (await database.select({ name: createdUsersTable.name }).from(createdUsersTable).where(eq(createdUsersTable.userId, user.userId)).limit(1))[0]
          ?.name ?? user.email;
      const notesText = parseNotes(notes).text;
      await notifyPodiatristAboutAppointment({
        podiatristUserId: effectivePodiatristId,
        actorUserId: user.userId,
        actorName,
        patientId: body.patientId !== undefined ? body.patientId : row.patientId,
        date: effectiveDate,
        time: effectiveTime,
        notes: notesText,
        isReassignment: true,
      }).catch((err) => console.error('Error enviando notificación de reasignación de cita:', err));
    }

    return c.json({
      success: true,
      appointment: mapDbToAppointment(updated!),
      ...(agendaWarning ? { agendaWarning } : {}),
    });
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
    const user = c.get('user')!;
    const id = sanitizePathParam(c.req.param('id'), 64);
    if (!id) return c.json({ error: 'ID de cita inválido' }, 400);

    const rows = await database.select().from(appointmentsTable).where(eq(appointmentsTable.id, id)).limit(1);
    if (!rows.length) return c.json({ error: 'Cita no encontrada' }, 404);
    const row = rows[0];

    const denyDel = await getSessionAccessDeniedReason(user, row);
    if (denyDel) return c.json({ error: 'Acceso denegado', message: 'No tienes permiso para eliminar esta cita' }, 403);

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
