/**
 * Confirmación/cancelación de citas por enlace público (sin sesión).
 * El paciente llega desde el mensaje de WhatsApp con ?token=<confirm_token>.
 * El token es un UUID sin guiones generado al crear el enlace (no adivinable).
 */
import { Hono } from 'hono';
import { and, eq, ne } from 'drizzle-orm';
import { database } from '../database';
import {
  appointments as appointmentsTable,
  patients as patientsTable,
  clinics as clinicsTable,
  createdUsers as createdUsersTable,
  professionalLogos as professionalLogosTable,
} from '../database/schema';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';
import {
  createNotification,
  notifyAppointmentCancelled,
  notifyAssignedReceptionists,
  notifyPodiatristAboutAppointment,
} from '../utils/notifications-service';
import { resolveRescheduleMessage } from '../utils/reschedule-message';
import {
  BOOKING_WINDOW_DAYS,
  computeAvailableSlots,
  getBookingBranding,
  resolveBookingToken,
  todayInTimezone,
} from '../utils/booking';
import { resolveAgendaSettingsForPodiatrist } from '../utils/agenda-settings';
import { sanitizePathParam } from '../utils/sanitization';
import { getR2Bucket, isR2Reference, r2KeyFromReference, resolvePublicR2Url } from '../utils/r2-media';

const reservationActionsRoutes = new Hono();

const TOKEN_RE = /^[a-f0-9]{16,64}$/i;

type DbAppointment = typeof appointmentsTable.$inferSelect;

async function findAppointmentByToken(rawToken: string | undefined): Promise<DbAppointment | null> {
  const token = rawToken?.trim() ?? '';
  if (!TOKEN_RE.test(token)) return null;
  const rows = await database
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.confirmToken, token))
    .limit(1);
  return rows[0] ?? null;
}

/** La cita ya pasó (fecha+hora, con 1h de gracia). */
function isPastAppointment(row: DbAppointment): boolean {
  const dt = new Date(`${row.sessionDate}T${row.sessionTime || '00:00'}:00`);
  if (Number.isNaN(dt.getTime())) return false;
  return dt.getTime() < Date.now() - 60 * 60 * 1000;
}

function parseDurationFromNotes(notes: string | null): number {
  if (!notes) return 30;
  try {
    const p = JSON.parse(notes) as { duration?: number };
    if (typeof p === 'object' && typeof p.duration === 'number') return p.duration;
  } catch {
    /* notas planas */
  }
  return 30;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** ¿El hueco de la cita sigue libre? (para reconfirmar una cita cancelada por error). */
async function slotStillFree(row: DbAppointment): Promise<boolean> {
  const others = await database
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.createdBy, row.createdBy),
        eq(appointmentsTable.sessionDate, row.sessionDate),
        ne(appointmentsTable.id, row.id)
      )
    );
  const start = timeToMinutes(row.sessionTime);
  const end = start + parseDurationFromNotes(row.notes);
  for (const other of others) {
    if (other.status === 'cancelled') continue;
    const oStart = timeToMinutes(other.sessionTime);
    const oEnd = oStart + parseDurationFromNotes(other.notes);
    if (start < oEnd && end > oStart) return false;
  }
  return true;
}

/** Resuelve el logo almacenado (data URI, r2:// o URL) a una URL usable en `<img src>` sin requerir sesión. */
function resolvePublicLogoUrl(
  stored: string | null | undefined,
  scope: 'clinic' | 'professional',
  id: string
): string | null {
  if (!stored) return null;
  if (stored.startsWith('data:')) return stored;
  if (isR2Reference(stored)) {
    const key = r2KeyFromReference(stored);
    const proxyPath =
      scope === 'clinic' ? `/api/reservations/logo/clinic/${id}` : `/api/reservations/logo/professional/${id}`;
    return resolvePublicR2Url(key, proxyPath);
  }
  if (stored.startsWith('http://') || stored.startsWith('https://')) return stored;
  return null;
}

