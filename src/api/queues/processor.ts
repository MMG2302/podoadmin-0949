import { eq, and } from 'drizzle-orm';
import { database } from '../database';
import {
  appointmentReminderSent,
  userWhatsappIntegrations,
} from '../database/schema';
import { decryptSecret } from '../utils/field-encryption';
import { sendWhatsAppTemplateMessage } from '../utils/whatsapp-meta-api';
import { logger } from '../utils/logger';
import type { WhatsAppReminderJob } from './notification-messages';

export async function processWhatsAppReminderJob(
  job: WhatsAppReminderJob
): Promise<{ ok: boolean; skipped?: boolean }> {
  const already = await database
    .select()
    .from(appointmentReminderSent)
    .where(
      and(
        eq(appointmentReminderSent.appointmentId, job.appointmentId),
        eq(appointmentReminderSent.reminderKind, job.reminderKind)
      )
    )
    .limit(1);
  if (already[0]) {
    return { ok: true, skipped: true };
  }

  const waRows = await database
    .select()
    .from(userWhatsappIntegrations)
    .where(eq(userWhatsappIntegrations.userId, job.creatorUserId))
    .limit(1);
  const wa = waRows[0];
  if (!wa?.enabled || !wa.remindersEnabled) {
    return { ok: false, skipped: true };
  }

  try {
    const token = await decryptSecret(wa.accessTokenEnc);
    const bodyParams = [job.patientName, job.sessionDate, job.sessionTime];
    if (job.cost) bodyParams.push(job.cost);

    const result = await sendWhatsAppTemplateMessage({
      phoneNumberId: wa.phoneNumberId,
      accessToken: token,
      toPhoneE164: job.phoneE164,
      templateName: wa.templateName || 'appointment_reminder',
      templateLanguage: wa.templateLanguage,
      bodyParams,
    });
    if (!result.ok) {
      return { ok: false };
    }
    await database.insert(appointmentReminderSent).values({
      id: crypto.randomUUID(),
      appointmentId: job.appointmentId,
      reminderKind: job.reminderKind,
      sentAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    logger.error({
      event: 'queue_reminder_send_failed',
      appointmentId: job.appointmentId,
      kind: job.reminderKind,
      message: String(err),
    });
    return { ok: false };
  }
}

export async function processNotificationJob(
  job: import('./notification-messages').NotificationJob
): Promise<void> {
  if (job.type === 'whatsapp_reminder') {
    await processWhatsAppReminderJob(job);
    return;
  }
}
