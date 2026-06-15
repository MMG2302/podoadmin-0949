import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { database } from '../database';
import { appointments, patients, whatsappMessageEvents } from '../database/schema';
import { canConfigureWhatsApp, getWhatsAppCredentialsForUser } from '../utils/whatsapp-integration';
import { sendWhatsAppTemplateMessage } from '../utils/whatsapp-meta-api';
import { buildReminderTemplateBodyParams } from '../utils/whatsapp-reminder-params';
import { logAuditEvent } from '../utils/audit-log';
import { getClientIP } from '../utils/ip-tracking';
import { getSafeUserAgent } from '../utils/request-headers';

const whatsappMessagesRoutes = new Hono();
whatsappMessagesRoutes.use('*', requireAuth);

const sendReminderSchema = z.object({
  appointmentId: z.string().min(1).max(128),
  extraNote: z.string().max(500).optional().nullable(),
});

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `+${digits}`;
}

/**
 * GET /api/whatsapp-messages
 * Historial operativo de mensajes WhatsApp (fase 1).
 */
whatsappMessagesRoutes.get('/', async (c) => {
  try {
    const user = c.get('user');
    if (!canConfigureWhatsApp(user.role)) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const limit = Math.min(parseInt(c.req.query('limit') || '100', 10) || 100, 300);
    const rows = await database
      .select()
      .from(whatsappMessageEvents)
      .where(eq(whatsappMessageEvents.userId, user.userId))
      .orderBy(desc(whatsappMessageEvents.createdAt))
      .limit(limit);

    return c.json({
      success: true,
      messages: rows.map((r) => ({
        id: r.id,
        appointmentId: r.appointmentId,
        patientId: r.patientId,
        patientPhone: r.patientPhone,
        patientName: r.patientName,
        messageType: r.messageType,
        direction: r.direction,
        status: r.status,
        providerMessageId: r.providerMessageId,
        errorMessage: r.errorMessage,
        extraNote: r.extraNote,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error listando whatsapp messages:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

/**
 * POST /api/whatsapp-messages/send-reminder
 * Envío manual de recordatorio para una cita (fase 1).
 */
whatsappMessagesRoutes.post('/send-reminder', async (c) => {
  try {
    const user = c.get('user');
    if (!canConfigureWhatsApp(user.role)) {
      return c.json({ error: 'Acceso denegado' }, 403);
    }

    const parsed = sendReminderSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) {
      return c.json({ error: 'Datos inválidos', issues: parsed.error.flatten() }, 400);
    }

    const appointmentRows = await database
      .select()
      .from(appointments)
      .where(eq(appointments.id, parsed.data.appointmentId))
      .limit(1);
    const appointment = appointmentRows[0];
    if (!appointment) return c.json({ error: 'Cita no encontrada' }, 404);

    // Ownership: clinic_admin puede enviar de su clínica; podiatrist solo sus citas.
    if (user.role === 'podiatrist' && appointment.createdBy !== user.userId) {
      return c.json({ error: 'Acceso denegado', message: 'No puedes enviar recordatorios de citas de otro podólogo' }, 403);
    }
    if (user.role === 'clinic_admin' && user.clinicId && appointment.clinicId !== user.clinicId) {
      return c.json({ error: 'Acceso denegado', message: 'No puedes enviar recordatorios de otra clínica' }, 403);
    }

    const creds = await getWhatsAppCredentialsForUser(user.userId);
    if (!creds || !creds.enabled || !creds.remindersEnabled) {
      return c.json(
        {
          error: 'WhatsApp no configurado',
          message: 'Configura y activa WhatsApp Business en Ajustes para enviar recordatorios.',
        },
        400
      );
    }
    if (!creds.templateName) {
      return c.json({ error: 'Plantilla faltante', message: 'Define templateName en Ajustes de WhatsApp.' }, 400);
    }

    let patientPhone = appointment.pendingPatientPhone ?? null;
    let patientName = appointment.pendingPatientName ?? 'Paciente';
    if (appointment.patientId) {
      const patientRows = await database
        .select({ id: patients.id, phone: patients.phone, firstName: patients.firstName, lastName: patients.lastName })
        .from(patients)
        .where(eq(patients.id, appointment.patientId))
        .limit(1);
      const p = patientRows[0];
      if (p) {
        patientPhone = p.phone || patientPhone;
        patientName = `${p.firstName} ${p.lastName}`.trim() || patientName;
      }
    }

    const phoneE164 = normalizePhone(patientPhone);
    if (!phoneE164) {
      return c.json({ error: 'Teléfono inválido', message: 'La cita no tiene un teléfono válido para WhatsApp.' }, 400);
    }

    const nowIso = new Date().toISOString();
    const eventId = `wa_evt_${crypto.randomUUID().replace(/-/g, '')}`;
    const resolvedExtra = buildReminderTemplateBodyParams(
      patientName,
      appointment.sessionDate,
      appointment.sessionTime,
      parsed.data.extraNote,
      creds.defaultExtraNote
    )[3];
    const payload = {
      appointmentDate: appointment.sessionDate,
      appointmentTime: appointment.sessionTime,
      patientName,
      extraNote: resolvedExtra,
    };

    const sent = await sendWhatsAppTemplateMessage({
      phoneNumberId: creds.phoneNumberId,
      accessToken: creds.accessToken,
      toPhoneE164: phoneE164,
      templateName: creds.templateName,
      templateLanguage: creds.templateLanguage || 'es',
      bodyParams: buildReminderTemplateBodyParams(
        patientName,
        appointment.sessionDate,
        appointment.sessionTime,
        parsed.data.extraNote,
        creds.defaultExtraNote
      ),
    });

    await database.insert(whatsappMessageEvents).values({
      id: eventId,
      userId: user.userId,
      clinicId: appointment.clinicId ?? user.clinicId ?? null,
      appointmentId: appointment.id,
      patientId: appointment.patientId ?? null,
      patientPhone: phoneE164,
      patientName,
      messageType: 'appointment_reminder',
      direction: 'outbound',
      status: sent.ok ? 'sent' : 'failed',
      providerMessageId: sent.providerMessageId ?? null,
      providerPayload: JSON.stringify(payload),
      providerResponse: sent.responseBody ? JSON.stringify(sent.responseBody) : null,
      errorMessage: sent.error ?? null,
      extraNote: resolvedExtra,
      createdAt: nowIso,
    });

    await logAuditEvent({
      userId: user.userId,
      action: 'WHATSAPP_REMINDER_SENT',
      resourceType: 'appointment',
      resourceId: appointment.id,
      details: {
        eventId,
        status: sent.ok ? 'sent' : 'failed',
        patientPhone: phoneE164,
      },
      ipAddress: getClientIP(c.req.raw.headers),
      userAgent: getSafeUserAgent(c),
      clinicId: appointment.clinicId ?? user.clinicId ?? undefined,
    });

    if (!sent.ok) {
      return c.json(
        {
          success: false,
          error: 'Error enviando WhatsApp',
          message: sent.error || 'No se pudo enviar el recordatorio',
          eventId,
        },
        502
      );
    }

    return c.json({
      success: true,
      eventId,
      providerMessageId: sent.providerMessageId ?? null,
      status: 'sent',
    });
  } catch (error) {
    console.error('Error enviando recordatorio WhatsApp:', error);
    return c.json({ error: 'Error interno' }, 500);
  }
});

export default whatsappMessagesRoutes;
