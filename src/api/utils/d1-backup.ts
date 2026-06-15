/**
 * Backup D1 → R2 vía API REST de Cloudflare (export SQL).
 * Activar con D1_BACKUP_ENABLED=1 y secrets/vars documentados en CHECKLIST_DEPLOY_PRODUCCION.md.
 */
import { logger } from './logger';

const EXPORT_API_BASE = 'https://api.cloudflare.com/client/v4';
const MAX_POLL_ATTEMPTS = 72;
const POLL_INTERVAL_MS = 5_000;
const R2_PREFIX = 'backups/d1/';

export interface D1BackupEnv {
  BUCKET?: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID?: string;
  D1_DATABASE_ID?: string;
  D1_BACKUP_API_TOKEN?: string;
  D1_BACKUP_RETENTION_DAYS?: string;
  D1_BACKUP_ENABLED?: string;
}

interface ExportApiResult {
  at_bookmark?: string;
  status?: 'complete' | 'error' | string;
  error?: string;
  messages?: string[];
  result?: {
    filename?: string;
    signed_url?: string;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBackupEnabled(env: D1BackupEnv): boolean {
  const flag = env.D1_BACKUP_ENABLED?.trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

function parseRetentionDays(env: D1BackupEnv): number {
  const raw = env.D1_BACKUP_RETENTION_DAYS?.trim();
  if (!raw) return 30;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

function formatBackupTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

async function pollD1Export(
  accountId: string,
  databaseId: string,
  apiToken: string
): Promise<{ sql: string; filename: string }> {
  const url = `${EXPORT_API_BASE}/accounts/${accountId}/d1/database/${databaseId}/export`;
  let bookmark: string | undefined;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const body: Record<string, string> = { output_format: 'polling' };
    if (bookmark) body.current_bookmark = bookmark;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`D1 export API HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    const payload = (await response.json()) as { success?: boolean; result?: ExportApiResult };
    const result = payload.result;
    if (!result) {
      throw new Error('D1 export API: respuesta sin result');
    }

    if (result.status === 'error') {
      throw new Error(result.error || 'D1 export falló');
    }

    if (result.status === 'complete' && result.result?.signed_url) {
      const download = await fetch(result.result.signed_url);
      if (!download.ok) {
        throw new Error(`Descarga backup HTTP ${download.status}`);
      }
      const sql = await download.text();
      return {
        sql,
        filename: result.result.filename || `d1-${databaseId}.sql`,
      };
    }

    bookmark = result.at_bookmark ?? bookmark;
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('D1 export: tiempo de espera agotado');
}

async function pruneOldBackups(bucket: R2Bucket, databaseId: string, retentionDays: number): Promise<number> {
  const prefix = `${R2_PREFIX}${databaseId}/`;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let deleted = 0;
  let cursor: string | undefined;

  do {
    const listed = await bucket.list({ prefix, cursor });
    for (const obj of listed.objects) {
      if (obj.uploaded && obj.uploaded.getTime() < cutoff) {
        await bucket.delete(obj.key);
        deleted++;
      }
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return deleted;
}

export async function runD1BackupToR2(
  env: D1BackupEnv
): Promise<{ ok: boolean; key?: string; skipped?: string; error?: string; pruned?: number }> {
  if (!isBackupEnabled(env)) {
    return { ok: true, skipped: 'disabled' };
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const databaseId = env.D1_DATABASE_ID?.trim();
  const apiToken = env.D1_BACKUP_API_TOKEN?.trim();
  const bucket = env.BUCKET;

  if (!accountId || !databaseId || !apiToken) {
    return { ok: false, error: 'missing_config (CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, D1_BACKUP_API_TOKEN)' };
  }
  if (!bucket) {
    return { ok: false, error: 'missing_bucket (binding BUCKET)' };
  }

  const { sql, filename } = await pollD1Export(accountId, databaseId, apiToken);
  const stamp = formatBackupTimestamp(new Date());
  const key = `${R2_PREFIX}${databaseId}/${stamp}-${filename}`;

  await bucket.put(key, sql, {
    httpMetadata: { contentType: 'application/sql' },
    customMetadata: {
      source: 'd1-export',
      databaseId,
      createdAt: new Date().toISOString(),
    },
  });

  const pruned = await pruneOldBackups(bucket, databaseId, parseRetentionDays(env));

  logger.info({
    event: 'd1_backup_stored',
    key,
    bytes: sql.length,
    pruned,
  });

  return { ok: true, key, pruned };
}
