import { createMiddleware } from 'hono/factory';
import type { AppVariables } from '../types';

export const requestIdMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const requestId = c.req.header('X-Request-Id') || crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    await next();
  }
);
