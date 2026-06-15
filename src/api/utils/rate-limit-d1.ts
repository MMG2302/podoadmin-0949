import { database } from '../database';
import { rateLimitAttempts } from '../database/schema';
import { eq, lt, like } from 'drizzle-orm';
import { createLoginIPRateLimitIdentifier } from './ip-tracking';

/**
 * Rate limiting con persistencia en D1 (login progresivo email:IP + tope por IP)
 */

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

function unavailableRateLimitResult(): { allowed: false; delay: number; retryAfterSeconds: number } {
  return { allowed: false, delay: 60_000, retryAfterSeconds: 60 };
}

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

/** Tope agregado de intentos fallidos de login por IP (cualquier email) */
export const LOGIN_IP_LIMITS = {
  MAX_FAILED_ATTEMPTS: 50,
  WINDOW_MS: 60 * 60 * 1000,
} as const;

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
 * Limpia todos los intentos fallidos asociados a un email (p. ej. tras recuperar contraseña).
 * El identificador tiene formato "email:ip", así que se borran todos los que empiezan con "email:".
 */
export async function clearFailedAttemptsByEmailD1(email: string): Promise<void> {
  try {
    const emailLower = email.toLowerCase().trim();
    const prefix = `${emailLower}:`;
    await database
      .delete(rateLimitAttempts)
      .where(like(rateLimitAttempts.identifier, `${prefix}%`));
  } catch (error) {
    console.error('Error limpiando intentos fallidos por email en D1:', error);
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
    throw error;
  }
}

/**
 * Verifica límite agregado de login por IP (solo lectura, no incrementa).
 * Protege contra fuerza bruta distribuida probando muchos emails desde la misma IP.
 */
export async function checkLoginIPRateLimitD1(ipAddress: string): Promise<{
  allowed: boolean;
  delay?: number;
  retryAfterSeconds?: number;
}> {
  if (!ipAddress || ipAddress === 'unknown') {
    return { allowed: true };
  }

  const identifier = createLoginIPRateLimitIdentifier(ipAddress);
  const now = Date.now();

  try {
    const row = await database
      .select()
      .from(rateLimitAttempts)
      .where(eq(rateLimitAttempts.identifier, identifier))
      .limit(1)
      .then((rows) => rows[0]);

    if (!row) {
      return { allowed: true };
    }

    const elapsed = now - row.firstAttempt;
    if (elapsed >= LOGIN_IP_LIMITS.WINDOW_MS) {
      return { allowed: true };
    }

    if (row.count >= LOGIN_IP_LIMITS.MAX_FAILED_ATTEMPTS) {
      const delay = LOGIN_IP_LIMITS.WINDOW_MS - elapsed;
      return {
        allowed: false,
        delay,
        retryAfterSeconds: Math.ceil(delay / 1000),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error verificando rate limit de login por IP:', error);
    if (isProductionEnv()) {
      return unavailableRateLimitResult();
    }
    return { allowed: true };
  }
}

/**
 * Registra un intento fallido de login agregado por IP.
 */
export async function recordLoginIPFailedAttemptD1(ipAddress: string): Promise<void> {
  if (!ipAddress || ipAddress === 'unknown') {
    return;
  }

  const identifier = createLoginIPRateLimitIdentifier(ipAddress);
  const now = Date.now();
  const nowIso = new Date().toISOString();

  try {
    const row = await database
      .select()
      .from(rateLimitAttempts)
      .where(eq(rateLimitAttempts.identifier, identifier))
      .limit(1)
      .then((rows) => rows[0]);

    if (!row) {
      await database.insert(rateLimitAttempts).values({
        identifier,
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blockedUntil: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      return;
    }

    const elapsed = now - row.firstAttempt;
    if (elapsed >= LOGIN_IP_LIMITS.WINDOW_MS) {
      await database
        .update(rateLimitAttempts)
        .set({
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          blockedUntil: null,
          updatedAt: nowIso,
        })
        .where(eq(rateLimitAttempts.identifier, identifier));
      return;
    }

    await database
      .update(rateLimitAttempts)
      .set({
        count: row.count + 1,
        lastAttempt: now,
        updatedAt: nowIso,
      })
      .where(eq(rateLimitAttempts.identifier, identifier));
  } catch (error) {
    console.error('Error registrando intento fallido de login por IP:', error);
  }
}

/**
 * Verifica si el usuario puede intentar login (usando D1)
 * - Bloqueo (10 intentos): no permite hasta blockedUntil
 * - Retardo (3 o 5 intentos): permite si ha pasado el tiempo desde lastAttempt
 */
export async function checkRateLimitD1(identifier: string): Promise<{
  allowed: boolean;
  delay?: number;
  blockedUntil?: number;
  retryAfterSeconds?: number;
}> {
  try {
    const attempt = await getFailedAttemptsD1(identifier);

    if (!attempt) {
      return { allowed: true };
    }

    const now = Date.now();

    if (attempt.blockedUntil && now < attempt.blockedUntil) {
      const delay = attempt.blockedUntil - now;
      return {
        allowed: false,
        delay,
        blockedUntil: attempt.blockedUntil,
        retryAfterSeconds: Math.ceil(delay / 1000),
      };
    }

    const requiredDelayMs = getRequiredDelayMs(attempt);
    if (requiredDelayMs > 0) {
      const elapsedSinceLastAttempt = now - attempt.lastAttempt;
      if (elapsedSinceLastAttempt >= requiredDelayMs) {
        return { allowed: true };
      }
      const remainingMs = requiredDelayMs - elapsedSinceLastAttempt;
      return {
        allowed: false,
        delay: remainingMs,
        retryAfterSeconds: Math.ceil(remainingMs / 1000),
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error verificando rate limit D1:', error);
    if (isProductionEnv()) {
      return unavailableRateLimitResult();
    }
    return { allowed: true };
  }
}

/** Obtiene el delay requerido en ms según el número de intentos (sin bloqueo) */
function getRequiredDelayMs(attempt: FailedAttempt): number {
  if (attempt.blockedUntil) return 0; // Ya manejado arriba
  if (attempt.count >= LIMITS.BLOCK_10_ATTEMPTS) return LIMITS.BLOCK_15_MINUTES;
  if (attempt.count >= LIMITS.DELAY_5_ATTEMPTS) return LIMITS.DELAY_30_SECONDS;
  if (attempt.count >= LIMITS.DELAY_3_ATTEMPTS) return LIMITS.DELAY_5_SECONDS;
  return 0;
}

/**
 * Obtiene el número de intentos fallidos
 */
export async function getFailedAttemptCountD1(identifier: string): Promise<number> {
  try {
    const attempt = await getFailedAttemptsD1(identifier);
    return attempt?.count || 0;
  } catch (error) {
    console.error('Error obteniendo conteo de intentos fallidos:', error);
    return 0;
  }
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
      .where(lt(rateLimitAttempts.firstAttempt, cutoffTime));
  } catch (error) {
    console.error('Error limpiando intentos antiguos en D1:', error);
  }
}
