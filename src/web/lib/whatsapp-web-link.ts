import type { Patient } from '../types/clinical';
import {
  DEFAULT_TENANT_COUNTRY,
  getDialCode,
  normalizePhoneDigits,
  normalizePhoneE164,
  resolveTenantCountryCode,
  type TenantCountryCode,
} from '../../lib/phone-country';

export const DEFAULT_WHATSAPP_WEB_TEMPLATE =
  'Hola {{nombre}}, le recordamos su cita el {{fecha}} a las {{hora}}. {{nota}}\n' +
  'Para confirmar, haz clic aquí: {{confirmar}}\n' +
  'Para cancelar, haz clic aquí: {{cancelar}}\n' +
  'Para reagendar, haz clic aquí: {{reagendar}}';

/** Templates predefinidos para inspir engagement. Variables disponibles:
 * {{nombre}}, {{fecha}}, {{hora}}, {{nota}}, {{confirmar}}, {{cancelar}}, {{reagendar}},
 * {{doctor}}, {{ubicacion}}, {{maps}}, {{costo}}, {{duracion}}, {{clinica}}
 */
export const WHATSAPP_TEMPLATE_EXAMPLES = [
  {
    id: 'basic',
    name: 'Básico (recordatorio)',
    template:
      'Hola {{nombre}}, le recordamos su cita el {{fecha}} a las {{hora}}. {{nota}}\n' +
      'Para confirmar, haz clic aquí: {{confirmar}}\n' +
      'Para cancelar, haz clic aquí: {{cancelar}}\n' +
      'Para reagendar, haz clic aquí: {{reagendar}}',
  },
  {
    id: 'with-doctor',
    name: 'Con datos del doctor',
    template:
      'Hola {{nombre}}, recordamos que tienes cita con {{doctor}} el {{fecha}} a las {{hora}}.\n\n' +
      '📍 {{ubicacion}}\n' +
      '💰 Costo: {{costo}} | ⏱️ Duración: {{duracion}}\n\n' +
      '{{nota}}\n\n' +
      'Confirmar: {{confirmar}}\n' +
      'Cancelar: {{cancelar}}\n' +
      'Reagendar: {{reagendar}}',
  },
  {
    id: 'with-location',
    name: 'Con ubicación y maps',
    template:
      'Hola {{nombre}} 👋\n\n' +
      'Te recordamos tu cita el {{fecha}} a las {{hora}} con {{doctor}}.\n\n' +
      '📍 {{ubicacion}}\n' +
      '🗺️ Ver ubicación: {{maps}}\n' +
      '🏥 {{clinica}}\n\n' +
      '{{nota}}\n\n' +
      'Confirma tu asistencia: {{confirmar}} | Cancelar: {{cancelar}} | Reagendar: {{reagendar}}',
  },
  {
    id: 'engagement',
    name: 'Con experiencia de visita',
    template:
      'Hola {{nombre}} 😊\n\n' +
      'Te espera una experiencia de cuidado podológico en {{clinica}}.\n' +
      '👨‍⚕️ Doctor: {{doctor}}\n' +
      '📅 {{fecha}} a las {{hora}}\n' +
      '📍 {{ubicacion}}\n' +
      '⏱️ Duración aproximada: {{duracion}}\n' +
      '💰 Inversión: {{costo}}\n\n' +
      '{{nota}}\n\n' +
      '✅ Confirmar: {{confirmar}}\n' +
      '❌ Necesitas cancelar: {{cancelar}}\n' +
      '🔄 Necesitas otra fecha: {{reagendar}}',
  },
];

/** ¿La plantilla usa alguno de los enlaces por token ({{confirmar}}/{{cancelar}}/{{reagendar}})? */
export function templateHasConfirmationLinks(template: string): boolean {
  return /\{\{(confirmar|cancelar|reagendar)\}\}/i.test(template);
}

const TEMPLATE_STORAGE_PREFIX = 'podoadmin_wa_template_';

export function loadWhatsAppWebTemplate(userId: string): string {
  try {
    return localStorage.getItem(`${TEMPLATE_STORAGE_PREFIX}${userId}`) || DEFAULT_WHATSAPP_WEB_TEMPLATE;
  } catch {
    return DEFAULT_WHATSAPP_WEB_TEMPLATE;
  }
}

export function saveWhatsAppWebTemplate(userId: string, template: string): void {
  try {
    localStorage.setItem(`${TEMPLATE_STORAGE_PREFIX}${userId}`, template);
  } catch {
    /* ignore */
  }
}

const RESCHEDULE_WA_STORAGE_PREFIX = 'podoadmin_wa_reschedule_';

/** Plantilla editable del mensaje de WhatsApp de "Avisar reagendo" (por usuario). */
export function loadWaRescheduleTemplate(userId: string, fallback: string): string {
  try {
    return localStorage.getItem(`${RESCHEDULE_WA_STORAGE_PREFIX}${userId}`) || fallback;
  } catch {
    return fallback;
  }
}

