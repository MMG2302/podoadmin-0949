import { eq, inArray } from 'drizzle-orm';
import { database } from '../database';
import { clinicalSessionImages, labAttachments } from '../database/schema';
import {
  deleteR2Objects,
  getR2Bucket,
  isR2Reference,
  r2KeyFromReference,
} from './r2-media';

export async function collectSessionImageR2Keys(sessionIds: string[]): Promise<string[]> {
  if (sessionIds.length === 0) return [];
  const rows = await database
    .select({ dataUri: clinicalSessionImages.dataUri })
    .from(clinicalSessionImages)
    .where(inArray(clinicalSessionImages.sessionId, sessionIds));
  return rows.filter((r) => isR2Reference(r.dataUri)).map((r) => r2KeyFromReference(r.dataUri));
}

export async function purgeSessionImagesR2(sessionIds: string[], bucket?: R2Bucket | null): Promise<void> {
  const b = bucket ?? getR2Bucket();
  if (!b || sessionIds.length === 0) return;
  const keys = await collectSessionImageR2Keys(sessionIds);
  await deleteR2Objects(b, keys);
}

export async function purgeLabAttachmentsR2ForPatient(
  patientId: string,
  bucket?: R2Bucket | null
): Promise<void> {
  const b = bucket ?? getR2Bucket();
  if (!b) return;
  const rows = await database
    .select({ fileKey: labAttachments.fileKey })
    .from(labAttachments)
    .where(eq(labAttachments.patientId, patientId));
  await deleteR2Objects(
    b,
    rows.map((r) => r.fileKey)
  );
}

export async function purgePatientMediaR2(
  patientId: string,
  sessionIds: string[],
  bucket?: R2Bucket | null
): Promise<void> {
  await purgeLabAttachmentsR2ForPatient(patientId, bucket);
  await purgeSessionImagesR2(sessionIds, bucket);
}

export async function purgeLogoR2(stored: string | null | undefined, bucket?: R2Bucket | null): Promise<void> {
  const b = bucket ?? getR2Bucket();
  if (!b || !stored || !isR2Reference(stored)) return;
  await deleteR2Objects(b, [r2KeyFromReference(stored)]);
}
