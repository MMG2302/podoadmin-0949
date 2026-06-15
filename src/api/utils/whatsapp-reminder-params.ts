/** Máximo permitido por Meta en variables de plantilla (conservador). */
export const WHATSAPP_EXTRA_NOTE_MAX = 500;

/**
 * Texto final para el 4.º parámetro de la plantilla (notas/extras).
 * Prioridad: nota del envío → nota por defecto del usuario → guión.
 */
export function resolveWhatsAppExtraNote(
  perSendNote?: string | null,
  defaultNote?: string | null
): string {
  const merged = (perSendNote?.trim() || defaultNote?.trim() || '').slice(0, WHATSAPP_EXTRA_NOTE_MAX);
  return merged || '—';
}

/** Parámetros body de plantilla: nombre, fecha, hora, nota extra. */
export function buildReminderTemplateBodyParams(
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  perSendNote?: string | null,
  defaultNote?: string | null
): string[] {
  return [
    patientName,
    appointmentDate,
    appointmentTime,
    resolveWhatsAppExtraNote(perSendNote, defaultNote),
  ];
}
