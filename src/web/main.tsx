// Safari polyfills for older versions
// Object.entries polyfill
if (!Object.entries) {
        Object.entries = function <T>(obj: { [s: string]: T } | ArrayLike<T>): [string, T][] {
                return Object.keys(obj).map((key) => [key, (obj as Record<string, T>)[key]]);
        };
}

// Object.values polyfill
if (!Object.values) {
        Object.values = function <T>(obj: { [s: string]: T } | ArrayLike<T>): T[] {
                return Object.keys(obj).map((key) => (obj as Record<string, T>)[key]);
        };
}

// Array.from polyfill for older Safari
if (!Array.from) {
        Array.from = function <T>(arrayLike: ArrayLike<T> | Iterable<T>): T[] {
                return Array.prototype.slice.call(arrayLike);
        };
}

// Object.assign polyfill
if (typeof Object.assign !== "function") {
        Object.assign = function <T extends object>(target: T, ...sources: Partial<T>[]): T {
                if (target === null || target === undefined) {
                        throw new TypeError("Cannot convert undefined or null to object");
                }
                const to = Object(target);
                for (const source of sources) {
                        if (source !== null && source !== undefined) {
                                for (const key in source) {
                                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                                                to[key] = source[key];
                                        }
                                }
                        }
                }
                return to;
        };
}

// String.prototype.includes polyfill
if (!String.prototype.includes) {
        String.prototype.includes = function (search: string, start?: number): boolean {
                if (typeof start !== "number") {
                        start = 0;
                }
                if (start + search.length > this.length) {
                        return false;
                }
                return this.indexOf(search, start) !== -1;
        };
}

// Array.prototype.includes polyfill
if (!Array.prototype.includes) {
        Array.prototype.includes = function <T>(searchElement: T, fromIndex?: number): boolean {
                return this.indexOf(searchElement, fromIndex) !== -1;
        };
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { getThemeSettings } from "@/lib/ui-preferences";
import { applyPaletteStyles } from "@/lib/palette-preferences";
import { initSentry } from "@/lib/sentry";
import { ErrorBoundary } from "@/components/error-boundary";
import "./styles.css";
import App from "./app.tsx";
import { LanguageProvider } from "./contexts/language-context";

// Aplicar tema y paleta guardados antes del primer render (evita flash)
try {
  const { mode } = getThemeSettings();
  document.documentElement.classList.toggle("dark", mode === "dark");
  applyPaletteStyles();
} catch (e) {
  console.warn("No se pudo aplicar tema/paleta guardados:", e);
}

/** Elimina service workers y cachés PWA heredados (sin modo offline). */
async function removeLegacyOfflineSupport() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith("podoadmin")).map((key) => caches.delete(key))
    );
  }
}

function mountApp() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <LanguageProvider>
          <Router>
            <App />
          </Router>
        </LanguageProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

async function bootstrap() {
  // No bloquear el primer render si Sentry/config tarda (worker arrancando).
  try {
    await Promise.race([
      initSentry(),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch (e) {
    console.warn("initSentry falló:", e);
  }

  mountApp();

  // Limpieza PWA heredada en segundo plano (unregister puede colgarse en algunos navegadores).
  void removeLegacyOfflineSupport().catch((e) => {
    console.warn("removeLegacyOfflineSupport:", e);
  });
}

bootstrap().catch((e) => {
  console.error("bootstrap falló, montando app de todos modos:", e);
  mountApp();
});
