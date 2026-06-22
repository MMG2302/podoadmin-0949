const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

export function parsePaginationQuery(query: { limit?: string; offset?: string }) {
  let limit = DEFAULT_LIMIT;
  if (query.limit !== undefined && query.limit !== '') {
    const n = Number.parseInt(query.limit, 10);
    if (!Number.isNaN(n) && n > 0) limit = Math.min(n, MAX_LIMIT);
  }

  let offset = 0;
  if (query.offset !== undefined && query.offset !== '') {
    const n = Number.parseInt(query.offset, 10);
    if (!Number.isNaN(n) && n >= 0) offset = n;
  }

  return { limit, offset };
}

export function buildPaginationMeta(
  pagination: { limit: number; offset: number },
  rowCount: number
) {
  return {
    limit: pagination.limit,
    offset: pagination.offset,
    hasMore: rowCount >= pagination.limit,
  };
}
