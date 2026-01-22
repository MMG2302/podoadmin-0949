import { database } from '../database';
import { rateLimitAttempts } from '../database/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

/**
 * Rate limiting con persistencia en D1
 * Reemplaza el almacenamiento en memoria por base de datos
 */

interface FailedAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const LIMITS = {
  DELAY_3_ATTEMPTS: 3,
  DELAY_5_ATTEMPTS: 5,
  BLOCK_10_ATTEMPTS: 10,
  DELAY_5_SECONDS: 5 * 1000,
  DELAY_30_SECONDS: 30 * 1000,
  BLOCK_15_MINUTES: 15 * 60 * 1000,
  RESET_WINDOW: 60 * 60 * 1000, // 1 hora
};

/**
 * Registra un intento fallido en D1
 */
export async function recordFailedAttemptD1(identifier: string): Promise<FailedAttempt> {
  const now = Date.now();
  
  try {
    // Buscar intento existente
    const existing = await database
      .select()
      .from(rateLimitAttempts)
      .where(eq(rateLimitAttempts.identifier, identifier))
      .limit(1)
      .then(rows => rows[0]);

    if (!existing) {
      // Primer intento fallido
      const newAttempt = {
        identifier,
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blockedUntil: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.insert(rateLimitAttempts).values(newAttempt);

      return {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
    }

    // Si ha pasado la ventana de tiempo, resetear
    if (now - existing.firstAttempt > LIMITS.RESET_WINDOW) {
      await database
        .update(rateLimitAttempts)
        .set({
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          blockedUntil: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(rateLimitAttempts.identifier, identifier));

      return {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
    }

    // Incrementar contador
    const newCount = existing.count + 1;
    const blockedUntil = newCount >= LIMITS.BLOCK_10_ATTEMPTS
      ? now + LIMITS.BLOCK_15_MINUTES
      : existing.blockedUntil;

    await database
      .update(rateLimitAttempts)
      .set({
        count: newCount,
        lastAttempt: now,
        blockedUntil: blockedUntil || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(rateLimitAttempts.identifier, identifier));

    return {
      count: newCount,
      firstAttempt: existing.firstAttempt,
      lastAttempt: now,
      blockedUntil: blockedUntil || undefined,
    };
  } catch (error) {
    console.error('Error registrando intento fallido en D1:', error);
    // Fallback a comportamiento básico
    return {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    };
  }
}

/**
 * Limpia los intentos fallidos (cuando el login es exitoso)
 */
export async function clearFailedAttemptsD1(identifier: string): Promise<void> {
  try {
    await database
      .delete(rateLimitAttempts)
      .where(eq(rateLimitAttempts.identifier, identifier));
  } catch (error) {
    console.error('Error limpiando intentos fallidos en D1:', error);
  }
}

/**
 * Obtiene el estado actual de intentos fallidos desde D1
 */
export async function getFailedAttemptsD1(identifier: string): Promise<FailedAttempt | null> {
  try {
    const attempt = await database
      .select()
      .from(rateLimitAttempts)
      .where(eq(rateLimitAttempts.identifier, identifier))
      .limit(1)
      .then(rows => rows[0]);

    if (!attempt) {
      return null;
    }

    const now = Date.now();

    // Si ha pasado la ventana de tiempo, limpiar
    if (now - attempt.firstAttempt > LIMITS.RESET_WINDOW) {
      await clearFailedAttemptsD1(identifier);
      return null;
    }

    // Si el bloqueo ha expirado, limpiar el bloqueo pero mantener el contador
    if (attempt.blockedUntil && now > attempt.blockedUntil) {
      await database
        .update(rateLimitAttempts)
        .set({
          blockedUntil: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(rateLimitAttempts.identifier, identifier));

      return {
        count: attempt.count,
        firstAttempt: attempt.firstAttempt,
        lastAttempt: attempt.lastAttempt,
      };
    }

    return {
      count: attempt.count,
      firstAttempt: attempt.firstAttempt,
      lastAttempt: attempt.lastAttempt,
      blockedUntil: attempt.blockedUntil || undefined,
    };
  } catch (error) {
    console.error('Error obteniendo intentos fallidos de D1:', error);
    return null;
  }
}

/**
 * Verifica si el usuario puede intentar login (usando D1)
 */
export async function checkRateLimitD1(identifier: string): Promise<{
  allowed: boolean;
  delay?: number;
  blockedUntil?: number;
}> {
  const attempt = await getFailedAttemptsD1(identifier);

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
 * Calcula el delay requerido basado en el número de intentos fallidos
 */
function calculateDelay(attempt: FailedAttempt): number {
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

  return 0;
}

/**
 * Obtiene el número de intentos fallidos
 */
export async function getFailedAttemptCountD1(identifier: string): Promise<number> {
  const attempt = await getFailedAttemptsD1(identifier);
  return attempt?.count || 0;
}

/**
 * Limpia intentos antiguos (limpieza periódica)
 */
export async function cleanupOldAttemptsD1(): Promise<void> {
  try {
    const now = Date.now();
    const cutoffTime = now - LIMITS.RESET_WINDOW;

    await database
      .delete(rateLimitAttempts)
      .where(
        and(
          lt(rateLimitAttempts.firstAttempt, cutoffTime),
          // Solo eliminar si no está bloqueado o el bloqueo expiró
          // (esto se maneja mejor con una query más compleja, simplificado aquí)
        )
      );
  } catch (error) {
    console.error('Error limpiando intentos antiguos en D1:', error);
  }
}
