export const WHATSAPP_WEB_TEMPLATE_STORAGE_KEY = "podoadmin_whatsapp_web_template";

export const DEFAULT_WHATSAPP_WEB_TEMPLATE = `Hola {{nombre}}, le recordamos su cita podológica el {{fecha}} a las {{hora}}.

{{nota}}

Si necesita reprogramar, avísenos con antelación. ¡Gracias!`;

export type WhatsAppWebMessageVars = {
  nombre: string;
  fecha: string;
  hora: string;
  nota?: string;
};

/** Dígitos internacionales sin + (formato wa.me). */
export function normalizePhoneForWaMe(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.length === 10) digits = `52${digits}`;
  return digits;
}

export function applyWhatsAppWebTemplate(
  template: string,
  vars: WhatsAppWebMessageVars
): string {
  const nota = vars.nota?.trim() || "";
  return template
    .replaceAll("{{nombre}}", vars.nombre)
    .replaceAll("{{fecha}}", vars.fecha)
    .replaceAll("{{hora}}", vars.hora)
    .replaceAll("{{nota}}", nota)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function applyCampaignWebMessage(
  template: string,
  patient: { firstName: string; lastName: string }
): string {
  const nombre = patient.firstName.trim();
  const apellido = patient.lastName.trim();
  const nombreCompleto = `${nombre} ${apellido}`.trim();
  return template
    .replaceAll("{{nombre}}", nombre)
    .replaceAll("{{apellido}}", apellido)
    .replaceAll("{{nombre_completo}}", nombreCompleto)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type CampaignWebRecipient = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  waPhone: string;
};

export function filterCampaignWebRecipients(
  patients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    clinicId?: string | null;
  }>,
  options: { clinicOnly: boolean; userClinicId?: string | null }
): CampaignWebRecipient[] {
  return patients
    .filter((p) => {
      const digits = p.phone?.replace(/\D/g, "") ?? "";
      if (digits.length < 8) return false;
      // /patients ya aplica visibilidad por rol; clinicId puede no venir en JSON antiguo.
      if (options.clinicOnly && options.userClinicId && p.clinicId) {
        return p.clinicId === options.userClinicId;
      }
      return true;
    })
    .map((p) => {
      const waPhone = normalizePhoneForWaMe(p.phone);
      if (!waPhone) return null;
      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        waPhone,
      };
    })
    .filter((r): r is CampaignWebRecipient => r !== null)
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "es")
    );
}

export function parseCampaignFilterJson(filterJson: string | null | undefined): {
  clinicOnly: boolean;
} {
  try {
    const parsed = JSON.parse(filterJson || "{}") as { clinicOnly?: boolean };
    return { clinicOnly: parsed.clinicOnly !== false };
  } catch {
    return { clinicOnly: true };
  }
}

export function buildWaMeUrl(phoneDigits: string, message: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export function loadWhatsAppWebTemplate(userId: string | undefined): string {
  if (typeof window === "undefined" || !userId) return DEFAULT_WHATSAPP_WEB_TEMPLATE;
  try {
    const raw = localStorage.getItem(`${WHATSAPP_WEB_TEMPLATE_STORAGE_KEY}_${userId}`);
    return raw?.trim() || DEFAULT_WHATSAPP_WEB_TEMPLATE;
  } catch {
    return DEFAULT_WHATSAPP_WEB_TEMPLATE;
  }
}

export function saveWhatsAppWebTemplate(userId: string, template: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${WHATSAPP_WEB_TEMPLATE_STORAGE_KEY}_${userId}`, template);
}

export function formatLocalDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTomorrowLocalDateString(now = new Date()): string {
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  return formatLocalDateYYYYMMDD(t);
}

export function formatDisplayDate(isoDate: string, locale = "es-ES"): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
