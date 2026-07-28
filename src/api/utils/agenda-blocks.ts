import { and, eq, isNull, or } from 'drizzle-orm';
import { database } from '../database';
import { agendaBlocks, createdUsers } from '../database/schema';
import type { JWTPayload } from './jwt';
import { getAssignedPodiatristUserIds } from './tenant-isolation';

/**
 * Bloqueos de agenda: tramos en los que no se agenda (comida, salida personal, vacaciones,
 * festivo de la clínica). Se aplican como bloqueo duro a todos los roles y a la reserva
 * pública en línea; para agendar encima hay que borrar el bloqueo.
 *
 * Complementan a agenda-settings: el horario laboral define la ventana de atención y estos
 * bloqueos recortan huecos dentro de ella.
 */

export const AGENDA_BLOCK_CATEGORIES = ['lunch', 'personal', 'admin', 'vacation', 'other'] as const;
export type AgendaBlockCategory = (typeof AGENDA_BLOCK_CATEGORIES)[number];

export const AGENDA_BLOCK_RECURRENCES = ['once', 'weekly'] as const;
export type AgendaBlockRecurrence = (typeof AGENDA_BLOCK_RECURRENCES)[number];

/** Fin de día como minutos: la ventana [start, end) usa 1440 para "hasta medianoche". */
export const END_OF_DAY_MINUTES = 24 * 60;

export type AgendaBlock = {
  id: string;
  /** null = bloqueo de toda la clínica (aplica a todos sus podólogos). */
  podiatristId: string | null;
  clinicId: string | null;
  title: string;
  category: AgendaBlockCategory;
  recurrence: AgendaBlockRecurrence;
  /** Días de la semana (0=domingo) en los que aplica, solo si recurrence='weekly'. */
  weekdays: number[];
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-4]):([0-5]\d)$/;

