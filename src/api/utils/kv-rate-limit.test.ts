import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildKvRateLimitKey,
  checkKvWindowRateLimit,
  type KvRateLimitWindow,
} from './kv-rate-limit';

function createMockKv(): KVNamespace {
  const store = new Map<string, string>();

  return {
    get: vi.fn(async (key: string, type?: string) => {
      const raw = store.get(key);
      if (!raw) return null;
      if (type === 'json') return JSON.parse(raw) as KvRateLimitWindow;
      return raw;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(),
    getWithMetadata: vi.fn(),
  } as unknown as KVNamespace;
}

describe('buildKvRateLimitKey', () => {
  it('prefija acción e identificador', () => {
    expect(buildKvRateLimitKey('global_burst', '1.2.3.4')).toBe('rl:global_burst:1.2.3.4');
  });
});

describe('checkKvWindowRateLimit', () => {
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKv();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-23T12:00:00Z'));
  });

  it('permite hasta el límite dentro de la ventana', async () => {
    const key = 'rl:test:user1';
    const r1 = await checkKvWindowRateLimit(kv, key, 3, 60_000);
    const r2 = await checkKvWindowRateLimit(kv, key, 3, 60_000);
    const r3 = await checkKvWindowRateLimit(kv, key, 3, 60_000);
    const r4 = await checkKvWindowRateLimit(kv, key, 3, 60_000);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('reinicia la ventana tras expirar', async () => {
    const key = 'rl:test:user2';
    await checkKvWindowRateLimit(kv, key, 1, 10_000);
    const blocked = await checkKvWindowRateLimit(kv, key, 1, 10_000);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(11_000);
    const afterWindow = await checkKvWindowRateLimit(kv, key, 1, 10_000);
    expect(afterWindow.allowed).toBe(true);
  });
});
