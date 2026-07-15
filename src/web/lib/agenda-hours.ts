import type { AgendaSettings } from "../types/agenda";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Misma regla que el backend: ventana laboral [start, end); extras hasta otEnd. */
export function isAppointmentOutsideAgendaHours(
  settings: AgendaSettings,
  time: string,
  durationMinutes: number
): { code: "AGENDA_OUTSIDE_HOURS" | "AGENDA_OVERTIME_LIMIT"; message: string } | null {
  const start = timeToMinutes(time);
  const end = start + Math.max(1, durationMinutes);
  const workStart = settings.workdayStartHour * 60;
  const workEnd = settings.workdayEndHour * 60;
  const otStart = settings.overtimeStartHour * 60;
  const otEnd = settings.overtimeEndHour * 60;

  if (start >= workStart && end <= workEnd) return null;

  if (!settings.allowOvertime) {
    return {
      code: "AGENDA_OUTSIDE_HOURS",
      message: `Esta cita queda fuera del horario laboral (${String(settings.workdayStartHour).padStart(2, "0")}:00–${String(settings.workdayEndHour).padStart(2, "0")}:00).`,
    };
  }

  const withinExtended = start >= workStart && end <= otEnd;
  const withinOtOnly = start >= otStart && end <= otEnd;
  if (withinExtended || withinOtOnly) return null;

  return {
    code: "AGENDA_OVERTIME_LIMIT",
    message: `Esta cita supera el tope de horas extras (${String(settings.overtimeEndHour).padStart(2, "0")}:00).`,
  };
}
