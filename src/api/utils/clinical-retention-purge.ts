import { eq, isNull, or } from 'drizzle-orm';
import { database } from '../database';
import {
  patients,
  clinicalSessions,
  appointments,
  auditLog,
  notifications,
} from '../database/schema';
import {
  calculateClinicalRetainUntil,
  calculateAuditRetainUntil,
  calculateOperationalRetainUntil,
  RETENTION_POLICY,
} from './retention-policy';
import { hasActiveLegalHold } from './legal-hold';
import { logAuditEvent } from './audit-log';

export type ClinicalPurgeStats = {
  patientsPurged: number;
  sessionsPurged: number;
  appointmentsPurged: number;
  auditLogsPurged: number;
  notificationsPurged: number;
  skippedLegalHold: number;
  backfilledPatients: number;
};

export async function backfillClinicalRetentionMetadata(): Promise<number> {
  const nowIso = new Date().toISOString();
  let updated = 0;

  const patientRows = await database
    .select()
    .from(patients)
    .where(or(isNull(patients.retainUntil), isNull(patients.lastClinicalActAt)));

  for (const p of patientRows) {
    const sessions = await database
      .select()
      .from(clinicalSessions)
      .where(eq(clinicalSessions.patientId, p.id));

    let lastAct = Date.parse(p.updatedAt || p.createdAt) || Date.now();
    for (const s of sessions) {
      const sessionMs = Date.parse(s.sessionDate || s.updatedAt || s.createdAt);
      if (Number.isFinite(sessionMs) && sessionMs > lastAct) lastAct = sessionMs;
    }

    const retainUntil = calculateClinicalRetainUntil(lastAct);
    await database
      .update(patients)
      .set({
        lastClinicalActAt: lastAct,
        retainUntil,
        updatedAt: nowIso,
      })
      .where(eq(patients.id, p.id));

    for (const s of sessions) {
      const actMs = Date.parse(s.sessionDate || s.updatedAt || s.createdAt) || lastAct;
      await database
        .update(clinicalSessions)
        .set({
          lastClinicalActAt: actMs,
          retainUntil: calculateClinicalRetainUntil(actMs),
          updatedAt: nowIso,
        })
        .where(eq(clinicalSessions.id, s.id));
    }
    updated++;
  }

  return updated;
}

export async function runClinicalRetentionPurge(): Promise<ClinicalPurgeStats> {
  const now = Date.now();
  const stats: ClinicalPurgeStats = {
    patientsPurged: 0,
    sessionsPurged: 0,
    appointmentsPurged: 0,
    auditLogsPurged: 0,
    notificationsPurged: 0,
    skippedLegalHold: 0,
    backfilledPatients: 0,
  };

  stats.backfilledPatients = await backfillClinicalRetentionMetadata();

  const allPatients = await database.select().from(patients);
  for (const p of allPatients) {
    if (p.legalHold || (await hasActiveLegalHold('patient', p.id))) {
      stats.skippedLegalHold++;
      continue;
    }
    if (!p.retainUntil || p.retainUntil > now) continue;

    const sessionRows = await database
      .select({ id: clinicalSessions.id })
      .from(clinicalSessions)
      .where(eq(clinicalSessions.patientId, p.id));
    const apptRows = await database
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.patientId, p.id));

    if (sessionRows.length > 0) {
      await database.delete(clinicalSessions).where(eq(clinicalSessions.patientId, p.id));
      stats.sessionsPurged += sessionRows.length;
    }
    if (apptRows.length > 0) {
      await database.delete(appointments).where(eq(appointments.patientId, p.id));
      stats.appointmentsPurged += apptRows.length;
    }
    await database.delete(patients).where(eq(patients.id, p.id));
    stats.patientsPurged++;
  }

  const auditRows = await database.select().from(auditLog);
  for (const row of auditRows) {
    if (row.legalHold) continue;
    const createdMs = Date.parse(row.createdAt);
    if (!Number.isFinite(createdMs)) continue;
    const retainUntil = row.retainUntil ?? calculateAuditRetainUntil(createdMs);
    if (retainUntil > now) continue;
    await database.delete(auditLog).where(eq(auditLog.id, row.id));
    stats.auditLogsPurged++;
  }

  const notifRows = await database.select().from(notifications);
  for (const row of notifRows) {
    if (row.legalHold) continue;
    const createdMs = Date.parse(row.createdAt);
    if (!Number.isFinite(createdMs)) continue;
    const retainUntil =
      row.retainUntil ??
      calculateOperationalRetainUntil(createdMs, RETENTION_POLICY.notificationsDays);
    if (retainUntil > now) continue;
    await database.delete(notifications).where(eq(notifications.id, row.id));
    stats.notificationsPurged++;
  }

  await logAuditEvent({
    userId: 'system',
    action: 'COMPLIANCE_RETENTION_CRON_EXECUTED',
    resourceType: 'compliance',
    resourceId: 'clinical-retention-purge',
    details: stats as unknown as Record<string, unknown>,
  });

  return stats;
}

export async function isPatientProtectedFromDeletion(patientId: string): Promise<string | null> {
  const rows = await database.select().from(patients).where(eq(patients.id, patientId)).limit(1);
  const p = rows[0];
  if (!p) return null;
  if (p.legalHold || (await hasActiveLegalHold('patient', p.id))) {
    return 'legal_hold_active';
  }
  if (p.retainUntil && p.retainUntil > Date.now()) {
    return 'retention_period_active';
  }
  return null;
}
