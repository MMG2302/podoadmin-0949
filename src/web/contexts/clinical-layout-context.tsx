import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { api } from "../lib/api-client";
import { fetchShared, invalidateShared } from "../lib/shared-query";
import {
  createDefaultClinicalLayout,
  normalizeClinicalLayout,
  type ClinicalLayoutConfig,
} from "../types/clinical-layout";

const CACHE_KEY = "clinical:layout";

export type ClinicalLayoutContextValue = {
  layout: ClinicalLayoutConfig;
  scope: "clinic" | "professional";
  scopeId: string;
  canEdit: boolean;
  loading: boolean;
  error: string | null;
  reload: (force?: boolean) => Promise<void>;
};

const ClinicalLayoutContext = createContext<ClinicalLayoutContextValue | undefined>(undefined);

async function fetchClinicalLayoutFromApi() {
  const res = await api.get<{
    success?: boolean;
    layout?: ClinicalLayoutConfig;
    scope?: "clinic" | "professional";
    scopeId?: string;
    canEdit?: boolean;
  }>("/clinical/layout");
  if (res.success && res.data?.layout) {
    return {
      layout: normalizeClinicalLayout(res.data.layout),
      scope: res.data.scope ?? ("professional" as const),
      scopeId: res.data.scopeId ?? "",
      canEdit: Boolean(res.data.canEdit),
      error: null as string | null,
    };
  }
  return {
    layout: createDefaultClinicalLayout(),
    scope: "professional" as const,
    scopeId: "",
    canEdit: false,
    error: res.error || "No se pudo cargar el diseño clínico.",
  };
}

export function ClinicalLayoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<ClinicalLayoutConfig>(createDefaultClinicalLayout());
  const [scope, setScope] = useState<"clinic" | "professional">("professional");
  const [scopeId, setScopeId] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (force?: boolean) => {
      if (!user?.id) {
        setLayout(createDefaultClinicalLayout());
        setError(null);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchShared(CACHE_KEY, fetchClinicalLayoutFromApi, {
          staleTime: 60_000,
          force,
        });
        setLayout(data.layout);
        setScope(data.scope);
        setScopeId(data.scopeId);
        setCanEdit(data.canEdit);
        setError(data.error);
      } catch {
        setLayout(createDefaultClinicalLayout());
        setError("No se pudo cargar el diseño clínico.");
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <ClinicalLayoutContext.Provider value={{ layout, scope, scopeId, canEdit, loading, error, reload }}>
      {children}
    </ClinicalLayoutContext.Provider>
  );
}

export function useClinicalLayoutContext() {
  const ctx = useContext(ClinicalLayoutContext);
  if (!ctx) throw new Error("useClinicalLayoutContext must be used within ClinicalLayoutProvider");
  return ctx;
}

export function invalidateClinicalLayoutCache() {
  invalidateShared(CACHE_KEY);
}

export async function saveClinicalLayout(layout: ClinicalLayoutConfig): Promise<{ ok: boolean; error?: string }> {
  const res = await api.put<{ success?: boolean; layout?: ClinicalLayoutConfig; message?: string }>(
    "/clinical/layout",
    { layout: normalizeClinicalLayout(layout) }
  );
  if (res.success && res.data?.success) {
    invalidateClinicalLayoutCache();
    return { ok: true };
  }
  return {
    ok: false,
    error: res.data?.message || res.message || res.error || "No se pudo guardar.",
  };
}
