/**
 * Utilidades para validación de dominios de email
 * Bloquea dominios temporales/descartables
 */

// Lista de dominios de email temporales/descartables comunes
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  '20minutemail.com',
  '33mail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'throwaway.email',
  'yopmail.com',
  'getnada.com',
  'mohmal.com',
  'fakeinbox.com',
  'temp-mail.org',
  'trashmail.com',
  'mintemail.com',
  'sharklasers.com',
  'spamgourmet.com',
  'emailondeck.com',
  'meltmail.com',
  'maildrop.cc',
  'getairmail.com',
];

/**
 * Verifica si un dominio de email está bloqueado
 */
export function isEmailDomainBlocked(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;

  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Obtiene lista de dominios permitidos desde variables de entorno (opcional)
 */
export function getAllowedEmailDomains(): string[] {
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS;
  if (!allowedDomains) return [];

  return allowedDomains.split(',').map((d) => d.trim().toLowerCase());
}

/**
 * Verifica si un email está en la lista de dominios permitidos
 */
export function isEmailDomainAllowed(email: string): boolean {
  const allowedDomains = getAllowedEmailDomains();
  if (allowedDomains.length === 0) return true; // Si no hay restricción, permitir todos

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  return allowedDomains.includes(domain);
}

/**
 * Valida un email considerando restricciones de dominio
 */
export function validateEmailDomain(email: string): {
  valid: boolean;
  error?: string;
} {
  // Verificar si está bloqueado (dominios temporales)
  if (isEmailDomainBlocked(email)) {
    return {
      valid: false,
      error: 'No se permiten direcciones de email temporales',
    };
  }

  // Verificar si está en lista de permitidos (si existe restricción)
  if (!isEmailDomainAllowed(email)) {
    return {
      valid: false,
      error: 'Dominio de email no permitido',
    };
  }

  return { valid: true };
}
