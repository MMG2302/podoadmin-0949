import { DEFAULT_TENANT_COUNTRY } from '../../lib/phone-country';
import { buildWaMeUrl, formatDisplayDate, normalizePhoneForWaMe } from './whatsapp-web-link';
export type AgendaExportAppointment = {
  id: string;
  date: string;
  time: string;
  duration: number;
  notes: string;
  patientName: string;
  patientPhone: string;
  podiatristName: string;
};

export type AgendaExportPreview = {
  date: string;
  podiatristId: string | null;
  podiatristName: string | null;
  podiatristPhone?: string | null;
  podiatristCountryCode?: string | null;
  clinicPhone?: string | null;
  clinicCountryCode?: string | null;
  appointments: AgendaExportAppointment[];
  count: number;
};

export function formatLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildAgendaExportQuery(date: string, podiatristId?: string): string {
  const params = new URLSearchParams({ date });
  if (podiatristId) params.set('podiatristId', podiatristId);
  return params.toString();
}

export async function downloadAgendaIcs(
  date: string,
  podiatristId?: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const qs = buildAgendaExportQuery(date, podiatristId);
  const res = await fetch(`/api/appointments/export/ics?${qs}`, { credentials: 'include' });
  if (!res.ok) {
    let msg = 'Error al descargar';
    try {
      const j = (await res.json()) as { message?: string; error?: string };
      msg = j.message || j.error || msg;
    } catch {
      /* body no JSON */
    }
    return { ok: false, message: msg };
  }
  const blob = await res.blob();
  const cd = res.headers.get('Content-Disposition');
  let filename = `agenda-${date}.ics`;
  const match = cd?.match(/filename="([^"]+)"/);
  if (match?.[1]) filename = match[1];
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { ok: true };
}

export async function fetchAgendaExportPreview(
  date: string,
  podiatristId?: string
): Promise<{ ok: true; data: AgendaExportPreview } | { ok: false; message: string }> {
  const qs = buildAgendaExportQuery(date, podiatristId);
  const res = await fetch(`/api/appointments/export/preview?${qs}`, { credentials: 'include' });
  let data: AgendaExportPreview & { message?: string; error?: string } = {
    date,
    podiatristId: null,
    podiatristName: null,
    clinicPhone: null,
    appointments: [],
    count: 0,
  };
  try {
    data = await res.json();
  } catch {
    /* */
  }
  if (!res.ok) {
    return { ok: false, message: data.message || data.error || 'Error' };
  }
  return { ok: true, data };
}

export type AgendaWhatsAppMessageLabels = {
  header: string;
  line: string;
  emptyDay: string;
  attachHint: string;
};

export function buildAgendaWhatsAppMessage(
  preview: AgendaExportPreview,
  labels: AgendaWhatsAppMessageLabels,
  locale = 'es-MX'
): string {
  const dateLabel = formatDisplayDate(preview.date, locale);
  const header = labels.header
    .replace(/\{\{fecha\}\}/gi, dateLabel)
    .replace(/\{\{podólogo\}\}/gi, preview.podiatristName ?? '')
    .replace(/\{\{podologo\}\}/gi, preview.podiatristName ?? '')
    .replace(/\{\{count\}\}/gi, String(preview.count));

  if (preview.count === 0) {
    return `${header}\n\n${labels.emptyDay}`;
  }

  const lines = preview.appointments.map((a) =>
    labels.line
      .replace(/\{\{hora\}\}/gi, a.time)
      .replace(/\{\{paciente\}\}/gi, a.patientName)
      .replace(/\{\{duracion\}\}/gi, String(a.duration))
      .replace(/\{\{telefono\}\}/gi, a.patientPhone?.trim() || '—')
  );

  return `${header}\n\n${lines.join('\n')}\n\n${labels.attachHint}`;
}

export function openAgendaWhatsAppWeb(
  message: string,
  phone: string | null | undefined,
  countryCode: string = DEFAULT_TENANT_COUNTRY
): { ok: true } | { ok: false; reason: 'invalidPhone' } {
  const text = encodeURIComponent(message);
  if (!phone?.trim()) {
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    return { ok: true };
  }
  const waDigits = normalizePhoneForWaMe(phone, countryCode);
  if (!waDigits) {
    return { ok: false, reason: 'invalidPhone' };
  }
  window.open(buildWaMeUrl(waDigits, message), '_blank', 'noopener,noreferrer');
  return { ok: true };
}

/** Recepción/admin: teléfono del podólogo si está configurado; si no, sin destinatario fijo. */
export function resolveAgendaWhatsAppPhone(
  preview: AgendaExportPreview,
  opts: { directToPodiatrist: boolean }
): string | null {
  if (!opts.directToPodiatrist) return null;
  return preview.podiatristPhone?.trim() || null;
}

export function resolveAgendaWhatsAppCountry(
  preview: AgendaExportPreview,
  fallbackCountry: string
): string {
  return preview.podiatristCountryCode || fallbackCountry;
}
