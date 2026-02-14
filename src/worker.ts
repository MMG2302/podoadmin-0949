/**
 * Punto de entrada del Worker de Cloudflare.
 * Exporta fetch (Hono app) y scheduled (cron de retención).
 */
import app from './api/index';
import { getDeletionThresholdMs } from './api/utils/user-retention';
import { deleteUserCascade } from './api/utils/delete-user-cascade';
import { database } from './api/database';
import { createdUsers } from './api/database/schema';
import { lt, and, isNotNull } from 'drizzle-orm';

export default {
  fetch: app.fetch,

  async scheduled(
    _controller: ScheduledController,
    _env: { DB: D1Database },
    _ctx: ExecutionContext
  ): Promise<void> {
    try {
      const db = database;
      const threshold = getDeletionThresholdMs();

      const toDelete = await db
        .select({ id: createdUsers.id, userId: createdUsers.userId })
        .from(createdUsers)
        .where(and(isNotNull(createdUsers.disabledAt), lt(createdUsers.disabledAt, threshold)));

      for (const u of toDelete) {
        const result = await deleteUserCascade(u.userId, u.id);
        if (result.deleted) {
          console.log(`[cron] Usuario ${u.id} borrado permanentemente (retención 8 meses)`);
        } else {
          console.error(`[cron] Error borrando usuario ${u.id}:`, result.error);
        }
      }
    } catch (err) {
      console.error('[cron] Error en job de retención:', err);
    }
  },
};
