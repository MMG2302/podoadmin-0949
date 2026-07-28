import type { AgendaBlock, AgendaBlockCategory } from "../types/agenda";

/** Espejo de src/api/utils/agenda-blocks.ts: misma regla de vigencia y solape. */

export const END_OF_DAY_MINUTES = 24 * 60;

export function agendaTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Día de la semana (0=domingo) de una fecha YYYY-MM-DD, sin desfase por zona horaria. */
export function weekdayOfIsoDate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay();
}

export function blockAppliesToDate(block: AgendaBlock, date: string): boolean {
  if (block.recurrence === "weekly") {
    if (block.startDate && date < block.startDate) return false;
    if (block.endDate && date > block.endDate) return false;
    return block.weekdays.includes(weekdayOfIsoDate(date));
  }
  if (!block.startDate) return false;
  const end = block.endDate ?? block.startDate;
  return date >= block.startDate && date <= end;
}

export function blockMinutes(block: AgendaBlock): { start: number; end: number } {
  return {
    start: agendaTimeToMinutes(block.startTime),
    end: agendaTimeToMinutes(block.endTime),
  };
}

export function isAllDayBlock(block: AgendaBlock): boolean {
  const { start, end } = blockMinutes(block);
  return start <= 0 && end >= END_OF_DAY_MINUTES;
}

/** Bloqueos que aplican en una fecha, ordenados por hora de inicio. */
export function blocksForDate(blocks: AgendaBlock[], date: string): AgendaBlock[] {
  return blocks
    .filter((b) => blockAppliesToDate(b, date))
    .sort((a, b) => agendaTimeToMinutes(a.startTime) - agendaTimeToMinutes(b.startTime));
}

/**
 * Aviso previo en el formulario: el backend igual devuelve 409, pero así el usuario
 * lo ve antes de guardar.
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

/** Sólo los bloqueos que afectan a este podólogo (los suyos + los de toda la clínica). */
export function blocksAffectingPodiatrist(
  blocks: AgendaBlock[],
  podiatristId: string
): AgendaBlock[] {
  return blocks.filter((b) => b.podiatristId === null || b.podiatristId === podiatristId);
}

export const AGENDA_BLOCK_CATEGORY_ICONS: Record<AgendaBlockCategory, string> = {
  lunch: "🍽️",
  personal: "🚶",
  admin: "📋",
  vacation: "🌴",
  other: "⛔",
};
