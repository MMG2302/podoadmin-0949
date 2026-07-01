import { eq } from 'drizzle-orm';
import { database } from '../database';
import {
  appointments as appointmentsTable,
  patients as patientsTable,
  clinics as clinicsTable,
  professionalInfo as professionalInfoTable,
  createdUsers,
} from '../database/schema';
import { getAssignedPodiatristUserIds, isClinicAdminWithoutClinic } from './tenant-isolation';
import { buildIcsCalendar, type IcsAppointmentEvent } from './ics-calendar';

type RequestUser = {
  userId: string;
  role: string;
  clinicId?: string | null;
};

function parseNotesDuration(notes: string | null): { duration: number; text: string } {
  if (!notes) return { duration: 30, text: '' };
  try {
    const p = JSON.parse(notes) as { duration?: number; text?: string };
    if (typeof p === 'object' && p) {
      return { duration: typeof p.duration === 'number' ? p.duration : 30, text: p.text ?? '' };
    }
  } catch {
    /* */
  }
  return { duration: 30, text: notes };
}

export async function assertAppointmentsExportAccess(
  user: RequestUser,
  podiatristId?: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (isClinicAdminWithoutClinic(user)) {
    return { ok: false, status: 403, message: 'Cuenta de administrador de clínica sin clínica asignada' };
  }
  if (user.role === 'podiatrist' && podiatristId && podiatristId !== user.userId) {
    return { ok: false, status: 403, message: 'No puedes exportar la agenda de otro podólogo' };
  }
  if (user.role === 'receptionist' && podiatristId) {
    const assigned = await getAssignedPodiatristUserIds(user.userId);
    if (!assigned.includes(podiatristId)) {
      return { ok: false, status: 403, message: 'No tienes acceso a ese podólogo' };
    }
  }
  if (user.role === 'receptionist' && !podiatristId) {
    return { ok: false, status: 400, message: 'Selecciona un podólogo para exportar la agenda' };
  }
  return { ok: true };
}

export async function listAppointmentsForExport(
  user: RequestUser,
  date: string,
  podiatristId?: string
) {
  let rows = await database.select().from(appointmentsTable);

  if (user.role === 'podiatrist') {
    rows = rows.filter((r) => r.createdBy === user.userId);
  } else if (user.role === 'clinic_admin') {
    rows = rows.filter((r) => r.clinicId === user.clinicId);
  } else if (user.role === 'receptionist') {
    const assignedIds = await getAssignedPodiatristUserIds(user.userId);
    rows = assignedIds.length === 0 ? [] : rows.filter((r) => assignedIds.includes(r.createdBy));
  } else if (user.role === 'super_admin' || user.role === 'admin') {
    /* sin filtro extra */
  } else {
    rows = [];
  }

  rows = rows.filter((r) => r.sessionDate === date);
  rows = rows.filter((r) => r.status !== 'cancelled');
  rows = rows.filter((r) => r.status === 'scheduled' || r.status === 'confirmed');

  if (podiatristId) {
    rows = rows.filter((r) => r.createdBy === podiatristId);
  }

  rows.sort((a, b) => a.sessionTime.localeCompare(b.sessionTime));

  const patientIds = [...new Set(rows.map((r) => r.patientId).filter(Boolean))] as string[];
  const patientMap = new Map<string, { name: string; phone: string }>();
  if (patientIds.length > 0) {
    const patientRows = await database
      .select({
        id: patientsTable.id,
        firstName: patientsTable.firstName,
        lastName: patientsTable.lastName,
        phone: patientsTable.phone,
      })
      .from(patientsTable);
    for (const p of patientRows) {
      if (patientIds.includes(p.id)) {
        patientMap.set(p.id, {
          name: `${p.firstName} ${p.lastName}`.trim(),
          phone: p.phone ?? '',
        });
      }
    }
  }

  const podiatristIds = [...new Set(rows.map((r) => r.createdBy))];
  const podiatristNameMap = new Map<string, string>();
  if (podiatristIds.length > 0) {
    const users = await database
      .select({ userId: createdUsers.userId, name: createdUsers.name })
      .from(createdUsers);
    for (const u of users) {
      if (podiatristIds.includes(u.userId)) podiatristNameMap.set(u.userId, u.name);
    }
  }

  return rows.map((row) => {
    const { duration, text: notesText } = parseNotesDuration(row.notes);
    const patient = row.patientId ? patientMap.get(row.patientId) : null;
    const patientName = patient?.name || row.pendingPatientName || 'Paciente';
    const patientPhone = patient?.phone || row.pendingPatientPhone || '';
    return {
      id: row.id,
      date: row.sessionDate,
      time: row.sessionTime,
      duration,
      notes: notesText,
      patientName,
      patientPhone,
      podiatristId: row.createdBy,
      podiatristName: podiatristNameMap.get(row.createdBy) ?? 'Podólogo',
      clinicId: row.clinicId,
      status: row.status,
    };
  });
}

