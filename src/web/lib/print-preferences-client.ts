import { api } from "./api-client";
import { fetchShared, invalidateShared } from "./shared-query";
import {
  DEFAULT_PRINT_PREFERENCES,
  normalizePrintPreferences,
  type PrintPreferencesConfig,
} from "../types/print-preferences";

const CACHE_KEY = "clinical:print-preferences";

export type PrintPreferencesData = {
  config: PrintPreferencesConfig;
  canEdit: boolean;
  scope: "clinic" | "professional";
};

const DEFAULT_DATA: PrintPreferencesData = {
  config: DEFAULT_PRINT_PREFERENCES,
  canEdit: false,
  scope: "professional",
};

type PrintPreferencesResponse = {
  success?: boolean;
  config?: PrintPreferencesConfig;
  canEdit?: boolean;
  scope?: "clinic" | "professional";
  message?: string;
};

function mapResponse(data: PrintPreferencesResponse): PrintPreferencesData {
  return {
    config: normalizePrintPreferences(data.config),
    canEdit: Boolean(data.canEdit),
    scope: data.scope ?? "professional",
  };
}

async function fetchPrintPreferencesFromApi(): Promise<PrintPreferencesData> {
  const res = await api.get<PrintPreferencesResponse>("/clinical/print-preferences");
  if (res.success && res.data) return mapResponse(res.data);
  return DEFAULT_DATA;
}

/** Config para uso en impresión (cacheada); devuelve defaults si falla. */
export async function getPrintPreferences(force = false): Promise<PrintPreferencesConfig> {
  try {
    const data = await fetchShared(CACHE_KEY, fetchPrintPreferencesFromApi, {
      staleTime: 10_000,
      force,
    });
    return data.config;
  } catch {
    return DEFAULT_PRINT_PREFERENCES;
  }
}

/** Datos completos (config + permisos) para la sección de ajustes. */
export async function fetchPrintPreferencesData(force = false): Promise<PrintPreferencesData> {
  try {
    return await fetchShared(CACHE_KEY, fetchPrintPreferencesFromApi, {
      staleTime: 10_000,
      force,
    });
  } catch {
    return DEFAULT_DATA;
  }
}

export function invalidatePrintPreferencesCache() {
  invalidateShared(CACHE_KEY);
}

export async function savePrintPreferences(
  config: PrintPreferencesConfig
): Promise<{ ok: boolean; error?: string; data?: PrintPreferencesData }> {
  const res = await api.put<PrintPreferencesResponse>("/clinical/print-preferences", {
    config: normalizePrintPreferences(config),
  });
  if (res.success && res.data?.success) {
    invalidatePrintPreferencesCache();
    return { ok: true, data: mapResponse(res.data) };
  }
  return {
    ok: false,
    error: res.message || res.data?.message || res.error || "No se pudo guardar.",
  };
}
