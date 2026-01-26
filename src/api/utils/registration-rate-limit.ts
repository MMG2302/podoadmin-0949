import { database } from '../database';
import { registrationRateLimit } from '../database/schema';
import { eq, lt } from 'drizzle-orm';

/**
 * Rate limiting específico para registro público
 * Sistema progresivo:
 * - Nivel 1: 10 registros en 10 minutos
 * - Nivel 2: 5 registros en 30 minutos (después de alcanzar nivel 1)
 * - Nivel 3: 3 registros en 1 hora (después de alcanzar nivel 2)
 * Bloqueo: 24 horas después de 5 intentos fallidos
 */

const LEVEL_1_LIMIT = 10;
const LEVEL_1_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

const LEVEL_2_LIMIT = 5;
const LEVEL_2_WINDOW_MS = 30 * 60 * 1000; // 30 minutos

const LEVEL_3_LIMIT = 3;
const LEVEL_3_WINDOW_MS = 60 * 60 * 1000; // 1 hora

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Verifica si una IP puede registrar
 * Sistema progresivo con tres niveles
 */
export async function checkRegistrationRateLimit(
  ipAddress: string
): Promise<{ allowed: boolean; delay?: number; blockedUntil?: number; reason?: string }> {
  const now = Date.now();
  const identifier = ipAddress;

  try {
    const result = await database
      .select()
      .from(registrationRateLimit)
      .where(eq(registrationRateLimit.identifier, identifier))
      .limit(1);

    if (result.length === 0) {
      // Primera vez, permitir
      return { allowed: true };
    }

    const record = result[0];

    // Verificar si está bloqueado por intentos fallidos
    if (record.blockedUntil && record.blockedUntil > now) {
      return {
        allowed: false,
        blockedUntil: record.blockedUntil,
        reason: 'IP bloqueada por múltiples intentos fallidos',
      };
    }

    // Si el bloqueo expiró, resetear
    if (record.blockedUntil && record.blockedUntil <= now) {
      await database
        .delete(registrationRateLimit)
        .where(eq(registrationRateLimit.identifier, identifier));
      return { allowed: true };
    }

    const timeSinceFirstAttempt = now - record.firstAttempt;

    // Nivel 1: Verificar límite de 10 registros en 10 minutos
    if (timeSinceFirstAttempt <= LEVEL_1_WINDOW_MS) {
      if (record.count >= LEVEL_1_LIMIT) {
        const timeUntilReset = LEVEL_1_WINDOW_MS - timeSinceFirstAttempt;
        return {
          allowed: false,
          delay: timeUntilReset,
          reason: `Máximo ${LEVEL_1_LIMIT} registros en ${LEVEL_1_WINDOW_MS / 60000} minutos. Espera ${Math.ceil(timeUntilReset / 60000)} minutos.`,
        };
      }
      // Dentro del nivel 1 y no ha alcanzado el límite
      return { allowed: true };
    }

    // Nivel 2: Verificar límite de 5 registros en 30 minutos
    if (timeSinceFirstAttempt <= LEVEL_2_WINDOW_MS) {
      if (record.count >= LEVEL_2_LIMIT) {
        const timeUntilReset = LEVEL_2_WINDOW_MS - timeSinceFirstAttempt;
        return {
          allowed: false,
          delay: timeUntilReset,
          reason: `Máximo ${LEVEL_2_LIMIT} registros en ${LEVEL_2_WINDOW_MS / 60000} minutos. Espera ${Math.ceil(timeUntilReset / 60000)} minutos.`,
        };
      }
      // Dentro del nivel 2 y no ha alcanzado el límite
      return { allowed: true };
    }

    // Nivel 3: Verificar límite de 3 registros en 1 hora
    if (timeSinceFirstAttempt <= LEVEL_3_WINDOW_MS) {
      if (record.count >= LEVEL_3_LIMIT) {
        const timeUntilReset = LEVEL_3_WINDOW_MS - timeSinceFirstAttempt;
        return {
          allowed: false,
          delay: timeUntilReset,
          reason: `Máximo ${LEVEL_3_LIMIT} registros por hora. Espera ${Math.ceil(timeUntilReset / 60000)} minutos.`,
        };
      }
      // Dentro del nivel 3 y no ha alcanzado el límite
      return { allowed: true };
    }

    // Ventana expirada (más de 1 hora), resetear
    await database
      .delete(registrationRateLimit)
      .where(eq(registrationRateLimit.identifier, identifier));
    return { allowed: true };
  } catch (error) {
    console.error('Error verificando rate limit de registro:', error);
    // En caso de error, permitir para no bloquear usuarios legítimos
    return { allowed: true };
  }
}

/**
 * Registra un intento de registro exitoso
 * El sistema progresivo mantiene el contador mientras esté dentro de alguna ventana
 */
