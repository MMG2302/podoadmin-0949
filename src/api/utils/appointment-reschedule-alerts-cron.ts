import { eq } from 'drizzle-orm';
import { database } from '../database';
import { appointments } from '../database/schema';
import { logger } from './logger';
import { notifyAppointmentCancelled } from './notifications-service';
import {
  getClinicBusinessWindow,
  isWithinBusinessHours,
  type ClinicBusinessWindow,
} from './agenda-settings';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// La alerta se vuelve MÁS insistente cuanto más tiempo lleva el paciente sin reagendar
// (para que no se olvide). Escala inversa por antigüedad desde que se canceló:
//   día 1 (0-24h): una vez al día · día 2 (24-48h): cada hora · día 3+ (48h-7d): cada 10 min.
// A los 7 días se deja de alertar (se marca 'expired') y queda para campañas de reactivación.
const EXPIRE_MS = 7 * DAY_MS;
// Se envía solo en horario laboral, con 1h extra tras el cierre (tiempo de cortes de caja).
const AFTER_HOURS_BUFFER = 1;

function requiredIntervalMs(ageMs: number): number {
  if (ageMs < DAY_MS) return DAY_MS; // día 1: una vez al día
  if (ageMs < 2 * DAY_MS) return HOUR_MS; // día 2: cada hora
  return 10 * 60 * 1000; // día 3+: cada 10 min
}

/**
 * Reenvía la alerta interna de "cita cancelada sin reagendar" con urgencia creciente.
 * Se apaga sola al crear una cita nueva para el paciente (POST /appointments), al marcarla
 * 'handled' (gestión manual), o al expirar a los 7 días.
 */
export async function runRescheduleAlertsCron(): Promise<{
  notified: number;
  skipped: number;
  expired: number;
}> {
  let notified = 0;
  let skipped = 0;
  let expired = 0;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const windowCache = new Map<string, ClinicBusinessWindow>();

  const pending = await database.select().from(appointments).where(eq(appointments.rescheduleStatus, 'pending'));

  for (const appt of pending) {
    const requestedMs = appt.rescheduleRequestedAt ? Date.parse(appt.rescheduleRequestedAt) : now;
    const ageMs = now - (Number.isFinite(requestedMs) ? requestedMs : now);

    // Expira a los 7 días: deja de alertar pero queda registrado para reactivación.
    if (ageMs >= EXPIRE_MS) {
      await database.update(appointments).set({ rescheduleStatus: 'expired' }).where(eq(appointments.id, appt.id));
      expired++;
      continue;
    }

    // Solo dentro del horario laboral de la clínica (+1h de gracia).
    const clinicKey = appt.clinicId ?? '__none__';
    let window = windowCache.get(clinicKey);
    if (!window) {
      window = await getClinicBusinessWindow(appt.clinicId ?? null);
      windowCache.set(clinicKey, window);
    }
    if (!isWithinBusinessHours(window, AFTER_HOURS_BUFFER)) {
      skipped++;
      continue;
    }

    const lastAlertMs = appt.lastRescheduleAlertAt ? Date.parse(appt.lastRescheduleAlertAt) : 0;
    const elapsedMs = now - (Number.isFinite(lastAlertMs) ? lastAlertMs : 0);
    if (elapsedMs < requiredIntervalMs(ageMs)) {
      skipped++;
      continue;
    }

    try {
      await notifyAppointmentCancelled({
        appointmentId: appt.id,
        podiatristUserId: appt.createdBy,
        clinicId: appt.clinicId ?? null,
        actorUserId: appt.createdBy,
        actorName: 'Recordatorio automático',
        patientId: appt.patientId,
        patientName: appt.pendingPatientName,
        date: appt.sessionDate,
        time: appt.sessionTime,
        isReminder: true,
      });
      await database
        .update(appointments)
        .set({ lastRescheduleAlertAt: nowIso })
        .where(eq(appointments.id, appt.id));
      notified++;
    } catch (err) {
      logger.error({ event: 'reschedule_alert_notify_failed', appointmentId: appt.id, message: String(err) });
      skipped++;
    }
  }

  logger.info({ event: 'reschedule_alerts_cron_done', notified, skipped, expired });
  return { notified, skipped, expired };
}
