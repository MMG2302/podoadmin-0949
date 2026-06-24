import { resolveSystemAccess, type SystemAccessResult } from './access-control';
import { getRateLimitKv } from './rate-limit-kv-binding';
import { database } from '../database';
import { createdUsers } from '../database/schema';
import { eq } from 'drizzle-orm';

const ACCESS_CACHE_TTL_MS = parsePositiveInt('ACCESS_CACHE_TTL_MS', 60_000);
const ACCESS_KV_PREFIX = 'acc:';
const accessCache = new Map<string, { at: number; result: SystemAccessResult }>();

function parsePositiveInt(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function cacheKey(userId: string, role: string): string {
  return `${userId}:${role}`;
}

function kvKey(userId: string, role: string): string {
  return `${ACCESS_KV_PREFIX}${userId}:${role}`;
}

async function readAccessFromKv(userId: string, role: string): Promise<SystemAccessResult | null> {
  const kv = getRateLimitKv();
  if (!kv) return null;
  try {
    const entry = await kv.get<{ at: number; result: SystemAccessResult }>(kvKey(userId, role), 'json');
    if (!entry || Date.now() - entry.at >= ACCESS_CACHE_TTL_MS) return null;
    return entry.result;
  } catch {
    return null;
  }
}

async function writeAccessToKv(userId: string, role: string, result: SystemAccessResult): Promise<void> {
  const kv = getRateLimitKv();
  if (!kv) return;
  const ttlSeconds = Math.max(1, Math.ceil(ACCESS_CACHE_TTL_MS / 1000));
  try {
    await kv.put(
      kvKey(userId, role),
      JSON.stringify({ at: Date.now(), result }),
      { expirationTtl: ttlSeconds }
    );
  } catch {
    // Caché best-effort; D1 sigue siendo fuente de verdad
  }
}

export async function resolveSystemAccessCached(
  userId: string,
  role: string
): Promise<SystemAccessResult> {
  const key = cacheKey(userId, role);
  const now = Date.now();
  const cached = accessCache.get(key);
  if (cached && now - cached.at < ACCESS_CACHE_TTL_MS) {
    return cached.result;
  }

  const fromKv = await readAccessFromKv(userId, role);
  if (fromKv) {
    accessCache.set(key, { at: now, result: fromKv });
    return fromKv;
  }

  const result = await resolveSystemAccess(userId, role);
  accessCache.set(key, { at: now, result });
  await writeAccessToKv(userId, role, result);
  return result;
}

export async function invalidateSystemAccessCache(userId: string, role?: string): Promise<void> {
  const kv = getRateLimitKv();
  if (role) {
    accessCache.delete(cacheKey(userId, role));
    if (kv) await kv.delete(kvKey(userId, role));
    return;
  }
  for (const key of accessCache.keys()) {
    if (key.startsWith(`${userId}:`)) accessCache.delete(key);
  }
  // Sin kv.list(): en Miniflare puede colgar el worker; las entradas KV expiran por TTL.
}

/** Tras cambio de suscripción Stripe: invalida caché de acceso del sujeto de facturación. */
export async function invalidateBillingSubjectAccessCache(
  subjectType: 'clinic' | 'user',
  subjectId: string
): Promise<void> {
  if (subjectType === 'user') {
    await invalidateSystemAccessCache(subjectId, 'podiatrist');
    return;
  }
  const members = await database
    .select({ userId: createdUsers.userId, role: createdUsers.role })
    .from(createdUsers)
    .where(eq(createdUsers.clinicId, subjectId));
  for (const member of members) {
    await invalidateSystemAccessCache(member.userId, member.role);
  }
}
