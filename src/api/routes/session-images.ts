import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireActiveSubscription } from '../middleware/subscription';
import { requirePermission } from '../middleware/authorization';
import { sanitizePathParam } from '../utils/sanitization';
import { database } from '../database';
import { clinicalSessions } from '../database/schema';
import { getSessionImageRow } from '../utils/session-images';
import { getR2Bucket, isR2Reference, r2KeyFromReference } from '../utils/r2-media';
import { getSessionAccessDeniedReason } from '../utils/tenant-isolation';

const sessionImagesRoutes = new Hono();

sessionImagesRoutes.use('*', requireAuth, requireActiveSubscription);

sessionImagesRoutes.get('/:imageId/file', requirePermission('view_patients', 'manage_sessions'), async (c) => {
  const imageId = sanitizePathParam(c.req.param('imageId'));
  const user = c.get('user')!;
  const row = await getSessionImageRow(imageId);
  if (!row) return c.json({ error: 'No encontrado' }, 404);

  const sessionRows = await database
    .select()
    .from(clinicalSessions)
    .where(eq(clinicalSessions.id, row.sessionId))
    .limit(1);
  const session = sessionRows[0];
  if (!session) return c.json({ error: 'No encontrado' }, 404);

  const denied = await getSessionAccessDeniedReason(user, session);
  if (denied) return c.json({ error: denied }, 403);

  if (isR2Reference(row.dataUri)) {
    const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
    if (!bucket) return c.json({ error: 'Almacenamiento no configurado' }, 503);
    const object = await bucket.get(r2KeyFromReference(row.dataUri));
    if (!object) return c.json({ error: 'Archivo no encontrado' }, 404);
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/webp');
    headers.set('Cache-Control', 'private, max-age=3600');
    return new Response(object.body, { headers });
  }

  if (row.dataUri.startsWith('data:')) {
    const decoded = row.dataUri.match(/^data:([^;]+);base64,(.+)$/i);
    if (!decoded) return c.json({ error: 'Imagen inválida' }, 500);
    const binary = atob(decoded[2].replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Response(bytes, {
      headers: {
        'Content-Type': decoded[1],
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  return c.json({ error: 'Formato no soportado' }, 415);
});

export default sessionImagesRoutes;
