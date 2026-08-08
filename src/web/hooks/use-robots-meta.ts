import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Rutas indexables. El resto de la app queda con `noindex, nofollow`.
 *
 * Va en paralelo al `Disallow` de robots.txt (ver `scripts/seo.ts`): robots.txt evita el
 * rastreo, pero una URL bloqueada todavía puede aparecer en Google si alguien la enlaza
 * desde fuera. El meta noindex es lo que garantiza que no se indexe.
 */
const INDEXABLE = new Set(["/", "/landing", "/terms", "/privacy"]);

const INDEX_CONTENT = "index, follow, max-image-preview:large, max-snippet:-1";
const NOINDEX_CONTENT = "noindex, nofollow";

/** Normaliza `/terms/` → `/terms` para que el trailing slash no rompa la comparación. */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

export function useRobotsMeta(): void {
  const [location] = useLocation();

  useEffect(() => {
    const indexable = INDEXABLE.has(normalize(location));

    let tag = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "robots";
      document.head.appendChild(tag);
    }
    tag.content = indexable ? INDEX_CONTENT : NOINDEX_CONTENT;
  }, [location]);
}