export async function recordSuccessfulRegistration(
  ipAddress: string
): Promise<void> {
  const now = Date.now();
  const identifier = ipAddress;
  const nowISO = new Date().toISOString();

  try {
    const result = await database
      .select()
      .from(registrationRateLimit)
      .where(eq(registrationRateLimit.identifier, identifier))
      .limit(1);

    if (result.length === 0) {
      // Primera vez
      await database.insert(registrationRateLimit).values({
        identifier,
        count: 1, // Contador de registros exitosos
        failedCount: 0, // Contador de fallos (separado)
        firstAttempt: now,
        lastAttempt: now,
        blockedUntil: null,
        createdAt: nowISO,
        updatedAt: nowISO,
      });
    } else {
      const record = result[0];
      const timeSinceFirstAttempt = now - record.firstAttempt;

      // Si todas las ventanas expiraron (más de 1 hora), resetear
      if (timeSinceFirstAttempt > LEVEL_3_WINDOW_MS) {
        await database
          .update(registrationRateLimit)
          .set({
            count: 1,
            failedCount: 0, // Resetear también el contador de fallos
            firstAttempt: now,
            lastAttempt: now,
            updatedAt: nowISO,
          })
          .where(eq(registrationRateLimit.identifier, identifier));
      } else {
        // Incrementar contador de éxitos (dentro de alguna ventana)
        // NO modificar failedCount aquí (solo se modifica en recordFailedRegistration)
        await database
          .update(registrationRateLimit)
          .set({
            count: record.count + 1,
            lastAttempt: now,
            updatedAt: nowISO,
          })
          .where(eq(registrationRateLimit.identifier, identifier));
      }
    }
  } catch (error) {
    console.error('Error registrando registro exitoso:', error);
  }
}

/**
 * Registra un intento de registro fallido
 * Solo cuenta como fallido si es un error real (no errores de validación de usuario)
 */
export async function recordFailedRegistration(
  ipAddress: string,
  isRealFailure: boolean = true // Si es false, no cuenta como fallido real (ej: errores de validación)
): Promise<void> {
  const now = Date.now();
  const identifier = ipAddress;
  const nowISO = new Date().toISOString();

  try {
    // Si no es un fallo real (ej: error de validación del usuario), no contar
    if (!isRealFailure) {
      return;
    }

    const result = await database
      .select()
      .from(registrationRateLimit)
      .where(eq(registrationRateLimit.identifier, identifier))
      .limit(1);

    if (result.length === 0) {
      // Primera vez
      await database.insert(registrationRateLimit).values({
        identifier,
        count: 0, // Contador de registros exitosos (no se modifica aquí)
        failedCount: 1, // Primer intento fallido
        firstAttempt: now,
        lastAttempt: now,
        blockedUntil: null,
        createdAt: nowISO,
        updatedAt: nowISO,
      });
    } else {
      const record = result[0];
      
      // Si ya está bloqueado, no hacer nada más
      if (record.blockedUntil && record.blockedUntil > now) {
        return;
      }
      
      // Resetear contador de fallidos si pasó mucho tiempo (más de 1 hora)
      const timeSinceFirstAttempt = now - record.firstAttempt;
      // Usar failedCount del record, o 0 si no existe (compatibilidad con registros antiguos)
      // TypeScript puede no reconocer el campo aún, así que usamos type assertion
      const recordWithFailedCount = record as typeof record & { failedCount?: number };
      let failedCount = recordWithFailedCount.failedCount ?? 0;
      
      if (timeSinceFirstAttempt > LEVEL_3_WINDOW_MS) {
        // Resetear contador después de 1 hora
        failedCount = 0;
      }

      // Si hay 5 o más intentos fallidos, bloquear
      if (failedCount >= MAX_FAILED_ATTEMPTS - 1) {
        await database
          .update(registrationRateLimit)
          .set({
            blockedUntil: now + BLOCK_DURATION_MS,
            failedCount: 0, // Resetear contador de fallidos después de bloquear
            lastAttempt: now,
            updatedAt: nowISO,
          })
          .where(eq(registrationRateLimit.identifier, identifier));
      } else {
        await database
          .update(registrationRateLimit)
          .set({
            failedCount: failedCount + 1, // Incrementar contador de fallidos (NO count)
            lastAttempt: now,
            updatedAt: nowISO,
          })
          .where(eq(registrationRateLimit.identifier, identifier));
      }
    }
  } catch (error) {
    console.error('Error registrando registro fallido:', error);
  }
}

/**
 * Limpia el bloqueo de una IP (útil para desarrollo/testing)
 */
export async function clearIPBlock(ipAddress: string): Promise<void> {
  const identifier = ipAddress;
  
  try {
    await database
      .delete(registrationRateLimit)
      .where(eq(registrationRateLimit.identifier, identifier));
  } catch (error) {
    console.error('Error limpiando bloqueo de IP:', error);
  }
}
