import { asc, eq, inArray } from 'drizzle-orm';
import { database } from '../database';
import { clinicalSessionImages } from '../database/schema';
import type { ClinicalSession } from '../../web/types/clinical';

export async function replaceSessionImages(sessionId: string, images: string[]): Promise<void> {
  await database.delete(clinicalSessionImages).where(eq(clinicalSessionImages.sessionId, sessionId));
  if (images.length === 0) return;

  const createdAt = new Date().toISOString();
  await database.insert(clinicalSessionImages).values(
    images.map((dataUri, sortOrder) => ({
      id: crypto.randomUUID(),
      sessionId,
      sortOrder,
      dataUri,
      createdAt,
    }))
  );
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
