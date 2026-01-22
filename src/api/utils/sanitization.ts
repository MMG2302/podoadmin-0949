/**
 * Utilidades para sanitización y escapado de datos
 * Protección contra XSS y inyección de código
 */

/**
 * Escapa caracteres HTML especiales para prevenir XSS
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  
  return String(unsafe)
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
  
  const trimmed = String(input).trim();
  
  if (rejectXss && containsXssPayload(trimmed)) {
    return null; // Rechazar si contiene XSS
  }
  
  return escapeHtml(trimmed);
}
