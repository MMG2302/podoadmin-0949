import { database } from '../database';
import {
  patients as patientsTable,
  clinicalSessions as sessionsTable,
  createdUsers,
  clinics as clinicsTable,
  professionalInfo as professionalInfoTable,
  professionalLicenses as professionalLicensesTable,
  professionalLogos as professionalLogosTable,
} from '../database/schema';
import { eq, or } from 'drizzle-orm';
import { getAssignedPodiatristUserIds } from './tenant-isolation';
import { formatPatientExport, mapDbPatient, mapDbSession } from './clinical-maps';
import { resolveClinicalLayoutForUser } from './clinical-layout';
import { resolveLogoForClient } from './r2-media';
import type { ClinicalLayoutConfig } from '../../web/types/clinical-layout';
import type { ClinicalSession, Patient } from '../../web/types/clinical';

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

export type PodiatristClinicalHistoriesBundle = {
  exportedAt: string;
  podiatristName: string;
  podiatristLicense: string | null;
  clinic: {
    clinicName?: string;
    legalName?: string;
    rfc?: string;
    clues?: string;
    cofeprisRegistration?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    licenseNumber?: string;
  } | null;
  clinicLogo: string | null;
  professional: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    licenseNumber?: string;
    professionalLicense?: string;
    license?: string;
  } | null;
  layout: ClinicalLayoutConfig;
  patients: Patient[];
  sessions: ClinicalSession[];
  statistics: {
    patientCount: number;
    sessionCount: number;
  };
};

/** Datos para generar HTML/PDF de todos los historiales del podólogo (solo su createdBy). */
export async function buildPodiatristClinicalHistoriesBundle(
  userId: string
): Promise<PodiatristClinicalHistoriesBundle | null> {
  const user = await getUserRowByAnyId(userId);
  if (!user || user.role !== 'podiatrist') return null;

  const patientRows = await database
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.createdBy, user.userId));
  const sessionRows = await database
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.createdBy, user.userId));

  const patients = patientRows.map(mapDbPatient).sort((a, b) => a.folio.localeCompare(b.folio));
  const sessions = sessionRows.map(mapDbSession);

  const layoutResolved = await resolveClinicalLayoutForUser({
    role: user.role,
    userId: user.userId,
    clinicId: user.clinicId,
  });

  let clinic: PodiatristClinicalHistoriesBundle['clinic'] = null;
  let clinicLogo: string | null = null;
  if (user.clinicId) {
    const clinicRows = await database
      .select()
      .from(clinicsTable)
      .where(eq(clinicsTable.clinicId, user.clinicId))
      .limit(1);
    const row = clinicRows[0];
    if (row) {
      clinic = {
        clinicName: row.clinicName ?? undefined,
        legalName: row.legalName ?? undefined,
        rfc: row.rfc ?? undefined,
        clues: row.clues ?? undefined,
        cofeprisRegistration: row.cofeprisRegistration ?? undefined,
        phone: row.phone ?? undefined,
        email: row.email ?? undefined,
        address: row.address ?? undefined,
        city: row.city ?? undefined,
        postalCode: row.postalCode ?? undefined,
        licenseNumber: row.licenseNumber ?? undefined,
      };
      clinicLogo = resolveLogoForClient(row.logo ?? null, 'clinic', user.clinicId, row.logoUpdatedAt);
    }
  }

  let professional: PodiatristClinicalHistoriesBundle['professional'] = null;
  let podiatristLicense: string | null = null;
  const profRows = await database
    .select()
    .from(professionalInfoTable)
    .where(eq(professionalInfoTable.userId, user.userId))
    .limit(1);
  if (profRows[0]) {
    const p = profRows[0];
    professional = {
      name: p.name ?? undefined,
      phone: p.phone ?? undefined,
      email: p.email ?? undefined,
      address: p.address ?? undefined,
      city: p.city ?? undefined,
      postalCode: p.postalCode ?? undefined,
      licenseNumber: p.licenseNumber ?? undefined,
      professionalLicense: p.professionalLicense ?? undefined,
    };
  }
  const licenseRows = await database
    .select({ license: professionalLicensesTable.license })
    .from(professionalLicensesTable)
    .where(eq(professionalLicensesTable.userId, user.userId))
    .limit(1);
  podiatristLicense =
    licenseRows[0]?.license ||
    professional?.professionalLicense ||
    professional?.licenseNumber ||
    null;

  if (!clinicLogo) {
    const logoRows = await database
      .select({ logo: professionalLogosTable.logo, updatedAt: professionalLogosTable.updatedAt })
      .from(professionalLogosTable)
      .where(eq(professionalLogosTable.userId, user.userId))
      .limit(1);
    clinicLogo = resolveLogoForClient(
      logoRows[0]?.logo?.trim() ? logoRows[0].logo : null,
      'professional',
      user.userId,
      logoRows[0]?.updatedAt
    );
  }

  return {
    exportedAt: new Date().toISOString(),
    podiatristName: user.name,
    podiatristLicense,
    clinic,
    clinicLogo,
    professional,
    layout: layoutResolved.layout,
    patients,
    sessions,
    statistics: {
      patientCount: patients.length,
      sessionCount: sessions.length,
    },
  };
}