/** Datos mínimos que ve el paciente: nombre de pila, fecha/hora, clínica y profesional. */
async function buildPublicInfo(row: DbAppointment) {
  let firstName = row.pendingPatientName?.trim().split(/\s+/)[0] ?? '';
  if (row.patientId) {
    const p = await database
      .select({ firstName: patientsTable.firstName })
      .from(patientsTable)
      .where(eq(patientsTable.id, row.patientId))
      .limit(1);
    if (p[0]?.firstName) firstName = p[0].firstName;
  }
  let clinicName: string | null = null;
  let logoUrl: string | null = null;
  let clinicMapsUrl: string | null = null;
  if (row.clinicId) {
    const cRows = await database
      .select({ clinicName: clinicsTable.clinicName, logo: clinicsTable.logo, mapsUrl: clinicsTable.mapsUrl })
      .from(clinicsTable)
      .where(eq(clinicsTable.clinicId, row.clinicId))
      .limit(1);
    clinicName = cRows[0]?.clinicName ?? null;
    logoUrl = resolvePublicLogoUrl(cRows[0]?.logo, 'clinic', row.clinicId);
    clinicMapsUrl = cRows[0]?.mapsUrl?.trim() || null;
  } else {
    const pRows = await database
      .select({ logo: professionalLogosTable.logo })
      .from(professionalLogosTable)
      .where(eq(professionalLogosTable.userId, row.createdBy))
      .limit(1);
    logoUrl = resolvePublicLogoUrl(pRows[0]?.logo, 'professional', row.createdBy);
  }
  const podRows = await database
    .select({ name: createdUsersTable.name })
    .from(createdUsersTable)
    .where(eq(createdUsersTable.userId, row.createdBy))
    .limit(1);

  const rescheduleMessage = await resolveRescheduleMessage(row.createdBy, row.clinicId ?? null);

  return {
    patientFirstName: firstName || null,
    date: row.sessionDate,
    time: row.sessionTime,
    status: row.status,
    clinicName,
    podiatristName: podRows[0]?.name ?? null,
    logoUrl,
    rescheduleMessage,
    clinicMapsUrl,
    satisfactionRating: row.satisfactionRating ?? null,
  };
}

async function notifyPodiatristAboutResponse(
  row: DbAppointment,
  action: 'confirmed' | 'cancelled'
): Promise<void> {
  const info = await buildPublicInfo(row);
  const who = info.patientFirstName || 'El paciente';
  const title = action === 'confirmed' ? 'Cita confirmada por el paciente' : 'Cita cancelada por el paciente';
  const message =
    action === 'confirmed'
      ? `${who} confirmó su cita del ${row.sessionDate} a las ${row.sessionTime}.`
      : `${who} canceló su cita del ${row.sessionDate} a las ${row.sessionTime}. El horario quedó libre.`;
  const metadata = { appointmentId: row.id, action, source: 'patient_link' };
  await createNotification({
    userId: row.createdBy,
    type: 'appointment',
    title,
    message,
    metadata,
  }).catch((err) => console.error('Error notificando respuesta de cita:', err));
  // El recepcionista asignado al podólogo también debe enterarse.
  await notifyAssignedReceptionists(row.createdBy, { type: 'appointment', title, message, metadata }).catch(
    (err) => console.error('Error notificando a recepcionistas:', err)
  );
}

async function auditPatientResponse(
  meta: { ipAddress?: string; userAgent?: string },
  row: DbAppointment,
  action:
    | 'CONFIRM_APPOINTMENT_LINK'
    | 'CANCEL_APPOINTMENT_LINK'
    | 'RESCHEDULE_APPOINTMENT_LINK'
    | 'SATISFACTION_LINK'
    | 'ONLINE_BOOKING'
): Promise<void> {
  await logAuditEvent({
    userId: 'patient_link',
    action,
    resourceType: 'appointment',
    resourceId: row.id,
    details: { appointmentId: row.id, date: row.sessionDate, time: row.sessionTime, via: 'confirm_token' },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    clinicId: row.clinicId ?? undefined,
  }).catch((err) => console.error('Error registrando auditoría de respuesta de cita:', err));
}

/** GET /api/reservations/info?token=... — detalles mínimos para la página pública. */
reservationActionsRoutes.get('/info', async (c) => {
  const row = await findAppointmentByToken(c.req.query('token'));
  if (!row) return c.json({ error: 'invalid_token' }, 404);
  if (isPastAppointment(row)) {
    return c.json({ error: 'expired', reservation: await buildPublicInfo(row) }, 410);
  }
  return c.json({ success: true, reservation: await buildPublicInfo(row) });
});

