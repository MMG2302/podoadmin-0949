/**
 * Comprobación anti-phishing del origen en las pantallas de credenciales.
 *
 * El objetivo es detectar que la página se sirve desde un dominio que NO es el
 * nuestro (typosquatting: podorra.com, podoraa-login.com, etc.). El apex y su
 * variante `www` son el mismo sitio —los sirve el mismo Worker con el mismo
 * certificado—, así que tratarlos como distintos produce una falsa alarma, y una
 * alerta de seguridad que salta sin motivo enseña al usuario a ignorarla.
 *
 * Solo se acepta añadir o quitar el prefijo `www.` del host oficial. Cualquier
 * otro dominio, subdominio o esquema sigue considerándose no oficial.
 */

/** Hosts equivalentes al oficial: él mismo y su par con/sin `www.`. */
function equivalentHosts(officialHost: string): string[] {
  const bare = officialHost.startsWith("www.") ? officialHost.slice(4) : officialHost;
  return [bare, `www.${bare}`];
}

/**
 * `true` si `currentOrigin` NO corresponde al dominio oficial.
 * Si no hay dominio oficial configurado o alguno es inválido, no se alerta:
 * más vale no avisar que avisar en falso.
 */
export function isOriginMismatch(
  officialDomain: string | null | undefined,
  currentOrigin: string = window.location.origin
): boolean {
  if (!officialDomain) return false;
  try {
    const official = new URL(officialDomain);
    const current = new URL(currentOrigin);
    if (current.protocol !== official.protocol) return true;
    return !equivalentHosts(official.host).includes(current.host);
  } catch {
    return false;
  }
}
