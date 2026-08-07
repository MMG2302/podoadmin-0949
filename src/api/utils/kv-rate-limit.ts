export interface ActionRateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  /**
   * El almacén de contadores no estuvo disponible y no se pudo decidir. Quien llama
   * debe recurrir a otro mecanismo; nunca se traduce en un bloqueo por sí solo.
   */
  degraded?: boolean;
}

export interface KvRateLimitWindow {
  count: number;
  windowStart: number;
}

const KV_PREFIX = 'rl:';

export function buildKvRateLimitKey(action: string, identifier: string): string {
  return `${KV_PREFIX}${action}:${identifier}`;
}

/**
 * Rate limit en ventana fija usando KV.
 * Consistencia eventual: bajo ráfagas extremas puede permitir ligeramente más del límite,
 * pero evita 2–4 escrituras D1 por request en el middleware global/tenant.
 */
export async function checkKvWindowRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowMs: number
): Promise<ActionRateLimitResult> {
  const now = Date.now();
  // Cloudflare KV exige expirationTtl >= 60. La ventana real la controla windowStart
  // (guardado en el valor), así que un TTL mayor solo retrasa la eviction del registro.
  // Con TTL < 60 el put lanza 400 → en producción el catch fail-closed bloquearía TODA la API.
  const ttlSeconds = Math.max(60, Math.ceil(windowMs / 1000) + 1);

  try {
    const existing = await kv.get<KvRateLimitWindow>(key, 'json');
    const window = existing ?? null;

    if (!window || now - window.windowStart >= windowMs) {
      await kv.put(key, JSON.stringify({ count: 1, windowStart: now } satisfies KvRateLimitWindow), {
        expirationTtl: ttlSeconds,
      });
      return { allowed: true };
    }

    if (window.count >= limit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - window.windowStart)) / 1000));
      return { allowed: false, retryAfterSeconds };
    }

    await kv.put(
      key,
      JSON.stringify({ count: window.count + 1, windowStart: window.windowStart } satisfies KvRateLimitWindow),
      { expirationTtl: ttlSeconds }
    );
    return { allowed: true };
  } catch (err) {
    // Fallar cerrado aquí tumba TODA la API: en plan gratuito KV admite ~1000
    // escrituras diarias y cada petición escribe un contador, así que al agotarse la
    // cuota `put` lanza y se rechazaría hasta un GET. Se señala como degradado para
    // que quien llama recurra al contador en D1; un limitador caído nunca debe
    // convertirse en una caída del servicio.
    console.error('Error en KV rate limit (se degrada a D1):', err);
    return { allowed: true, degraded: true };
  }
}
