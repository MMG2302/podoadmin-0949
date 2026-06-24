/** Mensajes encolados para procesamiento async (email, WhatsApp, etc.). */

export type NotificationJobType = 'whatsapp_reminder';

export interface WhatsAppReminderJob {
  type: 'whatsapp_reminder';
  appointmentId: string;
  reminderKind: string;
  creatorUserId: string;
  patientName: string;
  phoneE164: string;
  sessionDate: string;
  sessionTime: string;
}

export type NotificationJob = WhatsAppReminderJob;

export const NOTIFICATION_QUEUE_NAME = 'podoadmin-notifications';