/** POST /api/reservations/confirm { token } — la acción se dispara al abrir la página. */
reservationActionsRoutes.post('/confirm', async (c) => {
  const body = await c.req.json().catch(() => ({} as { token?: string }));
  const row = await findAppointmentByToken(body.token);
  if (!row) return c.json({ error: 'invalid_token' }, 404);
  if (isPastAppointment(row)) return c.json({ error: 'expired' }, 410);
  if (row.status === 'completed') return c.json({ error: 'expired' }, 410);
  if (row.status === 'confirmed') {
    return c.json({
      success: true,
      alreadyResponded: true,
      status: 'confirmed',
      reservation: await buildPublicInfo(row),
    });
  }
  // Cancelada por error desde el mismo enlace: se puede reconfirmar si el hueco sigue libre.
  if (row.status === 'cancelled' && !(await slotStillFree(row))) {
    return c.json({ error: 'slot_taken', reservation: await buildPublicInfo(row) }, 409);
  }

  const now = new Date().toISOString();
  await database
    .update(appointmentsTable)
    .set({
      status: 'confirmed',
      confirmationRespondedAt: now,
      updatedAt: now,
      // Si venía de una solicitud de reagendo (o cancelación) y el paciente se arrepiente
      // y confirma de nuevo, la alerta interna de reagendo pendiente deja de aplicar.
      ...(row.rescheduleStatus === 'pending' ? { rescheduleStatus: 'resolved' as const } : {}),
    })
    .where(eq(appointmentsTable.id, row.id));

  await auditPatientResponse(
    { ipAddress: getClientIP(c.req.raw.headers), userAgent: getSafeUserAgent(c) },
    row,
    'CONFIRM_APPOINTMENT_LINK'
  );
  await notifyPodiatristAboutResponse(row, 'confirmed');

  return c.json({
    success: true,
    status: 'confirmed',
    reservation: await buildPublicInfo({ ...row, status: 'confirmed' }),
  });
});

/** POST /api/reservations/cancel { token } — la acción se dispara al abrir la página. */
reservationActionsRoutes.post('/cancel', async (c) => {
  const body = await c.req.json().catch(() => ({} as { token?: string }));
  const row = await findAppointmentByToken(body.token);
  if (!row) return c.json({ error: 'invalid_token' }, 404);
  if (isPastAppointment(row)) return c.json({ error: 'expired' }, 410);
  if (row.status === 'completed') return c.json({ error: 'expired' }, 410);
  if (row.status === 'cancelled') {
    return c.json({
      success: true,
      alreadyResponded: true,
      status: 'cancelled',
      reservation: await buildPublicInfo(row),
    });
  }

  const now = new Date().toISOString();
  await database
    .update(appointmentsTable)
    .set({ status: 'cancelled', confirmationRespondedAt: now, updatedAt: now })
    .where(eq(appointmentsTable.id, row.id));

  await auditPatientResponse(
    { ipAddress: getClientIP(c.req.raw.headers), userAgent: getSafeUserAgent(c) },
    row,
    'CANCEL_APPOINTMENT_LINK'
  );
  await notifyPodiatristAboutResponse(row, 'cancelled');

  return c.json({
    success: true,
    status: 'cancelled',
    reservation: await buildPublicInfo({ ...row, status: 'cancelled' }),
  });
});

/**
 * POST /api/reservations/reschedule { token } — el paciente pide reagendar (cancela y abre
 * la alerta interna de reagendo pendiente para que el staff se vuelva a comunicar con él).
 */
