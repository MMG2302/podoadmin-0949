import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import type { ContentfulStatusCode, HeaderRecord, JSONValue, ResponseOrInit } from 'hono/utils/types';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}

function resolveJsonStatus(arg2: unknown): number {
  if (typeof arg2 === 'number') return arg2;
  if (arg2 && typeof arg2 === 'object' && 'status' in arg2) {
    const s = (arg2 as { status?: number }).status;
    if (typeof s === 'number') return s;
  }
  return 200;
}

/**
 * Asigna un requestId por petición, cabecera X-Request-Id en todas las respuestas JSON
 * y campo requestId en el cuerpo cuando el código HTTP es >= 400.
 */
export const requestIdMiddleware = createMiddleware(async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);

  const origJson = c.json.bind(c) as Context['json'];

  c.json = ((
    object: JSONValue | object,
    arg2?: ContentfulStatusCode | ResponseOrInit<ContentfulStatusCode>,
    arg3?: HeaderRecord
  ) => {
    c.header('X-Request-Id', requestId);
    const status = resolveJsonStatus(arg2);
    if (
      status >= 400 &&
      object !== null &&
      typeof object === 'object' &&
      !Array.isArray(object) &&
      !(object instanceof Response)
    ) {
      const o = object as Record<string, unknown>;
      if (o.requestId === undefined) {
        object = { ...o, requestId } as typeof object;
      }
    }
    return origJson(object as never, arg2 as never, arg3 as never);
  }) as Context['json'];

  await next();
});

export function getOrCreateRequestId(c: { get: (k: 'requestId') => string | undefined }): string {
  return c.get('requestId') ?? crypto.randomUUID();
}
