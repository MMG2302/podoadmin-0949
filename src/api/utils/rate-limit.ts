/**
 * Sistema de rate limiting progresivo para intentos de login fallidos
 * 
 * Límites progresivos:
 * - 3 intentos fallidos → retardo de 5 segundos
 * - 5 intentos fallidos → retardo de 30 segundos
 * - 10 intentos fallidos → bloqueo temporal de 15 minutos
 * 
 * Tracking por email e IP para mayor seguridad
 */

interface FailedAttempt {
  count: number;
  firstAttempt: number; // Timestamp del primer intento
  lastAttempt: number; // Timestamp del último intento
  blockedUntil?: number; // Timestamp hasta cuando está bloqueado
}

// Almacenamiento en memoria (en producción, usar Redis o base de datos)
const failedAttempts = new Map<string, FailedAttempt>();

// Configuración de límites
const LIMITS = {
  DELAY_3_ATTEMPTS: 3, // Después de 3 intentos
  DELAY_5_ATTEMPTS: 5, // Después de 5 intentos
  BLOCK_10_ATTEMPTS: 10, // Después de 10 intentos
  
  DELAY_5_SECONDS: 5 * 1000, // 5 segundos en milisegundos
  DELAY_30_SECONDS: 30 * 1000, // 30 segundos en milisegundos
  BLOCK_15_MINUTES: 15 * 60 * 1000, // 15 minutos en milisegundos
  
  RESET_WINDOW: 60 * 60 * 1000, // Ventana de 1 hora para resetear contador
};

/**
 * Registra un intento fallido de login
 */
export function recordFailedAttempt(identifier: string): FailedAttempt {
  const now = Date.now();
  const existing = failedAttempts.get(identifier);

  if (!existing) {
    // Primer intento fallido
    const newAttempt: FailedAttempt = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
    failedAttempts.set(identifier, newAttempt);
    return newAttempt;
  }

  // Si ha pasado la ventana de tiempo, resetear
  if (now - existing.firstAttempt > LIMITS.RESET_WINDOW) {
    const resetAttempt: FailedAttempt = {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
    failedAttempts.set(identifier, resetAttempt);
    return resetAttempt;
  }

  // Incrementar contador
  existing.count += 1;
  existing.lastAttempt = now;

  // Si alcanza 10 intentos, bloquear por 15 minutos
  if (existing.count >= LIMITS.BLOCK_10_ATTEMPTS && !existing.blockedUntil) {
    existing.blockedUntil = now + LIMITS.BLOCK_15_MINUTES;
  }

  failedAttempts.set(identifier, existing);
  return existing;
}

/**
 * Limpia los intentos fallidos (cuando el login es exitoso)
 */
export function clearFailedAttempts(identifier: string): void {
  failedAttempts.delete(identifier);
}

/**
 * Obtiene el estado actual de intentos fallidos
 */
export function getFailedAttempts(identifier: string): FailedAttempt | null {
  const attempt = failedAttempts.get(identifier);
  
  if (!attempt) {
    return null;
  }

  const now = Date.now();

  // Si ha pasado la ventana de tiempo, limpiar
  if (now - attempt.firstAttempt > LIMITS.RESET_WINDOW) {
    failedAttempts.delete(identifier);
    return null;
  }

  // Si el bloqueo ha expirado, limpiar el bloqueo pero mantener el contador
  if (attempt.blockedUntil && now > attempt.blockedUntil) {
    attempt.blockedUntil = undefined;
    failedAttempts.set(identifier, attempt);
  }

  return attempt;
}

/**
 * Calcula el delay requerido basado en el número de intentos fallidos
 */
export function calculateDelay(attempt: FailedAttempt): number {
  const now = Date.now();

  // Si está bloqueado, calcular tiempo restante
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    return attempt.blockedUntil - now;
  }

  // Calcular delay basado en número de intentos
  if (attempt.count >= LIMITS.BLOCK_10_ATTEMPTS) {
    return LIMITS.BLOCK_15_MINUTES;
  } else if (attempt.count >= LIMITS.DELAY_5_ATTEMPTS) {
    return LIMITS.DELAY_30_SECONDS;
  } else if (attempt.count >= LIMITS.DELAY_3_ATTEMPTS) {
    return LIMITS.DELAY_5_SECONDS;
  }

  return 0; // Sin delay
}

/**
 * Verifica si el usuario puede intentar login
 * Retorna null si puede intentar, o el delay requerido en milisegundos
 */
export function checkRateLimit(identifier: string): { allowed: boolean; delay?: number; blockedUntil?: number } {
  const attempt = getFailedAttempts(identifier);

  if (!attempt) {
    return { allowed: true };
  }

  const now = Date.now();

  // Si está bloqueado
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    return {
      allowed: false,
      delay: attempt.blockedUntil - now,
      blockedUntil: attempt.blockedUntil,
    };
  }

  // Calcular delay requerido
  const delay = calculateDelay(attempt);

  if (delay > 0) {
    return {
      allowed: false,
      delay,
    };
  }

  return { allowed: true };
}

/**
 * Obtiene el número de intentos fallidos
 */
export function getFailedAttemptCount(identifier: string): number {
  const attempt = getFailedAttempts(identifier);
  return attempt?.count || 0;
}

/**
 * Limpia intentos antiguos (limpieza periódica)
 */
export function cleanupOldAttempts(): void {
  const now = Date.now();
  const toDelete: string[] = [];

  for (const [identifier, attempt] of failedAttempts.entries()) {
    // Si ha pasado la ventana de tiempo y no está bloqueado
    if (
      now - attempt.firstAttempt > LIMITS.RESET_WINDOW &&
      (!attempt.blockedUntil || now > attempt.blockedUntil)
    ) {
      toDelete.push(identifier);
    }
  }

  toDelete.forEach((id) => failedAttempts.delete(id));
}

// Limpiar intentos antiguos cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldAttempts, LIMITS.RESET_WINDOW);
}
