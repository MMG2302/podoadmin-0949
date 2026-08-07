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

/** `true` si `origin` coincide con `reference` admitiendo la variante con/sin `www.`. */
function matches(reference: string, current: URL): boolean {
  try {
    const ref = new URL(reference);
    if (current.protocol !== ref.protocol) return false;
    return equivalentHosts(ref.host).includes(current.host);
  } catch {
    return false;
  }
}

/**
 * `true` si `currentOrigin` NO corresponde a ninguno de nuestros orígenes.
 *
 * Se aceptan tanto el dominio oficial como el resto de orígenes declarados por el
 * servidor en `officialOrigins` (viene de ALLOWED_ORIGINS). Eso incluye la URL de
 * respaldo *.workers.dev: bloquear el inicio de sesión ahí dejaría sin salida al
 * usuario justo cuando el dominio principal falla.
 *
 * Si no hay nada configurado o los valores son inválidos, no se alerta: más vale no
 * avisar que avisar en falso.
 */
export function isOriginMismatch(
  officialDomain: string | null | undefined,
  officialOrigins: string[] | null | undefined = null,
  currentOrigin: string = window.location.origin
): boolean {
  const candidates = [officialDomain, ...(officialOrigins ?? [])].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  if (candidates.length === 0) return false;
  try {
    const current = new URL(currentOrigin);
    return !candidates.some((ref) => matches(ref, current));
  } catch {
    return false;
  }
}
