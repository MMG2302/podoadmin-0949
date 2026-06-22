export const TENANT_COUNTRY_CODES = [
  'MX',
  'ES',
  'AR',
  'CO',
  'CL',
  'PE',
  'US',
  'GT',
  'CR',
  'PA',
  'EC',
  'UY',
  'PY',
  'BO',
  'VE',
  'DO',
  'HN',
  'NI',
  'SV',
  'PR',
] as const;

export type TenantCountryCode = (typeof TENANT_COUNTRY_CODES)[number];

export const DEFAULT_TENANT_COUNTRY: TenantCountryCode = 'MX';

const DIAL_CODES: Record<TenantCountryCode, string> = {
  MX: '52',
  ES: '34',
  AR: '54',
  CO: '57',
  CL: '56',
  PE: '51',
  US: '1',
  GT: '502',
  CR: '506',
  PA: '507',
  EC: '593',
  UY: '598',
  PY: '595',
  BO: '591',
  VE: '58',
  DO: '1',
  HN: '504',
  NI: '505',
  SV: '503',
  PR: '1',
};

export function isTenantCountryCode(code: string): code is TenantCountryCode {
  return (TENANT_COUNTRY_CODES as readonly string[]).includes(code);
}

export function resolveTenantCountryCode(code: string | null | undefined): TenantCountryCode {
  const upper = String(code ?? '').trim().toUpperCase();
  if (upper && isTenantCountryCode(upper)) return upper;
  return DEFAULT_TENANT_COUNTRY;
}

export function getDialCode(countryCode: string): string {
  const code = resolveTenantCountryCode(countryCode);
  return DIAL_CODES[code];
}

export function normalizePhoneDigits(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '');
}

/** Normaliza a E.164 (+...) o null si no es válido. */
export function normalizePhoneE164(
  raw: string,
  countryCode: string = DEFAULT_TENANT_COUNTRY
): string | null {
  const digits = normalizePhoneDigits(raw);
  if (!digits) return null;

  if (raw.trim().startsWith('+')) {
    return digits.length >= 8 ? `+${digits}` : null;
  }

  const cc = resolveTenantCountryCode(countryCode);
  const dial = DIAL_CODES[cc];

  if (cc === 'MX' && digits.length === 10) {
    return `+52${digits}`;
  }
  if (cc === 'US' || cc === 'DO' || cc === 'PR') {
    const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (national.length === 10) return `+1${national}`;
  }
  if (digits.startsWith(dial) && digits.length > dial.length + 6) {
    return `+${digits}`;
  }

  const combined = `${dial}${digits}`;
  return combined.length >= 10 ? `+${combined}` : null;
}

export function countryLabel(code: TenantCountryCode): string {
  const labels: Record<TenantCountryCode, string> = {
    MX: 'México',
    ES: 'España',
    AR: 'Argentina',
    CO: 'Colombia',
    CL: 'Chile',
    PE: 'Perú',
    US: 'Estados Unidos',
    GT: 'Guatemala',
    CR: 'Costa Rica',
    PA: 'Panamá',
    EC: 'Ecuador',
    UY: 'Uruguay',
    PY: 'Paraguay',
    BO: 'Bolivia',
    VE: 'Venezuela',
    DO: 'Rep. Dominicana',
    HN: 'Honduras',
    NI: 'Nicaragua',
    SV: 'El Salvador',
    PR: 'Puerto Rico',
  };
  return labels[code] ?? code;
}
