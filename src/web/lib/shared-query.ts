type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
  fetchedAt?: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export type FetchSharedOptions = {
  /** Tiempo en ms durante el cual los datos se consideran frescos. Default: 30_000 */
  staleTime?: number;
  /** Si true, reutiliza la promise en vuelo para la misma clave. Default: true */
  dedupe?: boolean;
  /** Si true, fuerza un nuevo fetch ignorando caché. */
  force?: boolean;
};

export function invalidateShared(key: string): void {
  cache.delete(key);
}

export function invalidateSharedPrefix(prefix: string): void {
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}

export async function fetchShared<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: FetchSharedOptions = {}
): Promise<T> {
  const staleTime = options.staleTime ?? 30_000;
  const dedupe = options.dedupe !== false;
  const force = options.force === true;

  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!force && entry?.data !== undefined && entry.fetchedAt && Date.now() - entry.fetchedAt < staleTime) {
    return entry.data;
  }

  if (!force && dedupe && entry?.promise) {
    return entry.promise;
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, fetchedAt: Date.now() });
      return data;
    })
    .catch((err) => {
      cache.delete(key);
      throw err;
    });

  cache.set(key, { ...entry, promise });
  return promise;
}
