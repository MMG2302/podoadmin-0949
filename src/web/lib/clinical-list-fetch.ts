import { api } from './api-client';

type PaginationMeta = { hasMore?: boolean; limit?: number; offset?: number };

export async function fetchAllClinicalPages<T>(
  path: string,
  listKey: string,
  errorMessage: () => string
): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  const limit = 200;

  for (;;) {
    const query = `?limit=${limit}&offset=${offset}`;
    const res = await api.get<{ success?: boolean; pagination?: PaginationMeta } & Record<string, unknown>>(
      `${path}${query}`
    );
    if (!res.success) {
      throw new Error(res.error || errorMessage());
    }
    const page = res.data?.[listKey];
    if (!Array.isArray(page)) break;
    items.push(...(page as T[]));
    const pagination = res.data?.pagination;
    if (!pagination?.hasMore || page.length === 0) break;
    offset += page.length;
  }

  return items;
}
