import { database } from '../database';
import {
  patients as patientsTable,
  clinicalSessions as sessionsTable,
  createdUsers,
} from '../database/schema';
import { eq, or } from 'drizzle-orm';
import { getAssignedPodiatristUserIds } from './tenant-isolation';
import { formatPatientExport, mapDbPatient, mapDbSession } from './clinical-maps';

type Requester = {
  userId: string;
  role: string;
  clinicId?: string | null;
};

export async function filterPatientsForUser(user: Requester) {
  let rows = await database.select().from(patientsTable);

  if (user.role === 'podiatrist') {
    rows = rows.filter((p) => p.createdBy === user.userId);
  } else if (user.role === 'receptionist') {
    const assignedIds = await getAssignedPodiatristUserIds(user.userId);
    rows = assignedIds.length === 0 ? [] : rows.filter((p) => assignedIds.includes(p.createdBy));
  } else if (user.role === 'clinic_admin') {
    rows = user.clinicId ? rows.filter((p) => p.clinicId === user.clinicId) : [];
  }

  return rows;
}

export async function filterSessionsForUser(user: Requester) {
  let rows = await database.select().from(sessionsTable);

  if (user.role === 'podiatrist') {
    rows = rows.filter((s) => s.createdBy === user.userId);
  } else if (user.role === 'clinic_admin') {
    rows = user.clinicId ? rows.filter((s) => s.clinicId === user.clinicId) : [];
  } else if (user.role === 'receptionist') {
    const assignedIds = await getAssignedPodiatristUserIds(user.userId);
    rows = assignedIds.length === 0 ? [] : rows.filter((s) => assignedIds.includes(s.createdBy));
  }

  return rows;
}

export async function buildClinicalStatsMap(user: Requester): Promise<Record<string, { patientCount: number; sessionCount: number }>> {
  const patients = await filterPatientsForUser(user);
  const sessions = await filterSessionsForUser(user);
  const stats: Record<string, { patientCount: number; sessionCount: number }> = {};

  for (const p of patients) {
    if (!stats[p.createdBy]) stats[p.createdBy] = { patientCount: 0, sessionCount: 0 };
    stats[p.createdBy].patientCount += 1;
  }
  for (const s of sessions) {
    if (!stats[s.createdBy]) stats[s.createdBy] = { patientCount: 0, sessionCount: 0 };
    stats[s.createdBy].sessionCount += 1;
  }

  return stats;
}

export async function getUserRowByAnyId(userIdOrId: string) {
  const rows = await database
    .select()
    .from(createdUsers)
    .where(or(eq(createdUsers.id, userIdOrId), eq(createdUsers.userId, userIdOrId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function transferClinicalHistory(
  sourceUserId: string,
  targetUserId: string
): Promise<{ patientsTransferred: number; sessionsTransferred: number }> {
  const source = await getUserRowByAnyId(sourceUserId);
  const target = await getUserRowByAnyId(targetUserId);
  if (!source || !target) {
    throw new Error('USER_NOT_FOUND');
  }
  if (source.userId === target.userId) {
    throw new Error('SAME_USER');
  }

  const now = new Date().toISOString();
  const sourcePatients = await database
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.createdBy, source.userId));

  const sourceSessions = await database
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.createdBy, source.userId));

  for (const p of sourcePatients) {
    await database
      .update(patientsTable)
      .set({ createdBy: target.userId, updatedAt: now })
      .where(eq(patientsTable.id, p.id));
  }

  for (const s of sourceSessions) {
    await database
      .update(sessionsTable)
      .set({ createdBy: target.userId, updatedAt: now })
      .where(eq(sessionsTable.id, s.id));
  }

  return {
    patientsTransferred: sourcePatients.length,
    sessionsTransferred: sourceSessions.length,
  };
}

export async function getClinicalProfileForUserId(targetUserId: string) {
  const target = await getUserRowByAnyId(targetUserId);
  if (!target) return null;

  const patientRows = await database
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.createdBy, target.userId));

  const sessionRows = await database
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.createdBy, target.userId));

  const patients = patientRows.map(mapDbPatient);
  const sessions = sessionRows.map(mapDbSession);

  return {
    patientCount: patients.length,
    sessionCount: sessions.length,
    patients: patients.slice(0, 50),
    sessions,
  };
}

export async function buildPatientClinicalExport(patientId: string, exportedByName?: string) {
  const patientRows = await database
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, patientId))
    .limit(1);
  const row = patientRows[0];
  if (!row) return null;

  const patient = mapDbPatient(row);
  const sessionRows = await database
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.patientId, patientId));
  const sessions = sessionRows.map(mapDbSession);

  return {
    exportedAt: new Date().toISOString(),
    exportedBy: exportedByName ?? null,
    patient: formatPatientExport(patient, sessions),
    retention: {
      lastClinicalActAt: row.lastClinicalActAt ?? null,
      retainUntil: row.retainUntil ?? null,
      legalHold: row.legalHold ?? false,
    },
    statistics: {
      totalSessions: sessions.length,
    },
  };
}

export async function buildUserClinicalExport(targetUserId: string, exportedByName?: string) {
  const profile = await getClinicalProfileForUserId(targetUserId);
  if (!profile) return null;

  const target = await getUserRowByAnyId(targetUserId);
  if (!target) return null;

  const allPatientRows = await database
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.createdBy, target.userId));

  const patients = allPatientRows.map(mapDbPatient);
  const patientsExport = patients.map((p) =>
    formatPatientExport(
      p,
      profile.sessions.filter((s) => s.patientId === p.id)
    )
  );

  return {
    exportedAt: new Date().toISOString(),
    exportedBy: exportedByName ?? null,
    user: {
      id: target.userId,
      name: target.name,
      email: target.email,
      role: target.role,
      clinicId: target.clinicId ?? undefined,
    },
    patients: patientsExport,
    statistics: {
      totalPatients: profile.patientCount,
      totalSessions: profile.sessionCount,
    },
  };
}
