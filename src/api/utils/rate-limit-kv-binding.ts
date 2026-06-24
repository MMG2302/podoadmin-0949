import { env } from 'cloudflare:workers';

type RateLimitEnv = { RATE_LIMIT_KV?: KVNamespace };

/** Binding KV de rate limit (undefined si no está configurado). */
export function getRateLimitKv(): KVNamespace | null {
  return (env as RateLimitEnv).RATE_LIMIT_KV ?? null;
}
