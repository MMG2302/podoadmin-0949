import { and, eq, ne } from 'drizzle-orm';
import { database } from '../database';
import {
  appointments as appointmentsTable,
  clinics as clinicsTable,
  createdUsers,
  professionalInfo,
} from '../database/schema';
import { resolveAgendaSettingsForPodiatrist, localHourInTimezone } from './agenda-settings';

export const BOOKING_SLOT_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 21;

const TOKEN_RE = /^[a-f0-9]{16,64}$/i;

export interface BookingTarget {
  podiatristUserId: string;
  clinicId: string | null;
  enabled: boolean;
}

export async function resolveBookingToken(rawToken: string | undefined): Promise<BookingTarget | null> {
  const token = rawToken?.trim() ?? '';
  if (!TOKEN_RE.test(token)) return null;
  const rows = await database
    .select({ userId: professionalInfo.userId, enabled: professionalInfo.bookingEnabled })
    .from(professionalInfo)
    .where(eq(professionalInfo.bookingToken, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const userRows = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, row.userId))
    .limit(1);
  return { podiatristUserId: row.userId, clinicId: userRows[0]?.clinicId ?? null, enabled: row.enabled === true };
}

/** Genera (o reutiliza) el token de reserva del podólogo y opcionalmente lo habilita. */
export async function getOrCreateBookingToken(
  podiatristUserId: string,
  enable?: boolean
): Promise<{ token: string; enabled: boolean }> {
  const existing = await database
    .select({ token: professionalInfo.bookingToken, enabled: professionalInfo.bookingEnabled })
    .from(professionalInfo)
    .where(eq(professionalInfo.userId, podiatristUserId))
    .limit(1);

  let token = existing[0]?.token ?? null;
  const enabled = enable === undefined ? existing[0]?.enabled === true : enable;
  if (!token) token = crypto.randomUUID().replace(/-/g, '');

  if (existing[0]) {
    await database
      .update(professionalInfo)
      .set({ bookingToken: token, bookingEnabled: enabled })
      .where(eq(professionalInfo.userId, podiatristUserId));
  } else {
    const u = await database
      .select({ name: createdUsers.name, email: createdUsers.email })
      .from(createdUsers)
      .where(eq(createdUsers.userId, podiatristUserId))
      .limit(1);
    await database.insert(professionalInfo).values({
      userId: podiatristUserId,
      name: u[0]?.name ?? 'Podólogo',
      email: u[0]?.email ?? '',
      bookingToken: token,
      bookingEnabled: enabled,
    });
  }
  return { token, enabled };
}

export async function getBookingBranding(target: BookingTarget) {
  let clinicName: string | null = null;
  let mapsUrl: string | null = null;
  let clinicId = target.clinicId;
  if (clinicId) {
    const c = await database
      .select({ clinicName: clinicsTable.clinicName, mapsUrl: clinicsTable.mapsUrl })
      .from(clinicsTable)
      .where(eq(clinicsTable.clinicId, clinicId))
      .limit(1);
    clinicName = c[0]?.clinicName ?? null;
    mapsUrl = c[0]?.mapsUrl?.trim() || null;
  }
  const pod = await database
    .select({ name: createdUsers.name })
    .from(createdUsers)
    .where(eq(createdUsers.userId, target.podiatristUserId))
    .limit(1);
  return { clinicName, mapsUrl, clinicId, podiatristName: pod[0]?.name ?? null };
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseDurationFromNotes(notes: string | null): number {
  if (!notes) return BOOKING_SLOT_MINUTES;
  try {
    const p = JSON.parse(notes) as { duration?: number };
    if (typeof p === 'object' && p && typeof p.duration === 'number') return p.duration;
  } catch {
    /* notas planas */
  }
  return BOOKING_SLOT_MINUTES;
}

/** Huecos libres (HH:MM) para una fecha, según horario laboral menos citas existentes. */
export async function computeAvailableSlots(
  podiatristUserId: string,
  date: string
): Promise<string[]> {
  const { settings } = await resolveAgendaSettingsForPodiatrist(podiatristUserId);
  const workStart = settings.workdayStartHour * 60;
  const workEnd = settings.workdayEndHour * 60;

  const existing = await database
    .select({ time: appointmentsTable.sessionTime, notes: appointmentsTable.notes, status: appointmentsTable.status })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.createdBy, podiatristUserId),
        eq(appointmentsTable.sessionDate, date),
        ne(appointmentsTable.status, 'cancelled')
      )
    );
  const busy = existing.map((e) => {
    const start = timeToMinutes(e.time);
    return { start, end: start + parseDurationFromNotes(e.notes) };
  });

  // Si la fecha es hoy en la zona de la clínica, excluir horas ya pasadas.
  const nowLocalHour = localHourInTimezone(settings.timezone);
  const nowMin = new Date();
  const localNowMinutes = nowLocalHour * 60 + nowMin.getUTCMinutes();
  const isToday = date === todayInTimezone(settings.timezone);

  const slots: string[] = [];
  for (let s = workStart; s + BOOKING_SLOT_MINUTES <= workEnd; s += BOOKING_SLOT_MINUTES) {
    const e = s + BOOKING_SLOT_MINUTES;
    if (isToday && s <= localNowMinutes) continue;
    const overlaps = busy.some((b) => s < b.end && e > b.start);
    if (!overlaps) slots.push(minutesToTime(s));
  }
  return slots;
}

export function todayInTimezone(timezone: string, at: Date = new Date()): string {
  try {
    // en-CA da formato YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}
