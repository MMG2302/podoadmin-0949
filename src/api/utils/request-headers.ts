/**
 * Parsing robusto de headers HTTP
 * Sanitiza y valida headers que pueden ser influenciados por el cliente o usados en logs/respuestas.
 * Evita header injection, newlines y caracteres de control.
 */

const MAX_HEADER_VALUE_LENGTH = 2048;
const CONTROL_AND_NEWLINE = /[\x00-\x1f\x7f\r\n]/g;

/** Headers que se suelen leer del request y que conviene sanitizar al usarlos en logs o respuestas */
export const HEADERS_TO_SANITIZE = [
  'referer',
  'referrer',
  'user-agent',
  'origin',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'cookie',
  'authorization',
] as const;

export type HeaderKeyToSanitize = (typeof HEADERS_TO_SANITIZE)[number];

/**
 * Sanitiza un valor de header: elimina caracteres de control y newlines, limita longitud.
 */
export function sanitizeHeaderValue(value: string | null | undefined): string {
  if (value == null) return '';
  const s = String(value)
    .replace(CONTROL_AND_NEWLINE, '')
    .trim();
  return s.slice(0, MAX_HEADER_VALUE_LENGTH);
}

/**
 * Parsea y sanitiza un conjunto de headers del request.
 * Devuelve un objeto con solo los headers permitidos y sus valores sanitizados.
 */
export function parseAndSanitizeHeaders(
  headers: Headers,
  keys: readonly string[] = HEADERS_TO_SANITIZE
): Record<string, string> {
  const out: Record<string, string> = {};
  const lowerKeys = new Set(keys.map((k) => k.toLowerCase()));
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lowerKeys.has(lower)) {
      const sanitized = sanitizeHeaderValue(value);
      if (sanitized) out[lower] = sanitized;
    }
  });
  return out;
}

/**
 * Obtiene un header sanitizado (para usar en logs o respuestas seguras).
 */
export function getSanitizedHeader(headers: Headers, name: string): string {
  const value = headers.get(name);
  return sanitizeHeaderValue(value);
}

/**
 * Obtiene User-Agent de forma segura para logs/audit.
 * Usa safeHeaders (del middleware) si está disponible; si no, el header crudo sanitizado.
 */
export function getSafeUserAgent(c: {
  get: (key: string) => unknown;
  req: { header: (name: string) => string | undefined };
}): string | undefined {
  const safe = c.get('safeHeaders') as Record<string, string> | undefined;
  if (safe?.user_agent) return safe.user_agent;
  const raw = c.req.header('User-Agent');
  return raw ? sanitizeHeaderValue(raw) : undefined;
}
