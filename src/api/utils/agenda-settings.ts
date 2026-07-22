import { eq } from 'drizzle-orm';
import { database } from '../database';
import { clinics, createdUsers, professionalInfo } from '../database/schema';
import type { JWTPayload } from './jwt';
import { getAssignedPodiatristUserIds } from './tenant-isolation';

/** workdayEndHour es exclusivo (ventana [start, end)). */
export type AgendaSettings = {
  workdayStartHour: number;
  workdayEndHour: number;
  allowOvertime: boolean;
  overtimeStartHour: number;
  overtimeEndHour: number;
  // Minutos entre reenvíos de la alerta interna de "cita cancelada sin reagendar".
  // Siempre clínica-wide (solo clinic_admin la edita); ver saveAgendaSettings/PUT agenda-settings.
  rescheduleAlertIntervalMinutes: number;
  // Zona horaria IANA de la clínica: los crons corren en UTC en el Worker, así que la usamos
  // para saber la hora local (recordatorios y ventana de horario laboral de las alertas).
  timezone: string;
};

export const DEFAULT_AGENDA_SETTINGS: AgendaSettings = {
  workdayStartHour: 7,
  workdayEndHour: 21,
  allowOvertime: false,
  overtimeStartHour: 21,
  overtimeEndHour: 23,
  rescheduleAlertIntervalMinutes: 10,
  timezone: 'America/Mexico_City',
};

/** Valida una zona horaria IANA; si es inválida, cae al default. */
export function normalizeTimezone(tz: unknown): string {
  if (typeof tz !== 'string' || !tz.trim()) return DEFAULT_AGENDA_SETTINGS.timezone;
  try {
    // Lanza RangeError si la zona no existe.
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return DEFAULT_AGENDA_SETTINGS.timezone;
  }
}

/** Hora local (0-23) en la zona dada, según el reloj UTC del Worker. */
export function localHourInTimezone(timezone: string, at: Date = new Date()): number {
  try {
    const h = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(at);
    const n = Number(h);
    return Number.isFinite(n) ? n % 24 : new Date(at).getUTCHours();
  } catch {
    return new Date(at).getUTCHours();
  }
}

function clampHour(n: unknown, fallback: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(23, Math.max(0, Math.round(v)));
}

export function parseAgendaSettings(json: string | null | undefined): AgendaSettings {
  if (!json?.trim()) return { ...DEFAULT_AGENDA_SETTINGS };
  try {
    const parsed = JSON.parse(json) as Partial<AgendaSettings>;
    const workdayStartHour = clampHour(parsed.workdayStartHour, DEFAULT_AGENDA_SETTINGS.workdayStartHour);
    let workdayEndHour = clampHour(parsed.workdayEndHour, DEFAULT_AGENDA_SETTINGS.workdayEndHour);
    if (workdayEndHour <= workdayStartHour) {
      workdayEndHour = Math.min(23, workdayStartHour + 1);
    }
    const allowOvertime = Boolean(parsed.allowOvertime);
    const overtimeStartHour = clampHour(
      parsed.overtimeStartHour,
      workdayEndHour
    );
    let overtimeEndHour = clampHour(
      parsed.overtimeEndHour,
      Math.min(23, workdayEndHour + 2)
    );
    if (overtimeEndHour <= overtimeStartHour) {
      overtimeEndHour = Math.min(23, overtimeStartHour + 1);
    }
    const rescheduleAlertIntervalMinutes = clampRescheduleInterval(parsed.rescheduleAlertIntervalMinutes);
    const timezone = normalizeTimezone(parsed.timezone);
    return {
      workdayStartHour,
      workdayEndHour,
      allowOvertime,
      overtimeStartHour,
      overtimeEndHour,
      rescheduleAlertIntervalMinutes,
      timezone,
    };
  } catch {
    return { ...DEFAULT_AGENDA_SETTINGS };
  }
}

function clampRescheduleInterval(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return DEFAULT_AGENDA_SETTINGS.rescheduleAlertIntervalMinutes;
  return Math.min(1440, Math.max(5, Math.round(v)));
}

export function normalizeAgendaSettingsPatch(
  patch: Partial<AgendaSettings>
): AgendaSettings {
  return parseAgendaSettings(JSON.stringify({ ...DEFAULT_AGENDA_SETTINGS, ...patch }));
}

async function loadPodiatristSettingsJson(podiatristId: string): Promise<string | null | undefined> {
  const row = await database
    .select({ agendaSettingsJson: professionalInfo.agendaSettingsJson })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, podiatristId))
    .limit(1);
  return row[0]?.agendaSettingsJson;
}

