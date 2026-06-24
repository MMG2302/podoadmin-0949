import { createMiddleware } from 'hono/factory';
import { getR2Bucket } from '../utils/r2-media';

/** Expone env.BUCKET en rutas que suben o sirven media. */
export const r2BucketMiddleware = createMiddleware(async (c, next) => {
  const bucket = getR2Bucket(c.env as { BUCKET?: R2Bucket });
  c.set('r2Bucket', bucket);
  await next();
});
