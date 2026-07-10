import { useEffect, useCallback, useRef } from "react";

const DEFAULT_THROTTLE_MS = 30_000;
const lastRefreshAt = new Map<() => void | Promise<void>, number>();

export type UseRefreshOnFocusOptions = {
  /** Mínimo tiempo entre refrescos al volver a la pestaña. Default: 30_000 */
  throttleMs?: number;
  /** Si false, no escucha visibilitychange. */
  enabled?: boolean;
};

/**
 * Ejecuta una función de refresco cuando el usuario vuelve a la pestaña del navegador.
 * Incluye throttle para evitar ráfagas de peticiones junto con polling.
 */
export function useRefreshOnFocus(
  refreshFn: () => void | Promise<void>,
  options: UseRefreshOnFocusOptions = {}
) {
  const refreshFnRef = useRef(refreshFn);
  refreshFnRef.current = refreshFn;
  const throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS;
  const enabled = options.enabled !== false;

  const stableRefresh = useCallback(() => {
    const fn = refreshFnRef.current;
    const now = Date.now();
    const last = lastRefreshAt.get(fn) ?? 0;
    if (now - last < throttleMs) return;
    lastRefreshAt.set(fn, now);
    void fn();
  }, [throttleMs]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        stableRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [stableRefresh, enabled]);
}
