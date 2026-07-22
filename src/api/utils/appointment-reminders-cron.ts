import { eq, inArray } from 'drizzle-orm';
import { database } from '../database';
import {
  appointments,
  patients,
  userWhatsappIntegrations,
  appointmentReminderSent,
} from '../database/schema';
import { logger } from './logger';
import { enqueueNotification } from '../queues/producer';
import { processWhatsAppReminderJob } from '../queues/processor';
import type { WhatsAppReminderJob } from '../queues/notification-messages';

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

async function dispatchReminder(job: WhatsAppReminderJob): Promise<'sent' | 'skipped' | 'queued'> {
  const queued = await enqueueNotification(job);
  if (queued) return 'queued';
  const result = await processWhatsAppReminderJob(job);
  if (result.skipped) return 'skipped';
  return result.ok ? 'sent' : 'skipped';
}

export async function runAppointmentRemindersCron(): Promise<{
  sent: number;
  skipped: number;
  queued: number;
}> {
  let sent = 0;
  let skipped = 0;
  let queued = 0;
  const now = Date.now();

  const scheduled = await database
    .select()
    .from(appointments)
    .where(eq(appointments.status, 'scheduled'));

  if (scheduled.length === 0) {
    logger.info({ event: 'appointment_reminders_cron_done', sent, skipped, queued });
    return { sent, skipped, queued };
  }

  const integrations = await database.select().from(userWhatsappIntegrations);

  // Precarga en batch: pacientes y recordatorios ya enviados (evita N+1 dentro del loop).
  const patientIds = [...new Set(scheduled.map((a) => a.patientId).filter((id): id is string => !!id))];
  const patientsById = new Map<string, typeof patients.$inferSelect>();
  if (patientIds.length > 0) {
    const pRows = await database.select().from(patients).where(inArray(patients.id, patientIds));
    for (const p of pRows) patientsById.set(p.id, p);
  }

  const apptIds = scheduled.map((a) => a.id);
  const sentKeys = new Set<string>();
  for (let i = 0; i < apptIds.length; i += 100) {
    const chunk = apptIds.slice(i, i + 100);
    const rows = await database
      .select({ appointmentId: appointmentReminderSent.appointmentId, reminderKind: appointmentReminderSent.reminderKind })
      .from(appointmentReminderSent)
      .where(inArray(appointmentReminderSent.appointmentId, chunk));
    for (const r of rows) sentKeys.add(`${r.appointmentId}:${r.reminderKind}`);
  }

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
      const p = patientsById.get(appt.patientId);
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
      if (sentKeys.has(`${appt.id}:${kind}`)) continue;

      const job: WhatsAppReminderJob = {
        type: 'whatsapp_reminder',
        appointmentId: appt.id,
        reminderKind: kind,
        creatorUserId: creatorId,
        patientName,
        phoneE164: phone,
        sessionDate: appt.sessionDate,
        sessionTime: appt.sessionTime,
        ...(appt.cost ? { cost: appt.cost } : {}),
      };

      const outcome = await dispatchReminder(job);
      if (outcome === 'queued') queued++;
      else if (outcome === 'sent') sent++;
      else skipped++;
    }
  }

  logger.info({ event: 'appointment_reminders_cron_done', sent, skipped, queued });
  return { sent, skipped, queued };
}
