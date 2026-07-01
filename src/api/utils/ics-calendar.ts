/**
 * Generación iCalendar (.ics) para importar citas en calendarios móviles (iOS/Android).
 */

export type IcsAppointmentEvent = {
  uid: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  summary: string;
  description?: string;
  location?: string;
};

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** DTSTART/DTEND en hora local flotante (sin conversión UTC). */
export function formatIcsLocalDateTime(date: string, time: string): string {
  const [y, m, d] = date.split('-');
  const parts = time.split(':');
  const hh = pad2(Number(parts[0] ?? 0));
  const mm = pad2(Number(parts[1] ?? 0));
  return `${y}${m}${d}T${hh}${mm}00`;
}

export function addMinutesToLocalDateTime(date: string, time: string, minutes: number): string {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const start = new Date(y, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, 0);
  const end = new Date(start.getTime() + minutes * 60_000);
  return (
    `${end.getFullYear()}${pad2(end.getMonth() + 1)}${pad2(end.getDate())}` +
    `T${pad2(end.getHours())}${pad2(end.getMinutes())}00`
  );
}

export function buildIcsCalendar(events: IcsAppointmentEvent[], calendarName: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PodoAdmin//Agenda//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

  for (const event of events) {
    const dtStart = formatIcsLocalDateTime(event.date, event.time);
    const dtEnd = addMinutesToLocalDateTime(event.date, event.time, event.durationMinutes);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeIcsText(event.uid)}@podoadmin`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcsText(event.summary)}`
    );
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
