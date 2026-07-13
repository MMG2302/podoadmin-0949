import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/auth-context";

function needsAuthenticatedFetch(src: string): boolean {
  const trimmed = src.trim();
  if (trimmed.startsWith("data:") || /^https?:\/\//i.test(trimmed)) return false;
  return trimmed.startsWith("/api/");
}

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 400;

/**
 * Resuelve URLs de /api/media/* para <img src>.
 * Usa la URL directa (permitida por CSP img-src 'self') en lugar de blob:,
 * que está bloqueado por la política de seguridad del documento.
 */
export function useAuthenticatedImageSrc(src: string | null | undefined): {
  resolvedSrc: string | null;
  failed: boolean;
  loading: boolean;
  onError: () => void;
  onLoad: () => void;
} {
  const { user, isLoading: authLoading } = useAuth();
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const sessionReady = !authLoading || !!user;

  useEffect(() => {
    setRetry(0);
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const resolvedSrc = useMemo(() => {
    if (!src?.trim() || !sessionReady) return null;
    const trimmed = src.trim();
    if (!needsAuthenticatedFetch(trimmed)) return trimmed;
    if (failed) return null;
    if (retry === 0) return trimmed;
    const sep = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${sep}_retry=${retry}`;
  }, [src, sessionReady, retry, failed]);

  const onError = useCallback(() => {
    setLoaded(false);
    if (retry < MAX_RETRIES - 1) {
      const next = retry + 1;
      window.setTimeout(() => setRetry(next), RETRY_DELAY_MS * next);
      return;
    }
    setFailed(true);
  }, [retry]);

  const onLoad = useCallback(() => {
    setLoaded(true);
    setFailed(false);
  }, []);

  const loading = Boolean(
    src?.trim() && sessionReady && !failed && !loaded && resolvedSrc
  );

  return { resolvedSrc, failed, loading, onError, onLoad };
}

/** Compatibilidad con logout (ya no hay caché blob). */
export function clearAuthenticatedImageCache() {
  /* no-op */
}