/** HH:MM -> minutos desde las 00:00. '24:00' = fin del día (1440). */
export function agendaTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToAgendaTime(minutes: number): string {
  const clamped = Math.min(END_OF_DAY_MINUTES, Math.max(0, Math.round(minutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Día de la semana (0=domingo) de una fecha YYYY-MM-DD.
 * Se parsea en UTC a propósito: `new Date('2026-07-28')` ya es UTC, pero
 * `new Date('2026-07-28T00:00')` sería local y cambiaría de día según la zona.
 */
export function weekdayOfIsoDate(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

export function parseWeekdays(csv: string | null | undefined): number[] {
  if (!csv) return [];
  const out = new Set<number>();
  for (const part of csv.split(',')) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n >= 0 && n <= 6) out.add(n);
  }
  return [...out].sort((a, b) => a - b);
}

export function serializeWeekdays(days: number[]): string {
  return [...new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
    .sort((a, b) => a - b)
    .join(',');
}

/** ¿El bloqueo aplica en esta fecha (YYYY-MM-DD)? */
export function blockAppliesToDate(block: AgendaBlock, date: string): boolean {
  if (!ISO_DATE_RE.test(date)) return false;

  if (block.recurrence === 'weekly') {
    // Vigencia opcional: sin fechas, el bloqueo semanal es permanente.
    if (block.startDate && date < block.startDate) return false;
    if (block.endDate && date > block.endDate) return false;
    return block.weekdays.includes(weekdayOfIsoDate(date));
  }

  // 'once': tramo cerrado. Sin startDate no hay nada que aplicar.
  if (!block.startDate) return false;
  const end = block.endDate ?? block.startDate;
  return date >= block.startDate && date <= end;
}

/** Ventana [inicio, fin) en minutos que ocupa el bloqueo. */
export function blockMinutes(block: AgendaBlock): { start: number; end: number } {
  return { start: agendaTimeToMinutes(block.startTime), end: agendaTimeToMinutes(block.endTime) };
}

/** ¿El bloqueo cubre el día entero? */
export function isAllDayBlock(block: AgendaBlock): boolean {
  const { start, end } = blockMinutes(block);
  return start <= 0 && end >= END_OF_DAY_MINUTES;
}

/**
 * Primer bloqueo que se solapa con el tramo pedido, o null si el hueco está libre.
 * El solape es estricto: dos tramos que solo se tocan en el borde (14:00-15:00 y 15:00-16:00)
 * no chocan.
 */
export function findOverlappingBlock(
  blocks: AgendaBlock[],
  date: string,
  time: string,
  durationMinutes: number
): AgendaBlock | null {
  const start = agendaTimeToMinutes(time);
  const end = start + Math.max(1, durationMinutes);
  for (const block of blocks) {
    if (!blockAppliesToDate(block, date)) continue;
    const win = blockMinutes(block);
    if (start < win.end && end > win.start) return block;
  }
  return null;
}

/** Bloqueos que aplican en una fecha concreta, ordenados por hora de inicio. */
export function blocksForDate(blocks: AgendaBlock[], date: string): AgendaBlock[] {
  return blocks
    .filter((b) => blockAppliesToDate(b, date))
    .sort((a, b) => agendaTimeToMinutes(a.startTime) - agendaTimeToMinutes(b.startTime));
}

type AgendaBlockRow = typeof agendaBlocks.$inferSelect;

function normalizeCategory(value: string | null | undefined): AgendaBlockCategory {
  return AGENDA_BLOCK_CATEGORIES.includes(value as AgendaBlockCategory)
    ? (value as AgendaBlockCategory)
    : 'other';
}

function normalizeRecurrence(value: string | null | undefined): AgendaBlockRecurrence {
  return value === 'weekly' ? 'weekly' : 'once';
}

export function mapAgendaBlockRow(row: AgendaBlockRow): AgendaBlock {
  return {
    id: row.id,
    podiatristId: row.podiatristId ?? null,
    clinicId: row.clinicId ?? null,
    title: row.title,
    category: normalizeCategory(row.category),
    recurrence: normalizeRecurrence(row.recurrence),
    weekdays: parseWeekdays(row.weekdays),
    startDate: row.startDate ?? null,
    endDate: row.endDate ?? null,
    startTime: row.startTime,
    endTime: row.endTime,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function getClinicIdForPodiatrist(podiatristId: string): Promise<string | null> {
  const rows = await database
    .select({ clinicId: createdUsers.clinicId })
    .from(createdUsers)
    .where(eq(createdUsers.userId, podiatristId))
    .limit(1);
  return rows[0]?.clinicId ?? null;
}

/**
 * Bloqueos vigentes para un podólogo: los suyos + los de toda su clínica.
 * Es la lista que hay que consultar antes de agendar.
 */
export async function loadBlocksForPodiatrist(podiatristId: string): Promise<AgendaBlock[]> {
  const clinicId = await getClinicIdForPodiatrist(podiatristId);

  const ownScope = eq(agendaBlocks.podiatristId, podiatristId);
  const where = clinicId
    ? or(ownScope, and(isNull(agendaBlocks.podiatristId), eq(agendaBlocks.clinicId, clinicId)))
    : ownScope;

  const rows = await database.select().from(agendaBlocks).where(where);
  return rows.map(mapAgendaBlockRow);
}

/** Todos los bloqueos de una clínica (los de cada podólogo + los clínica-wide). */
export async function loadBlocksForClinic(clinicId: string): Promise<AgendaBlock[]> {
  const rows = await database.select().from(agendaBlocks).where(eq(agendaBlocks.clinicId, clinicId));
  return rows.map(mapAgendaBlockRow);
}

export async function getAgendaBlockById(id: string): Promise<AgendaBlock | null> {
  const rows = await database.select().from(agendaBlocks).where(eq(agendaBlocks.id, id)).limit(1);
  return rows[0] ? mapAgendaBlockRow(rows[0]) : null;
}

/**
 * Bloqueo duro al agendar: si el tramo pisa un bloqueo, la cita no se guarda.
 * Aplica a todos los roles; para agendar encima hay que borrar el bloqueo primero.
 */
export async function assertSlotNotBlocked(
  podiatristId: string,
  date: string,
  time: string,
  durationMinutes: number
): Promise<{ code: 'AGENDA_BLOCKED'; message: string; block: AgendaBlock } | null> {
  const blocks = await loadBlocksForPodiatrist(podiatristId);
  const hit = findOverlappingBlock(blocks, date, time, durationMinutes);
  if (!hit) return null;
  return {
    code: 'AGENDA_BLOCKED',
    message: buildBlockedMessage(hit),
    block: hit,
  };
}

export function buildBlockedMessage(block: AgendaBlock): string {
  const window = isAllDayBlock(block)
    ? 'todo el día'
    : `${block.startTime}–${block.endTime === '24:00' ? '24:00' : block.endTime}`;
  return `El horario está bloqueado: "${block.title}" (${window}). Elige otra hora o elimina el bloqueo desde Agenda.`;
}

/** Podólogos cuya agenda puede bloquear este usuario. */
export async function canManageBlocksForPodiatrist(
  user: JWTPayload,
  podiatristId: string
): Promise<boolean> {
  if (user.role === 'podiatrist') return user.userId === podiatristId;

  if (user.role === 'clinic_admin') {
    if (!user.clinicId) return false;
    const rows = await database
      .select({ clinicId: createdUsers.clinicId, role: createdUsers.role })
      .from(createdUsers)
      .where(eq(createdUsers.userId, podiatristId))
      .limit(1);
    return rows[0]?.role === 'podiatrist' && rows[0]?.clinicId === user.clinicId;
  }

  if (user.role === 'receptionist') {
    const assigned = await getAssignedPodiatristUserIds(user.userId);
    return assigned.includes(podiatristId);
  }

  return false;
}

/** Solo el clinic_admin puede bloquear la agenda de toda la clínica (festivos, cierres). */
export function canManageClinicWideBlocks(user: JWTPayload): boolean {
  return user.role === 'clinic_admin' && Boolean(user.clinicId);
}

export type AgendaBlockInput = {
  podiatristId: string | null;
  clinicId: string | null;
  title: string;
  category: AgendaBlockCategory;
  recurrence: AgendaBlockRecurrence;
  weekdays: number[];
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
};

/**
 * Normaliza y valida el bloqueo antes de guardarlo. Devuelve el error en español
 * (ya listo para la respuesta) o los datos saneados.
 */
export function validateAgendaBlockInput(
  input: AgendaBlockInput
): { ok: false; error: string } | { ok: true; value: AgendaBlockInput } {
  const title = input.title.trim().slice(0, 120);
  if (title.length < 2) return { ok: false, error: 'El título del bloqueo es obligatorio' };

  if (!TIME_RE.test(input.startTime) || !TIME_RE.test(input.endTime)) {
    return { ok: false, error: 'Horas inválidas (formato HH:MM)' };
  }
  const start = agendaTimeToMinutes(input.startTime);
  const end = agendaTimeToMinutes(input.endTime);
  if (end <= start) return { ok: false, error: 'La hora de fin debe ser posterior a la de inicio' };
  if (end > END_OF_DAY_MINUTES) return { ok: false, error: 'La hora de fin no puede pasar de 24:00' };

  for (const d of [input.startDate, input.endDate]) {
    if (d != null && !ISO_DATE_RE.test(d)) return { ok: false, error: 'Fecha inválida (formato YYYY-MM-DD)' };
  }

  if (input.recurrence === 'weekly') {
    const weekdays = serializeWeekdays(input.weekdays);
    if (!weekdays) return { ok: false, error: 'Elige al menos un día de la semana' };
    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      return { ok: false, error: 'La vigencia termina antes de empezar' };
    }
    return {
      ok: true,
      value: {
        ...input,
        title,
        weekdays: parseWeekdays(weekdays),
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
      },
    };
  }

  // 'once': la fecha de inicio es obligatoria y el rango se cierra en sí mismo
  // (endDate = startDate) para que blockAppliesToDate no lo deje abierto hacia el futuro.
  if (!input.startDate) return { ok: false, error: 'Elige la fecha del bloqueo' };
  const endDate = input.endDate ?? input.startDate;
  if (endDate < input.startDate) return { ok: false, error: 'La fecha de fin es anterior a la de inicio' };

  return {
    ok: true,
    value: { ...input, title, weekdays: [], startDate: input.startDate, endDate },
  };
}