reservationActionsRoutes.post('/reschedule', async (c) => {
  const body = await c.req.json().catch(() => ({} as { token?: string }));
  const row = await findAppointmentByToken(body.token);
  if (!row) return c.json({ error: 'invalid_token' }, 404);
  if (isPastAppointment(row)) return c.json({ error: 'expired' }, 410);
  if (row.status === 'completed') return c.json({ error: 'expired' }, 410);
  // Solo es "ya respondido" si el reagendo YA estaba pendiente (evita notificar dos veces
  // por el mismo clic). Si la cita se canceló por el enlace plano de "Cancelar" y DESPUÉS
  // se abre el de "Reagendar", sí debe aplicar: activa la alerta y notifica al staff.
  if (row.status === 'cancelled' && row.rescheduleStatus === 'pending') {
    return c.json({
      success: true,
      alreadyResponded: true,
      status: 'cancelled',
      reservation: await buildPublicInfo(row),
    });
  }

  const now = new Date().toISOString();
  await database
    .update(appointmentsTable)
    .set({
      status: 'cancelled',
      confirmationRespondedAt: now,
      updatedAt: now,
      rescheduleStatus: 'pending',
      rescheduleRequestedAt: now,
      lastRescheduleAlertAt: now,
    })
    .where(eq(appointmentsTable.id, row.id));

  await auditPatientResponse(
    { ipAddress: getClientIP(c.req.raw.headers), userAgent: getSafeUserAgent(c) },
    row,
    'RESCHEDULE_APPOINTMENT_LINK'
  );
  await notifyAppointmentCancelled({
    appointmentId: row.id,
    podiatristUserId: row.createdBy,
    clinicId: row.clinicId ?? null,
    actorUserId: 'patient_link',
    actorName: 'Paciente',
    patientId: row.patientId,
    patientName: row.pendingPatientName,
    date: row.sessionDate,
    time: row.sessionTime,
    patientInitiated: true,
  }).catch((err) => console.error('Error notificando solicitud de reagendo:', err));

  return c.json({
    success: true,
    status: 'cancelled',
    reservation: await buildPublicInfo({ ...row, status: 'cancelled' }),
  });
});

const RATINGS = ['good', 'regular', 'bad'] as const;
type Rating = (typeof RATINGS)[number];

/**
 * POST /api/reservations/satisfaction { token, rating } — el paciente califica su visita.
 * La acción se dispara al abrir la página de opinión. Guarda el rating (idempotente: se puede
 * corregir mientras la cita siga completada). No cierra nada: si es 'bad', el front deja
 * abierto un espacio de queja/sugerencia que llega por /satisfaction-comment.
 */
reservationActionsRoutes.post('/satisfaction', async (c) => {
  const body = await c.req.json().catch(() => ({} as { token?: string; rating?: string }));
  const row = await findAppointmentByToken(body.token);
  if (!row) return c.json({ error: 'invalid_token' }, 404);
  const rating = body.rating as Rating;
  if (!RATINGS.includes(rating)) return c.json({ error: 'invalid_rating' }, 400);

  const now = new Date().toISOString();
  await database
    .update(appointmentsTable)
    .set({ satisfactionRating: rating, satisfactionRespondedAt: now, updatedAt: now })
    .where(eq(appointmentsTable.id, row.id));

  await auditPatientResponse(
    { ipAddress: getClientIP(c.req.raw.headers), userAgent: getSafeUserAgent(c) },
    row,
    'SATISFACTION_LINK'
  );
  // Una calificación negativa genera alerta interna para que el staff atienda al paciente.
  if (rating === 'bad') {
    const info = await buildPublicInfo(row);
    const who = info.patientFirstName || 'Un paciente';
    await createNotification({
      userId: row.createdBy,
      type: 'appointment',
      title: 'Opinión negativa de un paciente',
      message: `${who} calificó su visita del ${row.sessionDate} como insatisfactoria. Revisa sus comentarios y da seguimiento.`,
      metadata: { appointmentId: row.id, rating, source: 'satisfaction_link' },
    }).catch((err) => console.error('Error notificando opinión negativa:', err));
    await notifyAssignedReceptionists(row.createdBy, {
      type: 'appointment',
      title: 'Opinión negativa de un paciente',
      message: `${who} calificó su visita del ${row.sessionDate} como insatisfactoria.`,
      metadata: { appointmentId: row.id, rating, source: 'satisfaction_link' },
    }).catch((err) => console.error('Error notificando opinión negativa a recepción:', err));
  }

  return c.json({ success: true, rating, reservation: await buildPublicInfo({ ...row, satisfactionRating: rating }) });
});