export async function buildAppointmentsIcsForUser(
  user: RequestUser,
  date: string,
  podiatristId?: string,
  calendarLabel?: string
): Promise<{ ics: string; count: number; calendarName: string }> {
  const items = await listAppointmentsForExport(user, date, podiatristId);

  let clinicName: string | undefined;
  const clinicId = user.clinicId ?? items[0]?.clinicId;
  if (clinicId) {
    const clinicRows = await database
      .select({ clinicName: clinicsTable.clinicName })
      .from(clinicsTable)
      .where(eq(clinicsTable.clinicId, clinicId))
      .limit(1);
    clinicName = clinicRows[0]?.clinicName ?? undefined;
  }

  const events: IcsAppointmentEvent[] = items.map((item) => {
    const descParts = [
      item.notes ? `Notas: ${item.notes}` : null,
      item.patientPhone ? `Tel: ${item.patientPhone}` : null,
      `Podólogo: ${item.podiatristName}`,
    ].filter(Boolean);
    return {
      uid: item.id,
      date: item.date,
      time: item.time,
      durationMinutes: item.duration,
      summary: `Cita — ${item.patientName}`,
      description: descParts.join('\n'),
      location: clinicName,
    };
  });

  const podiatristLabel =
    podiatristId && items[0]?.podiatristName
      ? items[0].podiatristName
      : calendarLabel ?? 'PodoAdmin';
  const calendarName =
    calendarLabel ?? `Agenda ${date} — ${podiatristLabel}`;

  return {
    ics: buildIcsCalendar(events, calendarName),
    count: events.length,
    calendarName,
  };
}

export async function getClinicContactForAgendaExport(
  clinicId: string | null | undefined
): Promise<{ clinicPhone: string | null; clinicCountryCode: string | null }> {
  if (!clinicId) {
    return { clinicPhone: null, clinicCountryCode: null };
  }
  const clinicRows = await database
    .select({ phone: clinicsTable.phone, countryCode: clinicsTable.countryCode })
    .from(clinicsTable)
    .where(eq(clinicsTable.clinicId, clinicId))
    .limit(1);
  const row = clinicRows[0];
  return {
    clinicPhone: row?.phone?.trim() || null,
    clinicCountryCode: row?.countryCode?.trim() || null,
  };
}

export async function resolveAgendaClinicId(
  user: RequestUser,
  podiatristUserId?: string
): Promise<string | null> {
  if (user.clinicId) return user.clinicId;
  if (!podiatristUserId) return null;
  const userRows = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, podiatristUserId))
    .limit(1);
  return userRows[0]?.clinicId ?? null;
}

/** Teléfono móvil del podólogo (professional_info) para WhatsApp directo recepción → podólogo. */
export async function getPodiatristDirectPhoneForExport(podiatristUserId: string): Promise<{
  phone: string | null;
  countryCode: string | null;
}> {
  const prof = await database
    .select({
      phone: professionalInfoTable.phone,
      countryCode: professionalInfoTable.countryCode,
    })
    .from(professionalInfoTable)
    .where(eq(professionalInfoTable.userId, podiatristUserId))
    .limit(1);
  const phone = prof[0]?.phone?.trim();
  if (!phone) return { phone: null, countryCode: null };
  return {
    phone,
    countryCode: prof[0]?.countryCode?.trim() || null,
  };
}
