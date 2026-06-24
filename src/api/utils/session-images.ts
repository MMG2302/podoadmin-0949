import { asc, eq, inArray } from 'drizzle-orm';
import { database } from '../database';
import { clinicalSessionImages } from '../database/schema';
import type { ClinicalSession } from '../../web/types/clinical';
import { MAX_D1_STORED_DATA_URI_BYTES } from './logo-upload';
import {
  decodeDataUri,
  isR2Reference,
  isSessionImageFilePath,
  putR2Object,
  r2KeyFromReference,
  sessionImageFilePath,
  sessionImageObjectKey,
  toR2Reference,
  deleteR2Objects,
} from './r2-media';

type ReplaceContext = { bucket?: R2Bucket | null; userId?: string };

function isInlineDataUri(value: string): boolean {
  return value.startsWith('data:');
}

async function uploadDataUriToR2(
  bucket: R2Bucket,
  userId: string,
  sessionId: string,
  imageId: string,
  dataUri: string
): Promise<string> {
  const decoded = decodeDataUri(dataUri);
  if (!decoded) throw new Error('image_decode_failed');
  const key = sessionImageObjectKey(userId, sessionId, imageId);
  await putR2Object(bucket, key, decoded.buffer, decoded.contentType);
  return toR2Reference(key);
}

export async function replaceSessionImages(
  sessionId: string,
  images: string[],
  ctx?: ReplaceContext
): Promise<void> {
  const existing = await database
    .select()
    .from(clinicalSessionImages)
    .where(eq(clinicalSessionImages.sessionId, sessionId));

  const keepIds = new Set<string>();
  const newPayloads: string[] = [];

  for (const img of images) {
    if (isSessionImageFilePath(img)) {
      const id = img.match(/\/api\/session-images\/([0-9a-f-]{36})\/file/i)?.[1];
      if (id) keepIds.add(id);
      continue;
    }
    if (isR2Reference(img)) {
      const row = existing.find((r) => r.dataUri === img);
      if (row) keepIds.add(row.id);
      continue;
    }
    if (isInlineDataUri(img)) {
      newPayloads.push(img);
    }
  }

  const bucket = ctx?.bucket ?? null;
  const userId = ctx?.userId;
  const keysToDelete: string[] = [];

  for (const row of existing) {
    if (keepIds.has(row.id)) continue;
    if (isR2Reference(row.dataUri)) keysToDelete.push(r2KeyFromReference(row.dataUri));
    await database.delete(clinicalSessionImages).where(eq(clinicalSessionImages.id, row.id));
  }

  if (bucket && keysToDelete.length > 0) {
    await deleteR2Objects(bucket, keysToDelete);
  }

  const createdAt = new Date().toISOString();
  let sortOrder = 0;

  for (const row of existing) {
    if (!keepIds.has(row.id)) continue;
    await database
      .update(clinicalSessionImages)
      .set({ sortOrder })
      .where(eq(clinicalSessionImages.id, row.id));
    sortOrder++;
  }

  for (const dataUri of newPayloads) {
    if (dataUri.length > MAX_D1_STORED_DATA_URI_BYTES && !bucket) {
      throw new Error(`image_stored_too_large: la imagen supera el límite de almacenamiento D1`);
    }
    const imageId = crypto.randomUUID();
    let stored = dataUri;
    if (bucket && userId) {
      stored = await uploadDataUriToR2(bucket, userId, sessionId, imageId, dataUri);
    } else if (dataUri.length > MAX_D1_STORED_DATA_URI_BYTES) {
      throw new Error(`image_stored_too_large: la imagen supera el límite de almacenamiento D1`);
    }
    await database.insert(clinicalSessionImages).values({
      id: imageId,
      sessionId,
      sortOrder,
      dataUri: stored,
      createdAt,
    });
    sortOrder++;
  }
}

export async function loadSessionImagesMap(sessionIds: string[]): Promise<Record<string, string[]>> {
  if (sessionIds.length === 0) return {};

  const rows = await database
    .select()
    .from(clinicalSessionImages)
    .where(inArray(clinicalSessionImages.sessionId, sessionIds))
    .orderBy(asc(clinicalSessionImages.sessionId), asc(clinicalSessionImages.sortOrder));

  const map: Record<string, string[]> = {};
  for (const row of rows) {
    if (!map[row.sessionId]) map[row.sessionId] = [];
    const src = isR2Reference(row.dataUri) ? sessionImageFilePath(row.id) : row.dataUri;
    map[row.sessionId].push(src);
  }
  return map;
}

/** Prioriza tabla dedicada; migra imágenes legacy desde notes si hace falta. */
export async function attachSessionImages(sessions: ClinicalSession[]): Promise<ClinicalSession[]> {
  if (sessions.length === 0) return sessions;

  const map = await loadSessionImagesMap(sessions.map((s) => s.id));
  const result: ClinicalSession[] = [];

  for (const session of sessions) {
    const stored = map[session.id];
    if (stored && stored.length > 0) {
      result.push({ ...session, images: stored });
      continue;
    }
    const legacy = session.images ?? [];
    if (legacy.length > 0) {
      try {
        await replaceSessionImages(session.id, legacy);
      } catch (err) {
        console.error('No se pudo migrar imágenes legacy de sesión', session.id, err);
      }
      const migrated = await loadSessionImagesMap([session.id]);
      result.push({ ...session, images: migrated[session.id] ?? legacy });
      continue;
    }
    result.push({ ...session, images: [] });
  }

  return result;
}

export async function getSessionImageRow(imageId: string) {
  const rows = await database
    .select()
    .from(clinicalSessionImages)
    .where(eq(clinicalSessionImages.id, imageId))
    .limit(1);
  return rows[0] ?? null;
}
