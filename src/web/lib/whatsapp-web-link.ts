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
  'Hola {{nombre}}, le recordamos su cita el {{fecha}} a las {{hora}}. {{nota}}';

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

export function getTomorrowLocalDateString(base: Date = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