/**
 * POST /api/reservations/satisfaction-comment { token, comment, anonymous }
 * Queja/sugerencia opcional tras una calificación. El paciente elige si va anónima.
 */
reservationActionsRoutes.post('/satisfaction-comment', async (c) => {
  const body = await c.req
    .json()
    .catch(() => ({} as { token?: string; comment?: string; anonymous?: boolean }));
  const row = await findAppointmentByToken(body.token);
  if (!row) return c.json({ error: 'invalid_token' }, 404);
  const comment = (body.comment ?? '').trim().slice(0, 2000);
  if (!comment) return c.json({ error: 'empty_comment' }, 400);

  const now = new Date().toISOString();
  await database
    .update(appointmentsTable)
    .set({ satisfactionComment: comment, satisfactionAnonymous: body.anonymous === true, updatedAt: now })
    .where(eq(appointmentsTable.id, row.id));

  return c.json({ success: true });
});

const generateBookingApptId = () => `apt_${crypto.randomUUID().replace(/-/g, '')}`;

async function bookingLogoUrl(target: { podiatristUserId: string; clinicId: string | null }): Promise<string | null> {
  if (target.clinicId) {
    const c = await database
      .select({ logo: clinicsTable.logo })
      .from(clinicsTable)
      .where(eq(clinicsTable.clinicId, target.clinicId))
      .limit(1);
    return resolvePublicLogoUrl(c[0]?.logo, 'clinic', target.clinicId);
  }
  const p = await database
    .select({ logo: professionalLogosTable.logo })
    .from(professionalLogosTable)
    .where(eq(professionalLogosTable.userId, target.podiatristUserId))
    .limit(1);
  return resolvePublicLogoUrl(p[0]?.logo, 'professional', target.podiatristUserId);
}

/** GET /api/reservations/booking-info?t=<token> — marca de la clínica + config para la página pública. */
reservationActionsRoutes.get('/booking-info', async (c) => {
  const target = await resolveBookingToken(c.req.query('t'));
  if (!target || !target.enabled) return c.json({ error: 'invalid_token' }, 404);
  const branding = await getBookingBranding(target);
  const logoUrl = await bookingLogoUrl(target);
  const { settings } = await resolveAgendaSettingsForPodiatrist(target.podiatristUserId);
  return c.json({
    success: true,
    booking: {
      clinicName: branding.clinicName,
      podiatristName: branding.podiatristName,
      mapsUrl: branding.mapsUrl,
      logoUrl,
      windowDays: BOOKING_WINDOW_DAYS,
      today: todayInTimezone(settings.timezone),
    },
  });
});

