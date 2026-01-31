/**
 * Utilidades para sanitización y escapado de datos
 * Protección contra XSS, inyección de código y URLs ofuscadas (phishing)
 *
 * Pipeline único: normalizar (trim, longitud) → escapar/sanitizar
 */

const DEFAULT_MAX_LENGTH = 10_000;
const MAX_URL_LENGTH = 2048;

export interface NormalizeOptions {
  maxLength?: number;
  trim?: boolean;
  lowerCase?: boolean;
}

/**
 * Normaliza un string: trim, límite de longitud, opcionalmente lowercase.
 * Todo input debe pasar por aquí antes de escape/sanitize (pipeline único).
 */
export function normalizeString(
  input: string | null | undefined,
  options: NormalizeOptions = {}
): string {
  if (input == null) return '';
  const { maxLength = DEFAULT_MAX_LENGTH, trim = true, lowerCase = false } = options;
  let s = String(input);
  if (trim) s = s.trim();
  if (lowerCase) s = s.toLowerCase();
  return s.slice(0, maxLength);
}

/**
 * Escapa caracteres HTML especiales para prevenir XSS
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  const s = normalizeString(unsafe, { maxLength: DEFAULT_MAX_LENGTH, trim: true });
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapa un objeto completo recursivamente
 */
export function escapeHtmlObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return escapeHtml(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => escapeHtmlObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const escaped: any = {};
    for (const [key, value] of Object.entries(obj)) {
      escaped[key] = escapeHtmlObject(value);
    }
    return escaped as T;
  }

  return obj;
}

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  return String(input)
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers (onclick=, onerror=, etc.)
    .slice(0, 10000); // Limitar longitud
}

/**
 * Valida y sanitiza un email
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  
  const sanitized = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Valida y sanitiza un número
 */
export function sanitizeNumber(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }
  
  const num = Number(input);
  return isNaN(num) ? null : num;
}

/**
 * Sanitiza un objeto de entrada para prevenir XSS
 * Escapa strings pero preserva la estructura del objeto
 */
export function sanitizeInput<T extends Record<string, any>>(input: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      sanitized[key] = escapeHtml(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? escapeHtml(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Valida que un string no contenga payloads XSS comunes
 */
export function containsXssPayload(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick=, onerror=, etc.
    /<iframe/gi,
    /<img[^>]*onerror/gi,
    /<svg[^>]*onload/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\(/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Valida y sanitiza un string, rechazando si contiene XSS
 */
export function validateAndSanitizeString(
  input: string | null | undefined,
  rejectXss: boolean = true
): string | null {
  if (!input) return null;
  const trimmed = normalizeString(input);
  if (rejectXss && containsXssPayload(trimmed)) return null;
  return escapeHtml(trimmed);
}

// ---------------------------------------------------------------------------
// URLs ofuscadas (anti-phishing): hxxp, base64, redirecciones, [.] etc.
// ---------------------------------------------------------------------------

const OBFUSCATION_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /hxxps/gi, replacement: 'https' },
  { pattern: /hxxp/gi, replacement: 'http' },
  { pattern: /h\*\*p/gi, replacement: 'http' },
  { pattern: /\[\.\]/g, replacement: '.' },
  { pattern: /\(dot\)/gi, replacement: '.' },
  { pattern: /\[dot\]/gi, replacement: '.' },
];

/**
 * Desofusca una URL típica de phishing (hxxp, [.], base64, etc.)
 * Devuelve la URL normalizada o null si no parece una URL válida tras desofuscar.
 */
export function decodeObfuscatedUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  let s = normalizeString(input, { maxLength: MAX_URL_LENGTH, trim: true });
  if (!s) return null;

  // Intentar desofuscar patrones comunes
  for (const { pattern, replacement } of OBFUSCATION_PATTERNS) {
    s = s.replace(pattern, replacement);
  }

  // Base64: detectar data: URLs o strings que parecen base64 URL
  const base64UrlMatch = s.match(/^data:text\/html(?:;charset=[^;]+)?;base64,(.+)$/i);
  if (base64UrlMatch) {
    try {
      const decoded = atob(base64UrlMatch[1].trim());
      const urlInDecoded = decoded.match(/https?:\/\/[^\s"'<>]+/);
      if (urlInDecoded) return urlInDecoded[0];
    } catch {
      // No es base64 válido
    }
  }
  const plainBase64 = /^[A-Za-z0-9+/]+=*$/.test(s) && s.length >= 20 && s.length <= 500;
  if (plainBase64) {
    try {
      const decoded = atob(s);
      if (/^https?:\/\//i.test(decoded)) return decodeObfuscatedUrl(decoded) || decoded;
    } catch {
      // ignorar
    }
  }

  // ¿Resultado parece URL?
  if (/^https?:\/\/[^\s]+$/i.test(s)) return s.slice(0, MAX_URL_LENGTH);
  return null;
}

/**
 * Indica si el texto contiene una URL ofuscada o sospechosa (phishing).
 */
export function containsObfuscatedOrSuspiciousUrl(input: string | null | undefined): boolean {
  if (!input) return false;
  const s = String(input);
  if (/hxxp/i.test(s) || /h\*\*p/i.test(s)) return true;
  if (/\[\.\]|\[dot\]|\(dot\)/i.test(s)) return true;
  if (/data:text\/html\s*;\s*base64\s*,/i.test(s)) return true;
  if (/^[A-Za-z0-9+/]+=*$/.test(s) && s.length >= 20) return true; // posible base64 URL
  return false;
}

/**
 * Sanitiza un campo que se espera sea URL: desofusca y valida.
 * Devuelve la URL limpia (solo http/https) o null si es sospechosa/inválida.
 */
export function sanitizeUrlField(input: string | null | undefined): string | null {
  if (!input) return null;
  const decoded = decodeObfuscatedUrl(input);
  if (!decoded) return null;
  if (!/^https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9](?::[0-9]+)?(\/.*)?$/i.test(decoded)) return null;
  return decoded.slice(0, MAX_URL_LENGTH);
}

/** Caracteres no permitidos en path params (evitar inyección / log forging) */
const PATH_PARAM_DANGEROUS = /[\x00-\x1f\x7f\r\n<>"']/;

/**
 * Sanitiza un path param (id, slug, etc.): normaliza y rechaza si contiene caracteres peligrosos.
 * Uso: en rutas que reciben :id o :userId, validar con esto antes de usar en DB o logs.
 */
export function sanitizePathParam(
  input: string | null | undefined,
  maxLength: number = 256
): string | null {
  if (input == null) return null;
  const s = normalizeString(input, { maxLength, trim: true });
  if (!s || PATH_PARAM_DANGEROUS.test(s)) return null;
  return s;
}

/** Dominios/patrones típicos de acortadores o redirecciones (para marcar como sospechosos) */
const REDIRECT_SHORTENER_PATTERNS = [
  /^https?:\/\/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|adf\.ly|j\.mp)\//i,
  /\/redirect\//i,
  /\/go\?url=/i,
  /url=https?%3A/i,
];

/**
 * Indica si la URL parece ser un acortador o redirección (útil para marcar phishing).
 */
export function looksLikeRedirectOrShortener(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const s = decodeObfuscatedUrl(url) || url;
  return REDIRECT_SHORTENER_PATTERNS.some((p) => p.test(s));
}
