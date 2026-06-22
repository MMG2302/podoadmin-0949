import { resolveSystemAccess, type SystemAccessResult } from './access-control';

const ACCESS_CACHE_TTL_MS = 30_000;
const accessCache = new Map<string, { at: number; result: SystemAccessResult }>();

export async function resolveSystemAccessCached(
  userId: string,
  role: string
): Promise<SystemAccessResult> {
  const key = `${userId}:${role}`;
  const cached = accessCache.get(key);
  const now = Date.now();
  if (cached && now - cached.at < ACCESS_CACHE_TTL_MS) {
    return cached.result;
  }
  const result = await resolveSystemAccess(userId, role);
  accessCache.set(key, { at: now, result });
  return result;
}

export function invalidateSystemAccessCache(userId: string, role?: string): void {
  if (role) {
    accessCache.delete(`${userId}:${role}`);
    return;
  }
  for (const key of accessCache.keys()) {
    if (key.startsWith(`${userId}:`)) accessCache.delete(key);
  }
}
