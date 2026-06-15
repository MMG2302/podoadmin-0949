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
    // Producción: fail-closed para no abrir endpoints costosos si D1 falla
    if (process.env.NODE_ENV === 'production') {
      return { allowed: false, retryAfterSeconds: 60 };
    }
    return { allowed: true };
  }
}

function parsePositiveInt(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
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

/** Límites globales por IP (toda la API). Ajustables vía env para despliegue masivo. */
export const GLOBAL_RATE_LIMITS = {
  anonReadPerMinute: parsePositiveInt('RATE_LIMIT_ANON_READ_PER_MIN', 180),
  anonWritePerMinute: parsePositiveInt('RATE_LIMIT_ANON_WRITE_PER_MIN', 90),
  authReadPerMinute: parsePositiveInt('RATE_LIMIT_AUTH_READ_PER_MIN', 600),
  authWritePerMinute: parsePositiveInt('RATE_LIMIT_AUTH_WRITE_PER_MIN', 300),
  /** Ráfaga corta anti-DDoS: solicitudes por IP en 10 s */
  burstPer10Seconds: parsePositiveInt('RATE_LIMIT_BURST_PER_10S', 80),
} as const;

/** Límites agregados por clínica (tenant) o por usuario sin clínica. */
export const TENANT_RATE_LIMITS = {
  readPerMinute: parsePositiveInt('RATE_LIMIT_TENANT_READ_PER_MIN', 2000),
  writePerMinute: parsePositiveInt('RATE_LIMIT_TENANT_WRITE_PER_MIN', 800),
} as const;

export const ONE_MINUTE_MS = 60 * 1000;
export const TEN_SECONDS_MS = 10 * 1000;

export async function checkGlobalBurstRateLimit(clientIP: string): Promise<ActionRateLimitResult> {
  return checkAndRecordActionRateLimit(
    'global_burst',
    clientIP,
    GLOBAL_RATE_LIMITS.burstPer10Seconds,
    TEN_SECONDS_MS
  );
}

export async function checkGlobalIPRateLimit(
  clientIP: string,
  tier: 'anon_read' | 'anon_write' | 'auth_read' | 'auth_write'
): Promise<ActionRateLimitResult> {
  const limits: Record<typeof tier, number> = {
    anon_read: GLOBAL_RATE_LIMITS.anonReadPerMinute,
    anon_write: GLOBAL_RATE_LIMITS.anonWritePerMinute,
    auth_read: GLOBAL_RATE_LIMITS.authReadPerMinute,
    auth_write: GLOBAL_RATE_LIMITS.authWritePerMinute,
  };
  return checkAndRecordActionRateLimit(`global_${tier}`, clientIP, limits[tier], ONE_MINUTE_MS);
}

export async function checkTenantRateLimit(
  tenantKey: string,
  tier: 'read' | 'write'
): Promise<ActionRateLimitResult> {
  const limit =
    tier === 'write' ? TENANT_RATE_LIMITS.writePerMinute : TENANT_RATE_LIMITS.readPerMinute;
  return checkAndRecordActionRateLimit(`tenant_${tier}`, tenantKey, limit, ONE_MINUTE_MS);
}

export function buildTenantRateLimitKey(clinicId?: string | null, userId?: string): string {
  if (clinicId) return `clinic:${clinicId}`;
  return `user:${userId ?? 'unknown'}`;
}

export async function checkMessagesRateLimit(userId: string): Promise<ActionRateLimitResult> {
  return checkAndRecordActionRateLimit('msg', userId, ACTION_LIMITS.messagesPerMinute, ONE_MINUTE_MS);
}

export async function checkLogoUploadRateLimit(userId: string): Promise<ActionRateLimitResult> {
  return checkAndRecordActionRateLimit('logo', userId, ACTION_LIMITS.logosPerMinute, ONE_MINUTE_MS);
}

export async function checkSessionCreateRateLimit(userId: string): Promise<ActionRateLimitResult> {
  return checkAndRecordActionRateLimit('session', userId, ACTION_LIMITS.sessionsPerMinute, ONE_MINUTE_MS);
}
