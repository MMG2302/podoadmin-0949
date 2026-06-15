/**
 * Inicialización opcional de Sentry en el cliente (solo si hay DSN).
 */
import * as Sentry from '@sentry/react';

let initialized = false;

export function isSentryInitialized(): boolean {
  return initialized;
}

export async function initSentry(): Promise<void> {
  if (initialized) return;

  let dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  let environment = import.meta.env.MODE;

  if (!dsn) {
    try {
      const res = await fetch('/api/public/config');
      if (res.ok) {
        const cfg = (await res.json()) as {
          sentryDsn?: string | null;
          sentryEnvironment?: string | null;
        };
        dsn = cfg.sentryDsn ?? undefined;
        if (cfg.sentryEnvironment) environment = cfg.sentryEnvironment;
      }
    } catch {
      // Sin DSN: observabilidad solo vía consola
    }
  }

  if (!dsn?.trim()) return;

  Sentry.init({
    dsn: dsn.trim(),
    environment,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    sendDefaultPii: false,
  });
  initialized = true;
}

export { Sentry };
