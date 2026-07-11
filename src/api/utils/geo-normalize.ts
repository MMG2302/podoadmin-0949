/**
 * Normaliza nombres de estado/provincia para comparación (ipquery vs targeting).
 */
export function normalizeGeoRegion(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function geoRegionsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeGeoRegion(a);
  const nb = normalizeGeoRegion(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function formatGeoLocation(parts: {
  city?: string | null;
  state?: string | null;
  countryCode?: string | null;
}): string {
  const items = [parts.city, parts.state, parts.countryCode].filter(Boolean);
  return items.length ? items.join(', ') : '—';
}
