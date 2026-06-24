import { asc, eq, like, sql } from 'drizzle-orm';
import { database } from '../database';
import {
  clinicalSessionImages,
  clinicalSessions,
  clinics,
  professionalLogos as professionalLogosTable,
} from '../database/schema';
import {
  decodeDataUri,
  isR2Reference,
  persistLogoPayload,
  putR2Object,
  sessionImageObjectKey,
  toR2Reference,
} from './r2-media';
import { replaceSessionImages } from './session-images';
import { mapDbSession } from './clinical-maps';

export type R2MigrateScope = 'all' | 'sessions' | 'logos' | 'legacy_notes';

export interface R2BatchMigrateResult {
  dryRun: boolean;
  scope: R2MigrateScope;
  migratedSessionImages: number;
  migratedLogos: number;
  migratedLegacySessions: number;
  skipped: number;
  errors: string[];
}

async function migrateSessionImageRow(
  bucket: R2Bucket,
  row: { id: string; sessionId: string; dataUri: string; createdBy: string },
  dryRun: boolean
): Promise<'migrated' | 'skipped' | 'error'> {
  if (isR2Reference(row.dataUri) || !row.dataUri.startsWith('data:')) return 'skipped';
  const decoded = decodeDataUri(row.dataUri);
  if (!decoded) return 'error';
  const key = sessionImageObjectKey(row.createdBy, row.sessionId, row.id);
  if (dryRun) return 'migrated';
  try {
    await putR2Object(bucket, key, decoded.buffer, decoded.contentType);
    await database
      .update(clinicalSessionImages)
      .set({ dataUri: toR2Reference(key) })
      .where(eq(clinicalSessionImages.id, row.id));
    return 'migrated';
  } catch {
    return 'error';
  }
}

async function migrateLogoRow(
  bucket: R2Bucket,
  scope: 'clinic' | 'professional',
  id: string,
  logo: string,
  dryRun: boolean
): Promise<'migrated' | 'skipped' | 'error'> {
  if (!logo.startsWith('data:')) return 'skipped';
  if (dryRun) return 'migrated';
  try {
    const stored = await persistLogoPayload(logo, scope, id, bucket, logo);
    if (scope === 'clinic') {
      await database.update(clinics).set({ logo: stored }).where(eq(clinics.clinicId, id));
    } else {
      await database.update(professionalLogosTable).set({ logo: stored }).where(eq(professionalLogosTable.userId, id));
    }
    return 'migrated';
  } catch {
    return 'error';
  }
}

