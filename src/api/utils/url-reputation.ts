/**
 * Capa de reputación de URLs para anti-phishing (mensajes, etc.).
 * Si GOOGLE_SAFE_BROWSING_API_KEY está definida, se consulta la API v4 threatMatches:find.
 * Si no, no se bloquea por reputación (solo por ofuscación y otras reglas).
 */

const MAX_URL_LENGTH = 2048;
const MAX_URLS_PER_CHECK = 500;
/** Timeout para llamadas externas (Safe Browsing): no bloquear el request indefinidamente (phishing no espera). */
const SAFE_BROWSING_TIMEOUT_MS = 5000;

/** Regex para extraer URLs http(s) de un texto (evita capturar puntuación final) */
const URL_IN_TEXT = /https?:\/\/[^\s"'<>)\]]+/gi;

/**
 * Extrae URLs candidatas de un texto (solo http/https), sin duplicados y limitando longitud.
 */
export function extractUrlsFromText(text: string | null | undefined): string[] {
  if (!text || typeof text !== 'string') return [];
  const seen = new Set<string>();
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(URL_IN_TEXT.source, 'gi');
  while ((m = re.exec(text)) !== null) {
    let u = m[0].replace(/[.,;:!?)]+$/, '').slice(0, MAX_URL_LENGTH);
    if (!seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  }
  return urls;
}

export interface SafeBrowsingResult {
  /** URLs que Safe Browsing marcó como amenaza (phishing, malware, etc.) */
  unsafe: string[];
  /** Si la API falló (red, cuota, etc.), no bloqueamos pero se puede loguear */
  error?: string;
}

/**
 * Comprueba las URLs contra Google Safe Browsing API v4 (threatMatches:find).
 * Si GOOGLE_SAFE_BROWSING_API_KEY no está definida, devuelve { unsafe: [] } (no bloquea).
 */
export async function checkUrlsWithSafeBrowsing(urls: string[]): Promise<SafeBrowsingResult> {
  const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!key || urls.length === 0) return { unsafe: [] };

  const unique = [...new Set(urls)].slice(0, MAX_URLS_PER_CHECK);
  const body = {
    client: { clientId: 'podoadmin', clientVersion: '1.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: unique.map((url) => ({ url })),
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SAFE_BROWSING_TIMEOUT_MS);
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errText = await res.text();
      return { unsafe: [], error: `Safe Browsing API ${res.status}: ${errText.slice(0, 200)}` };
    }
    const data = (await res.json()) as { matches?: Array<{ threat: { url: string } }> };
    const unsafe = (data.matches ?? []).map((m) => m.threat?.url).filter(Boolean) as string[];
    return { unsafe };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { unsafe: [], error: message };
  }
}
