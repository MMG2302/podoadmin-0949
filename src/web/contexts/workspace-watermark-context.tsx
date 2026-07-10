import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { api } from "../lib/api-client";
import { fetchShared, invalidateShared } from "../lib/shared-query";
import {
  DEFAULT_WORKSPACE_WATERMARK,
  normalizeWorkspaceWatermark,
  type WorkspaceWatermarkConfig,
} from "../types/workspace-watermark";

const CACHE_KEY = "clinical:workspace-watermark";

type WatermarkApiData = {
  config: WorkspaceWatermarkConfig;
  displayImage: string | null;
  scope: "clinic" | "professional";
  canEdit: boolean;
};

const DEFAULT_API: WatermarkApiData = {
  config: DEFAULT_WORKSPACE_WATERMARK,
  displayImage: null,
  scope: "professional",
  canEdit: false,
};

async function fetchWatermarkFromApi(): Promise<WatermarkApiData> {
  const res = await api.get<{
    success?: boolean;
    config?: WorkspaceWatermarkConfig;
    displayImage?: string | null;
    scope?: "clinic" | "professional";
    canEdit?: boolean;
  }>("/clinical/workspace-watermark");
  if (res.success && res.data?.config) {
    return {
      config: normalizeWorkspaceWatermark(res.data.config),
      displayImage: res.data.displayImage ?? null,
      scope: res.data.scope ?? "professional",
      canEdit: Boolean(res.data.canEdit),
    };
  }
  return DEFAULT_API;
}

type WorkspaceWatermarkContextValue = WatermarkApiData & {
  loading: boolean;
  reload: (force?: boolean) => Promise<void>;
};

const WorkspaceWatermarkContext = createContext<WorkspaceWatermarkContextValue | undefined>(undefined);

export function WorkspaceWatermarkProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<WatermarkApiData>(DEFAULT_API);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(
    async (force?: boolean) => {
      if (!user?.id) {
        setState(DEFAULT_API);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchShared(CACHE_KEY, fetchWatermarkFromApi, {
          staleTime: 60_000,
          force,
        });
        setState(data);
      } catch {
        setState(DEFAULT_API);
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void reload();
    const onUpdate = () => {
      invalidateWorkspaceWatermarkCache();
      void reload(true);
    };
    window.addEventListener("workspace-watermark:updated", onUpdate);
    window.addEventListener("clinic-logo:updated", onUpdate);
    return () => {
      window.removeEventListener("workspace-watermark:updated", onUpdate);
      window.removeEventListener("clinic-logo:updated", onUpdate);
    };
  }, [reload]);

  return (
    <WorkspaceWatermarkContext.Provider value={{ ...state, loading, reload }}>
      {children}
    </WorkspaceWatermarkContext.Provider>
  );
}

export function useWorkspaceWatermarkContext() {
  const ctx = useContext(WorkspaceWatermarkContext);
  if (!ctx) throw new Error("useWorkspaceWatermarkContext must be used within WorkspaceWatermarkProvider");
  return ctx;
}

export function invalidateWorkspaceWatermarkCache() {
  invalidateShared(CACHE_KEY);
}

export async function saveWorkspaceWatermark(
  config: WorkspaceWatermarkConfig
): Promise<{ ok: boolean; error?: string }> {
  const res = await api.put<{ success?: boolean; message?: string }>("/clinical/workspace-watermark", {
    config: normalizeWorkspaceWatermark(config),
  });
  if (res.success && res.data?.success) {
    invalidateWorkspaceWatermarkCache();
    return { ok: true };
  }
  return {
    ok: false,
    error: res.message || res.data?.message || res.error || "No se pudo guardar.",
  };
}
