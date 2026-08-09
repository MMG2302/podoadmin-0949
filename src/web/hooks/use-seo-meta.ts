import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * SEO por ruta: `robots` y `canonical`.
 *
 * index.html es un shell único para toda la SPA, así que su `<head>` describe la landing.
 * Este hook corrige los dos valores que sí dependen de la ruta una vez que React monta.
 */

const SITE_URL = "https://podoraa.com";

/**
 * Rutas indexables. El resto de la app queda con `noindex, nofollow`.
 *
 * Va en paralelo al `Disallow` de robots.txt (ver `scripts/seo.ts`): robots.txt evita el
 * rastreo, pero una URL bloqueada todavía puede aparecer en Google si alguien la enlaza
 * desde fuera. El meta noindex es lo que garantiza que no se indexe.
 */
const INDEXABLE = new Set(["/", "/landing", "/faq", "/terms", "/privacy"]);

/** `/landing` es la misma página que `/`; se consolida en la raíz. */
const CANONICAL_ALIAS: Record<string, string> = { "/landing": "/" };

const INDEX_CONTENT = "index, follow, max-image-preview:large, max-snippet:-1";
const NOINDEX_CONTENT = "noindex, nofollow";

/** Normaliza `/terms/` → `/terms` para que el trailing slash no rompa la comparación. */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function upsertMeta(name: string, content: string): void {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(href: string): void {
  let tag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = href;
}

export function useSeoMeta(): void {
  const [location] = useLocation();

  useEffect(() => {
    const path = normalize(location);
    const indexable = INDEXABLE.has(path);

    upsertMeta("robots", indexable ? INDEX_CONTENT : NOINDEX_CONTENT);

    // En una ruta no indexable el canonical sobra; se deja apuntando a la raíz para no
    // dejar en el head el de la página anterior.
    const canonicalPath = indexable ? (CANONICAL_ALIAS[path] ?? path) : "/";
    setCanonical(canonicalPath === "/" ? `${SITE_URL}/` : `${SITE_URL}${canonicalPath}`);
  }, [location]);
}
