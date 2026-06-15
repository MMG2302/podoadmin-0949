/**
 * Captura de errores en el Worker (requiere export envuelto con Sentry.withSentry).
 */
import * as Sentry from '@sentry/cloudflare';

export function captureServerError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!Sentry.isEnabled()) return;
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
    return;
  }
  Sentry.captureException(error);
}
