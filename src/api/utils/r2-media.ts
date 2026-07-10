/** Utilidades R2 para imágenes (sesiones, logos). Referencias en DB: prefijo `r2://`. */

import { getR2Bucket as getR2BucketFromBinding } from './r2-bucket-binding';

export const R2_REF_PREFIX = 'r2://';

export function isR2Reference(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(R2_REF_PREFIX);
}

export function r2KeyFromReference(ref: string): string {
  return ref.startsWith(R2_REF_PREFIX) ? ref.slice(R2_REF_PREFIX.length) : ref;
}

export function toR2Reference(key: string): string {
  return `${R2_REF_PREFIX}${key}`;
}

export function sessionImageFilePath(imageId: string): string {
  return `/api/session-images/${imageId}/file`;
}

export function isSessionImageFilePath(value: string): boolean {
  return /^\/api\/session-images\/[0-9a-f-]{36}\/file$/i.test(value);
}

export function sessionImageIdFromPath(value: string): string | null {
  const m = value.match(/^\/api\/session-images\/([0-9a-f-]{36})\/file$/i);
  return m?.[1] ?? null;
}

export function clinicLogoFilePath(clinicId: string): string {
  return `/api/media/logo/clinic/${clinicId}`;
}

export function professionalLogoFilePath(userId: string): string {
  return `/api/media/logo/professional/${userId}`;
}

export function sessionImageObjectKey(userId: string, sessionId: string, imageId: string): string {
  return `sessions/${userId}/${sessionId}/${imageId}.webp`;
}

export function clinicLogoObjectKey(clinicId: string): string {
  return `logos/clinic/${clinicId}.webp`;
}

export function professionalLogoObjectKey(userId: string): string {
  return `logos/professional/${userId}.webp`;
}

export function userAvatarObjectKey(userId: string): string {
  return `avatars/${userId}.webp`;
}

export function userAvatarFilePath(userId: string): string {
  return `/api/media/avatar/${userId}`;
}

export function getR2PublicBaseUrl(): string | null {
  try {
    const raw = process.env.R2_PUBLIC_BASE_URL;
    if (!raw?.trim()) return null;
    return raw.trim().replace(/\/$/, '');
  } catch {
    return null;
  }
}

/** URL pública CDN si está configurada; si no, ruta proxy API. */
export function resolvePublicR2Url(objectKey: string, proxyPath: string): string {
  const base = getR2PublicBaseUrl();
  if (!base) return proxyPath;
  return `${base}/${objectKey}`;
}

export function getR2Bucket(env?: { BUCKET?: R2Bucket }): R2Bucket | null {
  if (env?.BUCKET) return env.BUCKET;
  try {
    return getR2BucketFromBinding();
  } catch {
    return null;
  }
}

export function decodeDataUri(dataUri: string): { buffer: Uint8Array; contentType: string } | null {
  const comma = dataUri.indexOf(',');
  if (comma < 0) return null;
  const header = dataUri.slice(0, comma);
  const base64 = dataUri.slice(comma + 1).replace(/\s/g, '');
  const mimeMatch = header.match(/^data:([^;]+)/i);
  const contentType = mimeMatch?.[1] ?? 'application/octet-stream';
  try {
    const binary = atob(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    return { buffer, contentType };
  } catch {
    return null;
  }
}

export async function putR2Object(
  bucket: R2Bucket,
  key: string,
  body: Uint8Array | ArrayBuffer,
  contentType: string
): Promise<void> {
  await bucket.put(key, body, { httpMetadata: { contentType } });
}

export async function deleteR2Object(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

export async function deleteR2Objects(bucket: R2Bucket, keys: string[]): Promise<void> {
  const unique = [...new Set(keys.filter(Boolean))];
  await Promise.all(unique.map((key) => bucket.delete(key)));
}

/** Sube logo validado a R2 si hay bucket; si no, devuelve data URI. */
export async function persistLogoPayload(
  sanitizedDataUri: string,
  scope: 'clinic' | 'professional',
  id: string,
  bucket?: R2Bucket | null,
  previousStored?: string | null
): Promise<string> {
  const b = bucket ?? getR2Bucket();
  if (!b) return sanitizedDataUri;

  const decoded = decodeDataUri(sanitizedDataUri);
  if (!decoded) return sanitizedDataUri;

  const key = scope === 'clinic' ? clinicLogoObjectKey(id) : professionalLogoObjectKey(id);
  if (previousStored && isR2Reference(previousStored)) {
    await deleteR2Object(b, r2KeyFromReference(previousStored));
  }
  await putR2Object(b, key, decoded.buffer, decoded.contentType);
  return toR2Reference(key);
}

/** Sube avatar validado a R2 si hay bucket; si no, devuelve data URI. */
export async function persistAvatarPayload(
  sanitizedDataUri: string,
  userId: string,
  bucket?: R2Bucket | null,
  previousStored?: string | null
): Promise<string> {
  const b = bucket ?? getR2Bucket();
  if (!b) return sanitizedDataUri;

  const decoded = decodeDataUri(sanitizedDataUri);
  if (!decoded) return sanitizedDataUri;

  const key = userAvatarObjectKey(userId);
  // Misma clave por usuario: put sobrescribe; evitar delete redundante (cuelgues en Miniflare local).
  if (previousStored && isR2Reference(previousStored)) {
    const prevKey = r2KeyFromReference(previousStored);
    if (prevKey !== key) {
      await deleteR2Object(b, prevKey);
    }
  }
  await putR2Object(b, key, decoded.buffer, decoded.contentType);
  return toR2Reference(key);
}

/** Resuelve avatar almacenado (OAuth URL, data URI o r2) a URL usable en `<img src>`. */
export function resolveAvatarForClient(
  stored: string | null | undefined,
  userId: string,
  cacheVersion?: string | number | null
): string | null {
  if (!stored) return null;
  if (stored.startsWith('data:')) return stored;
  if (stored.startsWith('http://') || stored.startsWith('https://')) return stored;
  if (isR2Reference(stored)) {
    const key = r2KeyFromReference(stored);
    let url = resolvePublicR2Url(key, userAvatarFilePath(userId));
    if (cacheVersion != null && String(cacheVersion).length > 0) {
      url += `${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(cacheVersion))}`;
    }
    return url;
  }
  return stored;
}

/** Resuelve logo almacenado (data URI o r2) a URL usable en `<img src>`. */
export function resolveLogoForClient(
  stored: string | null | undefined,
  scope: 'clinic' | 'professional',
  id: string
): string | null {
  if (!stored) return null;
  if (stored.startsWith('data:')) return stored;
  if (isR2Reference(stored)) {
    const key = r2KeyFromReference(stored);
    const proxy = scope === 'clinic' ? clinicLogoFilePath(id) : professionalLogoFilePath(id);
    return resolvePublicR2Url(key, proxy);
  }
  return stored;
}
