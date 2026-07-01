import { describe, expect, it } from 'vitest';
import { addMinutesToLocalDateTime, buildIcsCalendar, formatIcsLocalDateTime } from './ics-calendar';

describe('ics-calendar', () => {
  it('formatea fecha/hora local', () => {
    expect(formatIcsLocalDateTime('2026-06-30', '9:05')).toBe('20260630T090500');
    expect(formatIcsLocalDateTime('2026-06-30', '14:30')).toBe('20260630T143000');
  });

  it('suma duración en la misma zona local', () => {
    expect(addMinutesToLocalDateTime('2026-06-30', '10:00', 30)).toBe('20260630T103000');
    expect(addMinutesToLocalDateTime('2026-06-30', '23:45', 30)).toBe('20260701T001500');
  });

  it('genera VCALENDAR con eventos', () => {
    const ics = buildIcsCalendar(
      [
        {
          uid: 'apt_test',
          date: '2026-06-30',
          time: '10:00',
          durationMinutes: 30,
          summary: 'Cita — Juan Pérez',
          description: 'Consulta',
        },
      ],
      'Agenda prueba'
    );
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:apt_test@podoadmin');
    expect(ics).toContain('DTSTART:20260630T100000');
    expect(ics).toContain('DTEND:20260630T103000');
    expect(ics).toContain('SUMMARY:Cita — Juan Pérez');
    expect(ics).toContain('END:VCALENDAR');
  });
});
