import { eq, and } from 'drizzle-orm';
import { database } from '../database';
import {
  appointments,
  patients,
  userWhatsappIntegrations,
  appointmentReminderSent,
  createdUsers,
} from '../database/schema';
import { decryptSecret } from './field-encryption';
import { sendWhatsAppTemplateMessage } from './whatsapp-meta-api';
import { logger } from './logger';

export interface ReminderSchedule {
  daysBefore: number[];
  hoursBefore: number[];
}

const DEFAULT_SCHEDULE: ReminderSchedule = {
  daysBefore: [5, 2, 1],
  hoursBefore: [24, 12, 2],
};

export function parseReminderSchedule(raw: string | null): ReminderSchedule {
  if (!raw) return DEFAULT_SCHEDULE;
  try {
    const parsed = JSON.parse(raw) as ReminderSchedule;
    return {
      daysBefore: Array.isArray(parsed.daysBefore) ? parsed.daysBefore : DEFAULT_SCHEDULE.daysBefore,
      hoursBefore: Array.isArray(parsed.hoursBefore) ? parsed.hoursBefore : DEFAULT_SCHEDULE.hoursBefore,
    };
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

function appointmentDateTimeMs(date: string, time: string): number {
  const iso = `${date}T${time.length === 5 ? time : time.slice(0, 5)}:00`;
  return new Date(iso).getTime();
}

export async function runAppointmentRemindersCron(): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;
  const now = Date.now();

  const scheduled = await database
    .select()
    .from(appointments)
    .where(eq(appointments.status, 'scheduled'));

  const integrations = await database.select().from(userWhatsappIntegrations);

  for (const appt of scheduled) {
    const creatorId = appt.createdBy;
    const wa = integrations.find((i) => i.userId === creatorId && i.enabled && i.remindersEnabled);
    if (!wa) {
      skipped++;
      continue;
    }

    let phone: string | null = null;
    let patientName = appt.pendingPatientName || 'Paciente';

    if (appt.patientId) {
      const pRows = await database.select().from(patients).where(eq(patients.id, appt.patientId)).limit(1);
      const p = pRows[0];
      if (!p?.phone?.trim()) {
        skipped++;
        continue;
      }
      phone = p.phone;
      patientName = `${p.firstName} ${p.lastName}`.trim();
    } else if (appt.pendingPatientPhone?.trim()) {
      phone = appt.pendingPatientPhone;
    } else {
      skipped++;
      continue;
    }

    const apptMs = appointmentDateTimeMs(appt.sessionDate, appt.sessionTime);
    if (apptMs <= now) {
      skipped++;
      continue;
    }

    const schedule = parseReminderSchedule(wa.reminderSchedule ?? wa.reminderHoursBefore);
    const kinds: { kind: string; due: boolean }[] = [];

    for (const d of schedule.daysBefore) {
      const targetMs = apptMs - d * 24 * 60 * 60 * 1000;
      const windowMs = 60 * 60 * 1000;
      kinds.push({ kind: `day_${d}`, due: now >= targetMs - windowMs && now <= targetMs + windowMs });
    }
    for (const h of schedule.hoursBefore) {
      const targetMs = apptMs - h * 60 * 60 * 1000;
      const windowMs = 30 * 60 * 1000;
      kinds.push({ kind: `hour_${h}`, due: now >= targetMs - windowMs && now <= targetMs + windowMs });
    }

    for (const { kind, due } of kinds) {
      if (!due) continue;

      const already = await database
        .select()
        .from(appointmentReminderSent)
        .where(and(eq(appointmentReminderSent.appointmentId, appt.id), eq(appointmentReminderSent.reminderKind, kind)))
        .limit(1);
      if (already[0]) continue;

      try {
        const token = await decryptSecret(wa.accessTokenEnc);
        const result = await sendWhatsAppTemplateMessage({
          phoneNumberId: wa.phoneNumberId,
          accessToken: token,
          toPhoneE164: phone,
          templateName: wa.templateName || 'appointment_reminder',
          templateLanguage: wa.templateLanguage,
          bodyParams: [patientName, appt.sessionDate, appt.sessionTime],
        });
        if (!result.ok) {
          skipped++;
          continue;
        }
        await database.insert(appointmentReminderSent).values({
          id: crypto.randomUUID(),
          appointmentId: appt.id,
          reminderKind: kind,
          sentAt: new Date().toISOString(),
        });
        sent++;
      } catch (err) {
        logger.error({ event: 'reminder_send_failed', appointmentId: appt.id, kind, message: String(err) });
        skipped++;
      }
    }
  }

  return { sent, skipped };
}
