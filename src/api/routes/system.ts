import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { database } from '../database';

const systemRoutes = new Hono();

systemRoutes.use('*', requireAuth);

/**
 * GET /api/system/diagnostics
 * Estado del worker y latencia de D1 (solo super_admin).
 */
systemRoutes.get('/diagnostics', requireRole('super_admin'), async (c) => {
  const checkedAt = new Date().toISOString();
  let databaseOk = false;
  let databaseLatencyMs: number | null = null;
  let databaseError: string | null = null;

  const t0 = Date.now();
  try {
    await database.run(sql`SELECT 1`);
    databaseOk = true;
    databaseLatencyMs = Date.now() - t0;
  } catch (e) {
    databaseError = e instanceof Error ? e.message : String(e);
  }

  return c.json({
    success: true,
    checkedAt,
    worker: { ok: true },
    database: {
      ok: databaseOk,
      latencyMs: databaseLatencyMs,
      error: databaseError,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV ?? 'production',
    },
    publicHealthPath: '/api/health',
  });
});

export default systemRoutes;
