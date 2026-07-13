export const CALENDAR_START_HOUR = 7;
export const CALENDAR_END_HOUR = 21;
export const CALENDAR_HOUR_HEIGHT_PX = 56;

export type PodiatristColorStyle = {
  bg: string;
  border: string;
  text: string;
  dot: string;
};

export const PODIATRIST_COLOR_STYLES: PodiatristColorStyle[] = [
  { bg: "bg-sky-50", border: "border-sky-400", text: "text-sky-900", dot: "bg-sky-500" },
  { bg: "bg-teal-50", border: "border-teal-400", text: "text-teal-900", dot: "bg-teal-500" },
  { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-900", dot: "bg-amber-500" },
  { bg: "bg-violet-50", border: "border-violet-400", text: "text-violet-900", dot: "bg-violet-500" },
  { bg: "bg-rose-50", border: "border-rose-400", text: "text-rose-900", dot: "bg-rose-500" },
  { bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-900", dot: "bg-emerald-500" },
  { bg: "bg-orange-50", border: "border-orange-400", text: "text-orange-900", dot: "bg-orange-500" },
  { bg: "bg-cyan-50", border: "border-cyan-400", text: "text-cyan-900", dot: "bg-cyan-500" },
  { bg: "bg-fuchsia-50", border: "border-fuchsia-400", text: "text-fuchsia-900", dot: "bg-fuchsia-500" },
  { bg: "bg-lime-50", border: "border-lime-500", text: "text-lime-900", dot: "bg-lime-600" },
  { bg: "bg-indigo-50", border: "border-indigo-400", text: "text-indigo-900", dot: "bg-indigo-500" },
  { bg: "bg-pink-50", border: "border-pink-400", text: "text-pink-900", dot: "bg-pink-500" },
  { bg: "bg-yellow-50", border: "border-yellow-500", text: "text-yellow-900", dot: "bg-yellow-600" },
  { bg: "bg-red-50", border: "border-red-300", text: "text-red-900", dot: "bg-red-400" },
  { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-900", dot: "bg-blue-500" },
  { bg: "bg-green-50", border: "border-green-400", text: "text-green-900", dot: "bg-green-500" },
  { bg: "bg-purple-50", border: "border-purple-400", text: "text-purple-900", dot: "bg-purple-500" },
  { bg: "bg-stone-100", border: "border-stone-400", text: "text-stone-800", dot: "bg-stone-500" },
];

export const DEFAULT_APPOINTMENT_STYLE: PodiatristColorStyle = {
  bg: "bg-blue-50",
  border: "border-blue-300",
  text: "text-blue-900",
  dot: "bg-blue-500",
};

export function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function parseIsoToMinutes(iso: string): number | null {
  if (!iso.includes("T")) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
}

export function getCalendarHourSlots(): number[] {
  const slots: number[] = [];
  for (let h = CALENDAR_START_HOUR; h <= CALENDAR_END_HOUR; h++) slots.push(h);
  return slots;
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function getPodiatristColorIndex(
  podiatristId: string,
  orderedPodiatristIds: string[]
): number {
  const idx = orderedPodiatristIds.indexOf(podiatristId);
  if (idx < 0) return -1;
  return idx % PODIATRIST_COLOR_STYLES.length;
}

export function getPodiatristStyle(
  podiatristId: string,
  orderedPodiatristIds: string[]
): PodiatristColorStyle {
  const colorIdx = getPodiatristColorIndex(podiatristId, orderedPodiatristIds);
  if (colorIdx < 0) return DEFAULT_APPOINTMENT_STYLE;
  return PODIATRIST_COLOR_STYLES[colorIdx];
}

/** IDs de podólogos que comparten color con otro (paleta agotada). */
export function getPodiatristColorCollisions(orderedPodiatristIds: string[]): Set<string> {
  const byColor = new Map<number, string[]>();
  for (const id of orderedPodiatristIds) {
    const colorIdx = getPodiatristColorIndex(id, orderedPodiatristIds);
    if (colorIdx < 0) continue;
    const list = byColor.get(colorIdx) ?? [];
    list.push(id);
    byColor.set(colorIdx, list);
  }
  const collisions = new Set<string>();
  for (const ids of byColor.values()) {
    if (ids.length > 1) {
      for (const id of ids) collisions.add(id);
    }
  }
  return collisions;
}

export function podiatristInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function sortPodiatristsByName<T extends { name: string }>(podiatrists: T[]): T[] {
  return [...podiatrists].sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export type TimedCalendarEvent = {
  id: string;
  kind: "appointment" | "session";
  startMinutes: number;
  durationMinutes: number;
  podiatristId?: string;
};

export type LaidOutCalendarEvent = TimedCalendarEvent & {
  column: number;
  totalColumns: number;
};

export function layoutTimedEvents(events: TimedCalendarEvent[]): LaidOutCalendarEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => a.startMinutes - b.startMinutes || b.durationMinutes - a.durationMinutes
  );

  const clusters: TimedCalendarEvent[][] = [];
  let cluster: TimedCalendarEvent[] = [];
  let clusterEnd = -1;

  for (const event of sorted) {
    if (!cluster.length || event.startMinutes < clusterEnd) {
      cluster.push(event);
      clusterEnd = Math.max(clusterEnd, event.startMinutes + event.durationMinutes);
    } else {
      clusters.push(cluster);
      cluster = [event];
      clusterEnd = event.startMinutes + event.durationMinutes;
    }
  }
  if (cluster.length) clusters.push(cluster);

  const laidOut: LaidOutCalendarEvent[] = [];

  for (const group of clusters) {
    const columns: TimedCalendarEvent[][] = [];

    for (const event of group) {
      let placed = false;
      for (const col of columns) {
        const last = col[col.length - 1];
        if (last.startMinutes + last.durationMinutes <= event.startMinutes) {
          col.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([event]);
    }

    const totalColumns = columns.length;
    columns.forEach((col, columnIndex) => {
      for (const event of col) {
        laidOut.push({ ...event, column: columnIndex, totalColumns });
      }
    });
  }

  return laidOut;
}

export function eventTopPx(startMinutes: number): number {
  const gridStart = CALENDAR_START_HOUR * 60;
  return ((startMinutes - gridStart) / 60) * CALENDAR_HOUR_HEIGHT_PX;
}

export function eventHeightPx(durationMinutes: number): number {
  return Math.max((durationMinutes / 60) * CALENDAR_HOUR_HEIGHT_PX, 22);
}

export function clampEventToGrid(
  startMinutes: number,
  durationMinutes: number
): { startMinutes: number; durationMinutes: number } | null {
  const gridStart = CALENDAR_START_HOUR * 60;
  const gridEnd = (CALENDAR_END_HOUR + 1) * 60;
  const end = startMinutes + durationMinutes;
  if (end <= gridStart || startMinutes >= gridEnd) return null;
  const clampedStart = Math.max(startMinutes, gridStart);
  const clampedEnd = Math.min(end, gridEnd);
  return {
    startMinutes: clampedStart,
    durationMinutes: Math.max(clampedEnd - clampedStart, 15),
  };
}

export const CALENDAR_GRID_HEIGHT_PX =
  (CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1) * CALENDAR_HOUR_HEIGHT_PX;