async function loadClinicSettingsJson(clinicId: string): Promise<string | null | undefined> {
  const row = await database
    .select({ agendaSettingsJson: clinics.agendaSettingsJson })
    .from(clinics)
    .where(eq(clinics.clinicId, clinicId))
    .limit(1);
  return row[0]?.agendaSettingsJson;
}

/** Resuelve prefs del podólogo; si no tiene, fallback a clínica. */
export async function resolveAgendaSettingsForPodiatrist(
  podiatristId: string
): Promise<{ settings: AgendaSettings; source: 'podiatrist' | 'clinic' | 'default'; clinicId: string | null }> {
  const userRows = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, podiatristId))
    .limit(1);
  const clinicId = userRows[0]?.clinicId ?? null;

  const personalJson = await loadPodiatristSettingsJson(podiatristId);
  if (personalJson?.trim()) {
    return { settings: parseAgendaSettings(personalJson), source: 'podiatrist', clinicId };
  }

  if (clinicId) {
    const clinicJson = await loadClinicSettingsJson(clinicId);
    if (clinicJson?.trim()) {
      return { settings: parseAgendaSettings(clinicJson), source: 'clinic', clinicId };
    }
  }

  return { settings: { ...DEFAULT_AGENDA_SETTINGS }, source: 'default', clinicId };
}

export async function getAgendaSettingsTarget(
  target: { kind: 'podiatrist'; podiatristId: string } | { kind: 'clinic'; clinicId: string }
): Promise<AgendaSettings> {
  if (target.kind === 'clinic') {
    return parseAgendaSettings(await loadClinicSettingsJson(target.clinicId));
  }
  const resolved = await resolveAgendaSettingsForPodiatrist(target.podiatristId);
  return resolved.settings;
}

/**
 * Intervalo (minutos) de reenvío de la alerta de reagendo pendiente, siempre a nivel clínica
 * (ignora overrides personales del podólogo): lo configura solo clinic_admin.
 */
export async function getRescheduleAlertIntervalMinutes(clinicId: string | null): Promise<number> {
  if (!clinicId) return DEFAULT_AGENDA_SETTINGS.rescheduleAlertIntervalMinutes;
  const settings = await getAgendaSettingsTarget({ kind: 'clinic', clinicId });
  return settings.rescheduleAlertIntervalMinutes;
}

export interface ClinicBusinessWindow {
  startHour: number;
  endHour: number; // exclusivo
  timezone: string;
}

/** Ventana laboral + zona horaria a nivel clínica (para las alertas de reagendo). */
export async function getClinicBusinessWindow(clinicId: string | null): Promise<ClinicBusinessWindow> {
  const settings = clinicId
    ? await getAgendaSettingsTarget({ kind: 'clinic', clinicId })
    : { ...DEFAULT_AGENDA_SETTINGS };
  return {
    startHour: settings.workdayStartHour,
    endHour: settings.workdayEndHour,
    timezone: settings.timezone,
  };
}

/**
 * ¿La hora local de la clínica está dentro del horario laboral, con `bufferHours` extra
 * al cierre (p. ej. 1h para cortes de caja)? Fuera de esa ventana no se envían alertas.
 */
export function isWithinBusinessHours(
  window: ClinicBusinessWindow,
  bufferHours = 0,
  at: Date = new Date()
): boolean {
  const hour = localHourInTimezone(window.timezone, at);
  return hour >= window.startHour && hour < window.endHour + bufferHours;
}

export async function saveAgendaSettings(
  target: { kind: 'podiatrist'; podiatristId: string } | { kind: 'clinic'; clinicId: string },
  patch: Partial<AgendaSettings>
): Promise<AgendaSettings> {
  const merged = normalizeAgendaSettingsPatch({
    ...(await getAgendaSettingsTarget(target)),
    ...patch,
  });
  const json = JSON.stringify(merged);

  if (target.kind === 'clinic') {
    await database
      .update(clinics)
      .set({ agendaSettingsJson: json })
      .where(eq(clinics.clinicId, target.clinicId));
    return merged;
  }

  const exists = await database
    .select({ userId: professionalInfo.userId })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, target.podiatristId))
    .limit(1);

  if (exists[0]) {
    await database
      .update(professionalInfo)
      .set({ agendaSettingsJson: json })
      .where(eq(professionalInfo.userId, target.podiatristId));
  } else {
    const userRows = await database
      .select({ name: createdUsers.name, email: createdUsers.email })
      .from(createdUsers)
      .where(eq(createdUsers.userId, target.podiatristId))
      .limit(1);
    const u = userRows[0];
    await database.insert(professionalInfo).values({
      userId: target.podiatristId,
      name: u?.name ?? 'Podólogo',
      email: u?.email ?? '',
      agendaSettingsJson: json,
    });
  }

  return merged;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Valida si una cita cabe en horario laboral / extras.
 * Retorna null si OK, o { code, message } si bloqueada.
 * Ventana laboral: [workdayStartHour, workdayEndHour).
 * Con overtime: también [overtimeStartHour, overtimeEndHour), y tramos que cruzan ambas.
 */