/** GET /api/reservations/slots?t=<token>&date=YYYY-MM-DD — huecos libres de una fecha. */
reservationActionsRoutes.get('/slots', async (c) => {
  const target = await resolveBookingToken(c.req.query('t'));
  if (!target || !target.enabled) return c.json({ error: 'invalid_token' }, 404);
  const date = (c.req.query('date') ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return c.json({ error: 'invalid_date' }, 400);

  const { settings } = await resolveAgendaSettingsForPodiatrist(target.podiatristUserId);
  const today = todayInTimezone(settings.timezone);
  const maxDate = todayInTimezone(settings.timezone, new Date(Date.now() + BOOKING_WINDOW_DAYS * 86400000));
  if (date < today || date > maxDate) return c.json({ success: true, slots: [] });

  const slots = await computeAvailableSlots(target.podiatristUserId, date);
  return c.json({ success: true, slots });
});

/** POST /api/reservations/book { t, date, time, name, phone } — el paciente agenda un hueco. */
reservationActionsRoutes.post('/book', async (c) => {
  const body = await c.req
    .json()
    .catch(() => ({} as { t?: string; date?: string; time?: string; name?: string; phone?: string }));
  const target = await resolveBookingToken(body.t);
  if (!target || !target.enabled) return c.json({ error: 'invalid_token' }, 404);

  const date = (body.date ?? '').trim();
  const time = (body.time ?? '').trim();
  const name = (body.name ?? '').trim().slice(0, 120);
  const phone = (body.phone ?? '').trim().slice(0, 40);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return c.json({ error: 'invalid_slot' }, 400);
  if (name.length < 2 || phone.replace(/\D/g, '').length < 8) return c.json({ error: 'invalid_contact' }, 400);

  const { settings } = await resolveAgendaSettingsForPodiatrist(target.podiatristUserId);
  const today = todayInTimezone(settings.timezone);
  const maxDate = todayInTimezone(settings.timezone, new Date(Date.now() + BOOKING_WINDOW_DAYS * 86400000));
  if (date < today || date > maxDate) return c.json({ error: 'invalid_slot' }, 400);

  // Revalidar disponibilidad para evitar doble reserva por carrera.
  const slots = await computeAvailableSlots(target.podiatristUserId, date);
  if (!slots.includes(time)) return c.json({ error: 'slot_taken' }, 409);

  const id = generateBookingApptId();
  const now = new Date().toISOString();
  await database.insert(appointmentsTable).values({
    id,
    patientId: null,
    sessionDate: date,
    sessionTime: time,
    reason: 'online_booking',
    status: 'scheduled',
    notes: '',
    createdBy: target.podiatristUserId,
    createdAt: now,
    updatedAt: now,
    clinicId: target.clinicId,
    pendingPatientName: name,
    pendingPatientPhone: phone,
  });

  await auditPatientResponse(
    { ipAddress: getClientIP(c.req.raw.headers), userAgent: getSafeUserAgent(c) },
    { id, sessionDate: date, sessionTime: time, clinicId: target.clinicId } as DbAppointment,
    'ONLINE_BOOKING'
  );
  // Avisar al podólogo (y su recepción) de la reserva en línea.
  await notifyPodiatristAboutAppointment({
    podiatristUserId: target.podiatristUserId,
    actorUserId: 'online_booking',
    actorName: name,
    patientId: null,
    date,
    time,
    notes: `Reserva en línea · ${phone}`,
    isReassignment: false,
  }).catch((err) => console.error('Error notificando reserva en línea:', err));

  const branding = await getBookingBranding(target);
  return c.json({ success: true, booking: { date, time, clinicName: branding.clinicName, podiatristName: branding.podiatristName } });
});

/**
 * GET /api/reservations/logo/clinic/:clinicId — logo público de la clínica (sin sesión).
 * Solo sirve el archivo si está almacenado en R2; es una imagen de marca, no dato sensible.
 */
reservationActionsRoutes.get('/logo/clinic/:clinicId', async (c) => {
  const clinicId = sanitizePathParam(c.req.param('clinicId'));
  if (!clinicId) return c.json({ error: 'No encontrado' }, 404);
  const rows = await database
    .select({ logo: clinicsTable.logo })
    .from(clinicsTable)
    .where(eq(clinicsTable.clinicId, clinicId))
    .limit(1);
  const stored = rows[0]?.logo;
  if (!stored || !isR2Reference(stored)) return c.json({ error: 'No encontrado' }, 404);

  const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
  if (!bucket) return c.json({ error: 'Almacenamiento no configurado' }, 503);
  const object = await bucket.get(r2KeyFromReference(stored));
  if (!object) return c.json({ error: 'Archivo no encontrado' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/webp');
  headers.set('Cache-Control', 'public, max-age=3600');
  return new Response(object.body, { headers });
});

/**
 * GET /api/reservations/logo/professional/:userId — logo público del podólogo independiente (sin sesión).
 */
reservationActionsRoutes.get('/logo/professional/:userId', async (c) => {
  const userId = sanitizePathParam(c.req.param('userId'));
  if (!userId) return c.json({ error: 'No encontrado' }, 404);
  const rows = await database
    .select({ logo: professionalLogosTable.logo })
    .from(professionalLogosTable)
    .where(eq(professionalLogosTable.userId, userId))
    .limit(1);
  const stored = rows[0]?.logo;
  if (!stored || !isR2Reference(stored)) return c.json({ error: 'No encontrado' }, 404);

  const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
  if (!bucket) return c.json({ error: 'Almacenamiento no configurado' }, 503);
  const object = await bucket.get(r2KeyFromReference(stored));
  if (!object) return c.json({ error: 'Archivo no encontrado' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/webp');
  headers.set('Cache-Control', 'public, max-age=3600');
  return new Response(object.body, { headers });
});

export default reservationActionsRoutes;
