import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api-client';
import { registerClinicalListInvalidator } from '../lib/clinical-list-cache';
import { useLanguage } from '../contexts/language-context';

type PaginationMeta = { hasMore?: boolean; limit?: number; offset?: number };

const DEFAULT_PAGE_SIZE = 50;
const FETCH_TIMEOUT_MS = 25_000;

function buildQueryString(
  filters: Record<string, string | undefined>,
  limit: number,
  offset: number
): string {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  return `?${params.toString()}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

export function useClinicalListPage<T>(config: {
  path: string;
  listKey: string;
  pageSize?: number;
  filters?: Record<string, string | undefined>;
  enabled?: boolean;
  errorMessage?: string;
}) {
  const { t } = useLanguage();
  const {
    path,
    listKey,
    pageSize = DEFAULT_PAGE_SIZE,
    filters = {},
    enabled = true,
    errorMessage = t.clinicalList.loadFailed,
  } = config;
  const timeoutMessage = t.clinicalList.requestTimeout;

  const [items, setItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const generationRef = useRef(0);
  const filtersKey = JSON.stringify(filters);

  const fetchPage = useCallback(
    async (reset: boolean) => {
      if (!enabled) {
        setItems([]);
        setHasMore(false);
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const generation = ++generationRef.current;
      const parsedFilters = JSON.parse(filtersKey) as Record<string, string | undefined>;
      const offset = reset ? 0 : offsetRef.current;

      if (reset) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const query = buildQueryString(parsedFilters, pageSize, offset);
        const res = await withTimeout(
          api.get<{
            success?: boolean;
            pagination?: PaginationMeta;
            error?: string;
          } & Record<string, unknown>>(`${path}${query}`),
          FETCH_TIMEOUT_MS,
          timeoutMessage
        );

        if (generation !== generationRef.current) return;

        if (!res.success) {
          throw new Error(res.error || errorMessage);
        }

        const page = res.data?.[listKey];
        if (!Array.isArray(page)) {
          throw new Error(errorMessage);
        }

        const pagination = res.data?.pagination;
        const nextHasMore = Boolean(pagination?.hasMore);
        const nextOffset = offset + page.length;

        setItems((prev) => (reset ? (page as T[]) : [...prev, ...(page as T[])]));
        setHasMore(nextHasMore);
        offsetRef.current = nextOffset;
      } catch (err) {
        if (generation !== generationRef.current) return;
        setError(err instanceof Error ? err.message : errorMessage);
        if (reset) {
          setItems([]);
          setHasMore(false);
        }
      } finally {
        if (generation === generationRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [enabled, path, listKey, pageSize, filtersKey, errorMessage, timeoutMessage]
  );

  const reload = useCallback(() => {
    offsetRef.current = 0;
    void fetchPage(true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    void fetchPage(false);
  }, [fetchPage, hasMore, isLoadingMore, isLoading]);

  useEffect(() => {
    offsetRef.current = 0;
    void fetchPage(true);
  }, [fetchPage]);

  useEffect(() => {
    return registerClinicalListInvalidator(reload);
  }, [reload]);

  return { items, hasMore, isLoading, isLoadingMore, error, reload, loadMore };
}
