import { database } from '../database';
import { rateLimitAttempts } from '../database/schema';
import { eq } from 'drizzle-orm';

/**
 * Rate limit por acción (mensajes, subida de logos, creación de sesiones).
 * Evita abuso económico: N solicitudes por ventana de tiempo por identificador.
 * Usa la misma tabla rate_limit_attempts con prefijo "act:" para no colisionar con login (email:ip).
 */

const PREFIX = 'act:';

function key(action: string, identifier: string): string {
  return PREFIX + action + ':' + identifier;
}

export interface ActionRateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Comprueba si la acción está permitida y, si sí, registra la solicitud.
 * Si no está permitida, devuelve { allowed: false, retryAfterSeconds }.
 *
 * @param action Nombre de la acción: "msg", "logo", "session"
 * @param identifier Usuario o IP (ej. userId para mensajes/logos/sesiones)
 * @param limit Máximo de solicitudes por ventana
 * @param windowMs Ventana en milisegundos (ej. 60_000 = 1 minuto)
 */
export async function checkAndRecordActionRateLimit(
  action: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<ActionRateLimitResult> {
  const now = Date.now();
  const id = key(action, identifier);
  const nowIso = new Date().toISOString();

  try {
    const rows = await database
      .select()
      .from(rateLimitAttempts)
      .where(eq(rateLimitAttempts.identifier, id))
      .limit(1);

    const row = rows[0];

    if (!row) {
      await database.insert(rateLimitAttempts).values({
        identifier: id,
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blockedUntil: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      return { allowed: true };
    }

    const elapsed = now - row.firstAttempt;

    if (elapsed >= windowMs) {
      // Ventana expirada: reiniciar
      await database
        .update(rateLimitAttempts)
        .set({
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          updatedAt: nowIso,
        })
        .where(eq(rateLimitAttempts.identifier, id));
      return { allowed: true };
    }

    if (row.count >= limit) {
      const retryAfterSeconds = Math.ceil((windowMs - elapsed) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    await database
      .update(rateLimitAttempts)
      .set({
        count: row.count + 1,
        lastAttempt: now,
        updatedAt: nowIso,
      })
      .where(eq(rateLimitAttempts.identifier, id));

    return { allowed: true };
  } catch (err) {
    console.error('Error en action rate limit:', err);
    return { allowed: true };
  }
}

/** Límites por defecto (abuso económico). */
export const ACTION_LIMITS = {
  /** Mensajes super_admin: 20 por minuto por usuario */
  messagesPerMinute: 20,
  /** Subida de logos: 10 por minuto por usuario */
  logosPerMinute: 10,
  /** Creación de sesiones clínicas: 30 por minuto por usuario */
  sessionsPerMinute: 30,
} as const;

const ONE_MINUTE_MS = 60 * 1000;

export async function checkMessagesRateLimit(userId: string): Promise<ActionRateLimitResult> {
  return checkAndRecordActionRateLimit('msg', userId, ACTION_LIMITS.messagesPerMinute, ONE_MINUTE_MS);
}

export async function checkLogoUploadRateLimit(userId: string): Promise<ActionRateLimitResult> {
  return checkAndRecordActionRateLimit('logo', userId, ACTION_LIMITS.logosPerMinute, ONE_MINUTE_MS);
}

export async function checkSessionCreateRateLimit(userId: string): Promise<ActionRateLimitResult> {
  return checkAndRecordActionRateLimit('session', userId, ACTION_LIMITS.sessionsPerMinute, ONE_MINUTE_MS);
}
