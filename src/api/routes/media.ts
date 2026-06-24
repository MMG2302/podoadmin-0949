import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { sanitizePathParam } from '../utils/sanitization';
import { database } from '../database';
import { clinics, professionalLogos } from '../database/schema';
import { getR2Bucket, isR2Reference, r2KeyFromReference } from '../utils/r2-media';

const mediaRoutes = new Hono();

mediaRoutes.use('*', requireAuth);

mediaRoutes.get('/logo/clinic/:clinicId', async (c) => {
  const clinicId = sanitizePathParam(c.req.param('clinicId'));
  const rows = await database
    .select({ logo: clinics.logo })
    .from(clinics)
    .where(eq(clinics.clinicId, clinicId))
    .limit(1);
  const stored = rows[0]?.logo;
  if (!stored || !isR2Reference(stored)) return c.json({ error: 'No encontrado' }, 404);

  const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
  if (!bucket) return c.json({ error: 'Almacenamiento no configurado' }, 503);
  const object = await bucket.get(r2KeyFromReference(stored));
  if (!object) return c.json({ error: 'Archivo no encontrado' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/webp');
  headers.set('Cache-Control', 'private, max-age=86400');
  return new Response(object.body, { headers });
});

mediaRoutes.get('/logo/professional/:userId', async (c) => {
  const userId = sanitizePathParam(c.req.param('userId'));
  const rows = await database
    .select({ logo: professionalLogos.logo })
    .from(professionalLogos)
    .where(eq(professionalLogos.userId, userId))
    .limit(1);
  const stored = rows[0]?.logo;
  if (!stored || !isR2Reference(stored)) return c.json({ error: 'No encontrado' }, 404);

  const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
  if (!bucket) return c.json({ error: 'Almacenamiento no configurado' }, 503);
  const object = await bucket.get(r2KeyFromReference(stored));
  if (!object) return c.json({ error: 'Archivo no encontrado' }, 404);
  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? 'image/webp');
  headers.set('Cache-Control', 'private, max-age=86400');
  return new Response(object.body, { headers });
});

export default mediaRoutes;