export function saveWaRescheduleTemplate(userId: string, template: string): void {
  try {
    localStorage.setItem(`${RESCHEDULE_WA_STORAGE_PREFIX}${userId}`, template);
  } catch {
    /* ignore */
  }
}

/**
 * Rellena la plantilla de reagendo. Acepta llaves simples o dobles: {nombre}/{{nombre}},
 * {fecha}, {reserva} (link de reserva en línea). {reserva} vacío se elimina junto con su línea.
 */
export function applyRescheduleWaMessage(
  template: string,
  vars: { name: string; date: string; reserva: string }
): string {
  let out = template
    .replace(/\{\{?\s*(nombre|name)\s*\}?\}/gi, vars.name)
    .replace(/\{\{?\s*(fecha|date)\s*\}?\}/gi, vars.date);
  if (vars.reserva) {
    out = out.replace(/\{\{?\s*(reserva|booking|link)\s*\}?\}/gi, vars.reserva);
  } else {
    // Sin link configurado: quita la línea que contenga {reserva} para no dejar un hueco raro.
    out = out
      .replace(/^.*\{\{?\s*(reserva|booking|link)\s*\}?\}.*$\n?/gim, '')
      .replace(/\{\{?\s*(reserva|booking|link)\s*\}?\}/gi, '');
  }
  return out.trim();
}

export function applyWhatsAppWebTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let out = template;
  for (const [key, val] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'gi'), val);
  }
  return out;
}

export function formatDisplayDate(isoDate: string, locale = 'es-MX'): string {
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return isoDate;
  }
}

/** Fecha local (YYYY-MM-DD) desplazada `offsetDays` días respecto a `base`. */
export function getRelativeLocalDateString(offsetDays: number, base: Date = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTomorrowLocalDateString(base: Date = new Date()): string {
  return getRelativeLocalDateString(1, base);
}

export function phonePlaceholderForCountry(countryCode: string): string {
  const cc = resolveTenantCountryCode(countryCode);
  if (cc === 'MX') return '5512345678';
  if (cc === 'ES') return '612345678';
  if (cc === 'US') return '5551234567';
  return `+${getDialCode(cc)}...`;
}

export function formatPhoneDisplay(phone: string, countryCode: string = DEFAULT_TENANT_COUNTRY): string {
  const e164 = normalizePhoneE164(phone, countryCode);
  return e164 ?? phone;
}

/** Dígitos para wa.me (sin +). */
export function normalizePhoneForWaMe(
  phone: string | null | undefined,
  countryCode: string = DEFAULT_TENANT_COUNTRY
): string | null {
  if (!phone?.trim()) return null;
  const e164 = normalizePhoneE164(phone, countryCode);
  if (e164) return e164.replace(/\D/g, '');
  const digits = normalizePhoneDigits(phone);
  return digits.length >= 8 ? digits : null;
}

export function buildWaMeUrl(waPhoneDigits: string, message: string): string {
  const text = encodeURIComponent(message);
  return `https://wa.me/${waPhoneDigits}?text=${text}`;
}

export type CampaignWebRecipient = {
  patientId: string;
  name: string;
  phone: string;
  waPhone: string;
};

export function parseCampaignFilterJson(filterJson: string): { clinicOnly: boolean } {
  try {
    const parsed = JSON.parse(filterJson) as { clinicOnly?: boolean };
    return { clinicOnly: parsed.clinicOnly !== false };
  } catch {
    return { clinicOnly: true };
  }
}

export function filterCampaignWebRecipients(
  patients: Patient[],
  opts: { clinicOnly: boolean; userClinicId?: string; defaultCountry: string }
): CampaignWebRecipient[] {
  return patients
    .filter((p) => {
      if (!p.phone?.trim()) return false;
      if (opts.clinicOnly && opts.userClinicId && p.clinicId !== opts.userClinicId) return false;
      return true;
    })
    .map((p) => {
      const waPhone = normalizePhoneForWaMe(p.phone, opts.defaultCountry);
      return {
        patientId: p.id,
        name: `${p.firstName} ${p.lastName}`.trim(),
        phone: p.phone,
        waPhone: waPhone ?? '',
      };
    })
    .filter((r) => !!r.waPhone);
}

export function applyCampaignWebMessage(template: string, recipient: CampaignWebRecipient): string {
  const parts = recipient.name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? recipient.name;
  const lastName = parts.slice(1).join(' ');
  return template
    .replace(/\{\{nombre_completo\}\}/gi, recipient.name)
    .replace(/\{\{nombre\}\}/gi, firstName)
    .replace(/\{\{apellido\}\}/gi, lastName)
    .replace(/\{\{telefono\}\}/gi, recipient.phone)
    .replace(/\{\{name\}\}/gi, recipient.name)
    .replace(/\{\{phone\}\}/gi, recipient.phone);
}