export function checkAppointmentAgainstAgendaSettings(
  settings: AgendaSettings,
  time: string,
  durationMinutes: number
): { code: 'AGENDA_OUTSIDE_HOURS' | 'AGENDA_OVERTIME_LIMIT'; message: string } | null {
  const start = timeToMinutes(time);
  const end = start + Math.max(1, durationMinutes);
  const workStart = settings.workdayStartHour * 60;
  const workEnd = settings.workdayEndHour * 60;
  const otStart = settings.overtimeStartHour * 60;
  const otEnd = settings.overtimeEndHour * 60;

  if (start >= workStart && end <= workEnd) return null;

  if (!settings.allowOvertime) {
    return {
      code: 'AGENDA_OUTSIDE_HOURS',
      message:
        'La cita queda fuera del horario de atención. El podólogo no permite horas extras para recepción. La cita no se guardará.',
    };
  }

  // Con extras: permitir desde workStart hasta otEnd si el tramo cruza laboral+extra,
  // o entero dentro de [otStart, otEnd).
  const withinExtended = start >= workStart && end <= otEnd;
  const withinOtOnly = start >= otStart && end <= otEnd;
  if (withinExtended || withinOtOnly) return null;

  return {
    code: 'AGENDA_OVERTIME_LIMIT',
    message: `La cita supera el tope de horas extras (${String(settings.overtimeEndHour).padStart(2, '0')}:00). La cita no se guardará.`,
  };
}

export async function assertReceptionistAgendaSlot(
  user: JWTPayload,
  podiatristId: string,
  time: string,
  durationMinutes: number
): Promise<{ code: string; message: string } | null> {
  if (user.role !== 'receptionist') return null;
  const { settings } = await resolveAgendaSettingsForPodiatrist(podiatristId);
  return checkAppointmentAgainstAgendaSettings(settings, time, durationMinutes);
}

/**
 * Aviso (sin bloqueo) cuando podólogo / clinic_admin agenda fuera de horario.
 * Reccepción no usa esto: para ellos aplica assertReceptionistAgendaSlot.
 */
export async function getAgendaOutsideHoursAdvisory(
  user: JWTPayload,
  podiatristId: string,
  time: string,
  durationMinutes: number
): Promise<{ code: string; message: string } | null> {
  if (user.role !== 'podiatrist' && user.role !== 'clinic_admin') return null;
  const { settings } = await resolveAgendaSettingsForPodiatrist(podiatristId);
  const block = checkAppointmentAgainstAgendaSettings(settings, time, durationMinutes);
  if (!block) return null;
  return {
    code: block.code,
    message:
      block.code === 'AGENDA_OUTSIDE_HOURS'
        ? `Aviso: la cita queda fuera del horario laboral (${String(settings.workdayStartHour).padStart(2, '0')}:00–${String(settings.workdayEndHour).padStart(2, '0')}:00).`
        : `Aviso: la cita supera el tope de horas extras (${String(settings.overtimeEndHour).padStart(2, '0')}:00).`,
  };
}

export async function canAccessAgendaSettingsForPodiatrist(
  user: JWTPayload,
  podiatristId: string
): Promise<boolean> {
  if (user.role === 'podiatrist') return user.userId === podiatristId;
  if (user.role === 'clinic_admin') {
    if (!user.clinicId) return false;
    const row = await database
      .select({ clinicId: createdUsers.clinicId, role: createdUsers.role })
      .from(createdUsers)
      .where(eq(createdUsers.userId, podiatristId))
      .limit(1);
    return row[0]?.role === 'podiatrist' && row[0]?.clinicId === user.clinicId;
  }
  if (user.role === 'receptionist') {
    const assigned = await getAssignedPodiatristUserIds(user.userId);
    return assigned.includes(podiatristId);
  }
  return false;
}
