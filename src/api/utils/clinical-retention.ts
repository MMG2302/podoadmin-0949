import { eq } from 'drizzle-orm';
import { database } from '../database';
import { patients, clinicalSessions } from '../database/schema';
import { calculateClinicalRetainUntil } from './retention-policy';

/** Timestamp del acto clínico (preferir fecha de sesión o completado). */
export function resolveClinicalActMs(sessionDate: string, completedAt?: string | null): number {
  if (completedAt) {
    const completed = Date.parse(completedAt);
    if (Number.isFinite(completed)) return completed;
  }
  const sessionMs = Date.parse(sessionDate);
  return Number.isFinite(sessionMs) ? sessionMs : Date.now();
}

/** Actualiza plazos de retención del paciente tras un acto clínico. */
export async function touchPatientClinicalRetention(patientId: string, actAtMs: number): Promise<void> {
  const retainUntil = calculateClinicalRetainUntil(actAtMs);
  await database
    .update(patients)
    .set({
      lastClinicalActAt: actAtMs,
      retainUntil,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(patients.id, patientId));
}

/** Actualiza plazos de retención de la sesión clínica. */
export async function touchSessionClinicalRetention(
  sessionId: string,
  actAtMs: number,
  updatedAtIso: string
): Promise<void> {
  const retainUntil = calculateClinicalRetainUntil(actAtMs);
  await database
    .update(clinicalSessions)
    .set({
      lastClinicalActAt: actAtMs,
      retainUntil,
      updatedAt: updatedAtIso,
    })
    .where(eq(clinicalSessions.id, sessionId));
}

/** Sincroniza paciente y sesión tras crear o actualizar una sesión clínica. */
export async function syncClinicalRetentionForSession(params: {
  sessionId: string;
  patientId: string;
  sessionDate: string;
  completedAt?: string | null;
  updatedAtIso: string;
}): Promise<void> {
  const actAtMs = resolveClinicalActMs(params.sessionDate, params.completedAt);
  await touchSessionClinicalRetention(params.sessionId, actAtMs, params.updatedAtIso);
  await touchPatientClinicalRetention(params.patientId, actAtMs);
}
