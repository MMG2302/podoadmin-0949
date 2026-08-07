import { eq } from 'drizzle-orm';
import { database } from '../database';
import { patients, clinicalSessions } from '../database/schema';
import { calculateClinicalRetainUntil } from './retention-policy';
import { getDeclaredCountryForRetention } from './tenant-country';

/**
 * País del paciente para efectos de conservación. Sin país declarado devuelve null y
 * el expediente queda fuera de la purga automática.
 */
async function retentionCountryForPatient(patientId: string): Promise<string | null> {
  const row = await database
    .select({ clinicId: patients.clinicId, createdBy: patients.createdBy })
    .from(patients)
    .where(eq(patients.id, patientId))
    .limit(1);
  if (!row[0]) return null;
  return getDeclaredCountryForRetention({
    clinicId: row[0].clinicId,
    createdByUserId: row[0].createdBy,
  });
}

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
  const country = await retentionCountryForPatient(patientId);
  const retainUntil = calculateClinicalRetainUntil(actAtMs, country);
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
  updatedAtIso: string,
  countryCode?: string | null
): Promise<void> {
  const retainUntil = calculateClinicalRetainUntil(actAtMs, countryCode);
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
  // Se resuelve una sola vez y se reutiliza para paciente y sesión.
  const country = await retentionCountryForPatient(params.patientId);
  await touchSessionClinicalRetention(params.sessionId, actAtMs, params.updatedAtIso, country);
  await touchPatientClinicalRetention(params.patientId, actAtMs);
}
