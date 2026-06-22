import { asc, eq, inArray } from 'drizzle-orm';
import { database } from '../database';
import { clinicalSessionImages } from '../database/schema';
import type { ClinicalSession } from '../../web/types/clinical';
import { MAX_D1_STORED_DATA_URI_BYTES } from './logo-upload';

export async function replaceSessionImages(sessionId: string, images: string[]): Promise<void> {
  await database.delete(clinicalSessionImages).where(eq(clinicalSessionImages.sessionId, sessionId));
  if (images.length === 0) return;

  const createdAt = new Date().toISOString();
  for (let sortOrder = 0; sortOrder < images.length; sortOrder++) {
    const dataUri = images[sortOrder]!;
    if (dataUri.length > MAX_D1_STORED_DATA_URI_BYTES) {
      throw new Error(
        `image_stored_too_large: la imagen ${sortOrder + 1} supera el límite de almacenamiento D1`
      );
    }
    await database.insert(clinicalSessionImages).values({
      id: crypto.randomUUID(),
      sessionId,
      sortOrder,
      dataUri,
      createdAt,
    });
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
    map[row.sessionId].push(row.dataUri);
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
      result.push({ ...session, images: legacy });
      continue;
    }
    result.push({ ...session, images: [] });
  }

  return result;
}
