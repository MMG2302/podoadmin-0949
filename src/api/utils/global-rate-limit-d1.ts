import { database } from '../database';
import { rateLimitAttempts } from '../database/schema';
import { eq } from 'drizzle-orm';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

/**
 * Ventana fija en D1: cuenta peticiones por `identifier` en ventanas de `windowMs`.
 * Reutiliza `rate_limit_attempts` con prefijos `win:*` para no colisionar con login (email:ip).
 */
export async function checkAndRecordWindowLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number = FIFTEEN_MIN_MS
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const now = Date.now();

  try {
    const existing = await database
      .select()
      .from(rateLimitAttempts)
      .where(eq(rateLimitAttempts.identifier, identifier))
      .limit(1)
      .then((rows) => rows[0]);

    const isoNow = new Date().toISOString();

    if (!existing) {
      await database.insert(rateLimitAttempts).values({
        identifier,
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blockedUntil: null,
        createdAt: isoNow,
        updatedAt: isoNow,
      });
      return { allowed: true };
    }

    if (now - existing.firstAttempt > windowMs) {
      await database
        .update(rateLimitAttempts)
        .set({
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
          blockedUntil: null,
          updatedAt: isoNow,
        })
        .where(eq(rateLimitAttempts.identifier, identifier));
      return { allowed: true };
    }

    if (existing.count >= maxRequests) {
      const retryAfterMs = existing.firstAttempt + windowMs - now;
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    await database
      .update(rateLimitAttempts)
      .set({
        count: existing.count + 1,
        lastAttempt: now,
        updatedAt: isoNow,
      })
      .where(eq(rateLimitAttempts.identifier, identifier));

    return { allowed: true };
  } catch (e) {
    console.error('[global-rate-limit] D1 error, allowing request:', e);
    return { allowed: true };
  }
}

export const GLOBAL_LIMITS = {
  windowMs: FIFTEEN_MIN_MS,
  generalMax: 100,
  authStrictMax: 5,
  sensitiveMax: 10,
} as const;
