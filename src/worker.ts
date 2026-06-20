/**
 * Punto de entrada del Worker de Cloudflare.
 * Exporta fetch (Hono app) y scheduled (cron retención + backup D1).
 */
import * as Sentry from '@sentry/cloudflare';
import app from './api/index';
import { getDeletionThresholdMs } from './api/utils/user-retention';
import { deleteUserCascade } from './api/utils/delete-user-cascade';
import { database } from './api/database';
import { createdUsers } from './api/database/schema';
import { lt, and, isNotNull } from 'drizzle-orm';
import { logger } from './api/utils/logger';
import { captureServerError } from './api/utils/sentry-server';
import { cleanupOldAttemptsD1 } from './api/utils/rate-limit-d1';
import { runD1BackupToR2, type D1BackupEnv } from './api/utils/d1-backup';
import { runAppointmentRemindersCron } from './api/utils/appointment-reminders-cron';
import { runClinicalRetentionPurge } from './api/utils/clinical-retention-purge';

async function runRetentionCron(): Promise<void> {
  const db = database;
  const threshold = getDeletionThresholdMs();

  const toDelete = await db
    .select({ id: createdUsers.id, userId: createdUsers.userId })
    .from(createdUsers)
    .where(and(isNotNull(createdUsers.disabledAt), lt(createdUsers.disabledAt, threshold)));

  for (const u of toDelete) {
    const result = await deleteUserCascade(u.userId, u.id);
    if (result.deleted) {
      logger.info({ event: 'cron_user_deleted', userId: u.userId, id: u.id });
    } else {
      logger.error({
        event: 'cron_user_delete_failed',
        userId: u.userId,
        id: u.id,
        error: result.error,
      });
    }
  }
}

async function runRateLimitCleanup(): Promise<void> {
  await cleanupOldAttemptsD1();
  logger.info({ event: 'cron_rate_limit_cleanup_done' });
}

async function runD1BackupCron(env: D1BackupEnv): Promise<void> {
  const result = await runD1BackupToR2(env);
  if (result.skipped === 'disabled') {
    logger.info({ event: 'cron_d1_backup_skipped', reason: 'D1_BACKUP_ENABLED not set' });
    return;
  }
  if (!result.ok) {
    logger.error({ event: 'cron_d1_backup_failed', error: result.error });
    throw new Error(result.error || 'd1_backup_failed');
  }
  logger.info({ event: 'cron_d1_backup_done', key: result.key, pruned: result.pruned });
}

const workerHandler = {
  fetch: app.fetch,

  async scheduled(
    controller: ScheduledController,
    env: D1BackupEnv & { DB: D1Database; SENTRY_DSN?: string },
    ctx: ExecutionContext
  ): Promise<void> {
    if (controller.cron === '0 * * * *') {
      const remindersJob = async () => {
        try {
          const result = await runAppointmentRemindersCron();
          logger.info({ event: 'cron_appointment_reminders_done', ...result });
        } catch (err) {
          logger.error({ event: 'cron_appointment_reminders_error', message: String(err) });
          captureServerError(err, { cron: 'appointment-reminders' });
        }
      };
      ctx.waitUntil(remindersJob());
      return;
    }

    if (controller.cron === '0 5 * * *') {
      const purgeJob = async () => {
        try {
          const stats = await runClinicalRetentionPurge();
          logger.info({ event: 'cron_clinical_retention_purge_done', ...stats });
        } catch (err) {
          logger.error({ event: 'cron_clinical_retention_purge_error', message: String(err) });
          captureServerError(err, { cron: 'clinical-retention-purge' });
        }
      };
      ctx.waitUntil(purgeJob());
      return;
    }

    if (controller.cron === '0 4 * * *') {
      const backupJob = async () => {
        try {
          await runD1BackupCron(env);
        } catch (err) {
          logger.error({ event: 'cron_d1_backup_error', message: String(err) });
          captureServerError(err, { cron: 'd1-backup' });
          throw err;
        }
      };

      if (typeof Sentry.withMonitor === 'function') {
        ctx.waitUntil(
          Sentry.withMonitor('d1-backup-cron', backupJob, {
            schedule: { type: 'crontab', value: '0 4 * * *' },
          })
        );
        return;
      }

      ctx.waitUntil(backupJob());
      return;
    }

    const job = async () => {
      try {
        await runRetentionCron();
        await runRateLimitCleanup();
      } catch (err) {
        logger.error({ event: 'cron_retention_error', message: String(err) });
        captureServerError(err, { cron: 'user-retention' });
        throw err;
      }
    };

    if (typeof Sentry.withMonitor === 'function') {
      ctx.waitUntil(
        Sentry.withMonitor('user-retention-cron', job, {
          schedule: { type: 'crontab', value: '0 6 * * *' },
        })
      );
      return;
    }

    ctx.waitUntil(job());
  },
};

const useSentryInWorker =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

export default useSentryInWorker
  ? Sentry.withSentry(
      (cfEnv) => {
        const dsn = cfEnv.SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim();
        if (!dsn) return undefined;
        return {
          dsn,
          environment: process.env.NODE_ENV || 'production',
          tracesSampleRate: 0.15,
          sendDefaultPii: false,
        };
      },
      workerHandler
    )
  : workerHandler;
