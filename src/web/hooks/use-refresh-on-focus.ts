import { useEffect, useCallback, useRef } from "react";

/**
 * Ejecuta una función de refresco cuando el usuario vuelve a la pestaña del navegador.
 * Útil para mantener los datos actualizados sin necesidad de recargar la página manualmente.
 */
export function useRefreshOnFocus(refreshFn: () => void | Promise<void>) {
  const refreshFnRef = useRef(refreshFn);
  refreshFnRef.current = refreshFn;

  const stableRefresh = useCallback(() => {
    void refreshFnRef.current();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        stableRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [stableRefresh]);
}
