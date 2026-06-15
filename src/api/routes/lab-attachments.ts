import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { requireActiveSubscription } from '../middleware/subscription';
import { database } from '../database';
import { labAttachments } from '../database/schema';
import { sanitizePathParam } from '../utils/sanitization';
import { validateLabFileInput } from '../utils/lab-file-upload';

const labRoutes = new Hono();
labRoutes.use('*', requireAuth, requireActiveSubscription);

labRoutes.get('/', requirePermission('view_patients'), async (c) => {
  const patientId = c.req.query('patientId');
  let rows = await database.select().from(labAttachments).orderBy(desc(labAttachments.createdAt));
  if (patientId) rows = rows.filter((r) => r.patientId === sanitizePathParam(patientId));
  return c.json({
    success: true,
    attachments: rows.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      sessionId: r.sessionId,
      title: r.title,
      mimeType: r.mimeType,
      fileSize: r.fileSize,
      notes: r.notes,
      createdAt: r.createdAt,
      downloadPath: `/api/lab-attachments/${r.id}/download`,
    })),
  });
});

const metaSchema = z.object({
  patientId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(128),
  fileSize: z.number().int().nonnegative(),
  notes: z.string().max(2000).optional(),
  fileKey: z.string().min(1).max(512),
});

const uploadSchema = z.object({
  patientId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(128).optional(),
  notes: z.string().max(2000).optional(),
  fileBase64: z.string().min(20).max(15_000_000),
});

labRoutes.post('/upload', requirePermission('manage_patients', 'manage_sessions'), async (c) => {
  const user = c.get('user')!;
  const parsed = uploadSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);

  const validated = validateLabFileInput(parsed.data.fileBase64, parsed.data.mimeType);
  if (!validated.valid) return c.json({ error: validated.message }, 400);

  const bucket = (c.env as { BUCKET?: R2Bucket })?.BUCKET;
  if (!bucket) return c.json({ error: 'Almacenamiento no configurado' }, 503);

  const ext =
    validated.mimeType === 'application/pdf'
      ? 'pdf'
      : validated.mimeType.includes('png')
        ? 'png'
        : validated.mimeType.includes('webp')
          ? 'webp'
          : 'jpg';
  const fileKey = `lab/${parsed.data.patientId}/${crypto.randomUUID()}.${ext}`;
  await bucket.put(fileKey, validated.buffer, {
    httpMetadata: { contentType: validated.mimeType },
  });

  const id = crypto.randomUUID();
  await database.insert(labAttachments).values({
    id,
    patientId: parsed.data.patientId,
    sessionId: parsed.data.sessionId ?? null,
    title: parsed.data.title,
    fileKey,
    mimeType: validated.mimeType,
    fileSize: validated.buffer.length,
    notes: parsed.data.notes ?? null,
    createdBy: user.userId,
    clinicId: user.clinicId ?? null,
    createdAt: new Date().toISOString(),
  });
  return c.json(
    {
      success: true,
      id,
      fileKey,
      downloadPath: `/api/lab-attachments/${id}/download`,
    },
    201
  );
});

labRoutes.post('/', requirePermission('manage_patients', 'manage_sessions'), async (c) => {
  const user = c.get('user')!;
  const parsed = metaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Datos inválidos' }, 400);
  const id = crypto.randomUUID();
  await database.insert(labAttachments).values({
    id,
    patientId: parsed.data.patientId,
    sessionId: parsed.data.sessionId ?? null,
    title: parsed.data.title,
    fileKey: parsed.data.fileKey,
    mimeType: parsed.data.mimeType,
    fileSize: parsed.data.fileSize,
    notes: parsed.data.notes ?? null,
    createdBy: user.userId,
    clinicId: user.clinicId ?? null,
    createdAt: new Date().toISOString(),
  });
  return c.json({ success: true, id }, 201);
});

labRoutes.get('/:id/download', requirePermission('view_patients'), async (c) => {
  const id = sanitizePathParam(c.req.param('id'));
  const rows = await database.select().from(labAttachments).where(eq(labAttachments.id, id)).limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: 'No encontrado' }, 404);
  const bucket = (c.env as { BUCKET?: R2Bucket })?.BUCKET;
  if (!bucket) return c.json({ error: 'Almacenamiento no configurado' }, 503);
  const object = await bucket.get(row.fileKey);
  if (!object) return c.json({ error: 'Archivo no encontrado' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', row.mimeType);
  headers.set('Content-Disposition', `attachment; filename="${row.title}"`);
  return new Response(object.body, { headers });
});

export default labRoutes;