export async function runR2MediaBatchMigrate(options: {
  bucket: R2Bucket;
  batchSize?: number;
  dryRun?: boolean;
  scope?: R2MigrateScope;
}): Promise<R2BatchMigrateResult> {
  const batchSize = Math.min(Math.max(options.batchSize ?? 25, 1), 100);
  const dryRun = options.dryRun ?? false;
  const scope = options.scope ?? 'all';
  const bucket = options.bucket;

  const result: R2BatchMigrateResult = {
    dryRun,
    scope,
    migratedSessionImages: 0,
    migratedLogos: 0,
    migratedLegacySessions: 0,
    skipped: 0,
    errors: [],
  };

  const runSessions = scope === 'all' || scope === 'sessions';
  const runLogos = scope === 'all' || scope === 'logos';
  const runLegacy = scope === 'all' || scope === 'legacy_notes';

  if (runLegacy) {
    const legacyRows = await database
      .select()
      .from(clinicalSessions)
      .where(like(clinicalSessions.notes, '%data:image%'))
      .limit(batchSize);

    for (const row of legacyRows) {
      const session = mapDbSession(row);
      const legacyImages = session.images ?? [];
      if (legacyImages.length === 0) {
        result.skipped++;
        continue;
      }
      const existing = await database
        .select({ id: clinicalSessionImages.id })
        .from(clinicalSessionImages)
        .where(eq(clinicalSessionImages.sessionId, row.id))
        .limit(1);
      if (existing.length > 0) {
        result.skipped++;
        continue;
      }
      if (dryRun) {
        result.migratedLegacySessions++;
        continue;
      }
      try {
        await replaceSessionImages(row.id, legacyImages, { bucket, userId: row.createdBy });
        result.migratedLegacySessions++;
      } catch (err) {
        result.errors.push(`legacy ${row.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  if (runSessions) {
    const imageRows = await database
      .select({
        id: clinicalSessionImages.id,
        sessionId: clinicalSessionImages.sessionId,
        dataUri: clinicalSessionImages.dataUri,
        createdBy: clinicalSessions.createdBy,
      })
      .from(clinicalSessionImages)
      .innerJoin(clinicalSessions, eq(clinicalSessionImages.sessionId, clinicalSessions.id))
      .where(like(clinicalSessionImages.dataUri, 'data:%'))
      .orderBy(asc(clinicalSessionImages.createdAt))
      .limit(batchSize);

    for (const row of imageRows) {
      const status = await migrateSessionImageRow(bucket, row, dryRun);
      if (status === 'migrated') result.migratedSessionImages++;
      else if (status === 'skipped') result.skipped++;
      else result.errors.push(`session image ${row.id}: decode/upload failed`);
    }
  }

  if (runLogos) {
    const clinicRows = await database
      .select({ clinicId: clinics.clinicId, logo: clinics.logo })
      .from(clinics)
      .where(like(clinics.logo, 'data:%'))
      .limit(batchSize);

    for (const row of clinicRows) {
      if (!row.logo) continue;
      const status = await migrateLogoRow(bucket, 'clinic', row.clinicId, row.logo, dryRun);
      if (status === 'migrated') result.migratedLogos++;
      else if (status === 'skipped') result.skipped++;
      else result.errors.push(`clinic logo ${row.clinicId}: failed`);
    }

    const remaining = Math.max(0, batchSize - clinicRows.length);
    if (remaining > 0) {
      const profRows = await database
        .select({ userId: professionalLogosTable.userId, logo: professionalLogosTable.logo })
        .from(professionalLogosTable)
        .where(like(professionalLogosTable.logo, 'data:%'))
        .limit(remaining);

      for (const row of profRows) {
        if (!row.logo) continue;
        const status = await migrateLogoRow(bucket, 'professional', row.userId, row.logo, dryRun);
        if (status === 'migrated') result.migratedLogos++;
        else if (status === 'skipped') result.skipped++;
        else result.errors.push(`professional logo ${row.userId}: failed`);
      }
    }
  }

  return result;
}

/** Cuenta filas pendientes de migrar (estimación rápida). */
export async function countR2MediaPending(): Promise<{
  sessionImages: number;
  legacySessions: number;
  clinicLogos: number;
  professionalLogos: number;
}> {
  const [sessionImages, legacySessions, clinicLogos, profLogoCount] = await Promise.all([
    database
      .select({ count: sql<number>`count(*)` })
      .from(clinicalSessionImages)
      .where(like(clinicalSessionImages.dataUri, 'data:%')),
    database
      .select({ count: sql<number>`count(*)` })
      .from(clinicalSessions)
      .where(like(clinicalSessions.notes, '%data:image%')),
    database.select({ count: sql<number>`count(*)` }).from(clinics).where(like(clinics.logo, 'data:%')),
    database
      .select({ count: sql<number>`count(*)` })
      .from(professionalLogosTable)
      .where(like(professionalLogosTable.logo, 'data:%')),
  ]);

  return {
    sessionImages: Number(sessionImages[0]?.count ?? 0),
    legacySessions: Number(legacySessions[0]?.count ?? 0),
    clinicLogos: Number(clinicLogos[0]?.count ?? 0),
    professionalLogos: Number(profLogoCount[0]?.count ?? 0),
  };
}
