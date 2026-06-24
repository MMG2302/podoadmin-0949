import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/authorization';
import { getR2Bucket } from '../utils/r2-media';
import { countR2MediaPending, runR2MediaBatchMigrate } from '../utils/r2-batch-migrate';

const adminMediaRoutes = new Hono();

adminMediaRoutes.use('*', requireAuth, requireRole('super_admin'));

const migrateBodySchema = z.object({
  dryRun: z.boolean().optional(),
  batchSize: z.number().int().min(1).max(100).optional(),
  scope: z.enum(['all', 'sessions', 'logos', 'legacy_notes']).optional(),
});

adminMediaRoutes.get('/r2-migrate/status', async (c) => {
  const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
  const pending = await countR2MediaPending();
  return c.json({
    success: true,
    bucketConfigured: Boolean(bucket),
    pending,
  });
});

adminMediaRoutes.post('/r2-migrate', async (c) => {
  const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
  if (!bucket) {
    return c.json({ error: 'BUCKET no configurado' }, 503);
  }

  let body: z.infer<typeof migrateBodySchema> = {};
  try {
    const json = await c.req.json();
    const parsed = migrateBodySchema.safeParse(json);
    if (!parsed.success) {
      return c.json({ error: 'Body inválido', issues: parsed.error.issues }, 400);
    }
    body = parsed.data;
  } catch {
    /* body vacío = defaults */
  }

  const result = await runR2MediaBatchMigrate({
    bucket,
    dryRun: body.dryRun,
    batchSize: body.batchSize,
    scope: body.scope,
  });

  return c.json({ success: true, result });
});

export default adminMediaRoutes;
