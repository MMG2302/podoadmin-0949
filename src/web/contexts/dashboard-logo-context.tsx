import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { api } from "../lib/api-client";
import { fetchShared, invalidateShared } from "../lib/shared-query";
import {
  DEFAULT_DASHBOARD_LOGO,
  normalizeDashboardLogo,
  type DashboardLogoConfig,
} from "../types/dashboard-logo";

const CACHE_KEY = "clinical:dashboard-logo";

export type DashboardLogoApiData = {
  config: DashboardLogoConfig;
  logoUrl: string | null;
  visible: boolean;
  canEdit: boolean;
  scope: "clinic" | "professional";
};

const DEFAULT_API: DashboardLogoApiData = {
  config: DEFAULT_DASHBOARD_LOGO,
  logoUrl: null,
  visible: false,
  canEdit: false,
  scope: "professional",
};

function mapDashboardLogoResponse(data: {
  config?: DashboardLogoConfig;
  logoUrl?: string | null;
  visible?: boolean;
  canEdit?: boolean;
  scope?: "clinic" | "professional";
}): DashboardLogoApiData {
  const config = normalizeDashboardLogo(data.config);
  const logoUrl = data.logoUrl ?? null;
  const visible = data.visible === true || (config.enabled && Boolean(logoUrl));
  return {
    config,
    logoUrl,
    visible,
    canEdit: Boolean(data.canEdit),
    scope: data.scope ?? "professional",
  };
}

async function fetchDashboardLogoFromApi(): Promise<DashboardLogoApiData> {
  const res = await api.get<{
    success?: boolean;
    config?: DashboardLogoConfig;
    logoUrl?: string | null;
    visible?: boolean;
    canEdit?: boolean;
    scope?: "clinic" | "professional";
  }>("/clinical/dashboard-logo");
  if (res.success && res.data) {
    return mapDashboardLogoResponse(res.data);
  }
  return DEFAULT_API;
}

type DashboardLogoContextValue = DashboardLogoApiData & {
  loading: boolean;
  reload: (force?: boolean) => Promise<void>;
  applyData: (data: DashboardLogoApiData) => void;
};

const DashboardLogoContext = createContext<DashboardLogoContextValue | undefined>(undefined);

export function DashboardLogoProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<DashboardLogoApiData>(DEFAULT_API);
  const [loading, setLoading] = useState(false);

  const applyData = useCallback((data: DashboardLogoApiData) => {
    setState(data);
  }, []);

  const reload = useCallback(
    async (force?: boolean) => {
      if (!user?.id) {
        setState(DEFAULT_API);
        return;
      }
      const clinicalRoles = ["clinic_admin", "podiatrist", "receptionist"];
      if (!clinicalRoles.includes(user.role)) {
        setState(DEFAULT_API);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchShared(CACHE_KEY, fetchDashboardLogoFromApi, {
          staleTime: 5_000,
          force: force === true,
        });
        setState(data);
      } catch {
        setState(DEFAULT_API);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, user?.role]
  );

  useEffect(() => {
    if (authLoading || !user?.id) return;
    const clinicalRoles = ["clinic_admin", "podiatrist", "receptionist"];
    if (!clinicalRoles.includes(user.role)) return;
    void reload(true);
    const onUpdate = () => {
      invalidateDashboardLogoCache();
      void reload(true);
    };
    window.addEventListener("dashboard-logo:updated", onUpdate);
    window.addEventListener("clinic-logo:updated", onUpdate);
    return () => {
      window.removeEventListener("dashboard-logo:updated", onUpdate);
      window.removeEventListener("clinic-logo:updated", onUpdate);
    };
  }, [reload, authLoading, user?.id, user?.role]);

  return (
    <DashboardLogoContext.Provider value={{ ...state, loading, reload, applyData }}>
      {children}
    </DashboardLogoContext.Provider>
  );
}

export function useDashboardLogoContext() {
  const ctx = useContext(DashboardLogoContext);
  if (!ctx) {
    throw new Error("useDashboardLogoContext must be used within DashboardLogoProvider");
  }
  return ctx;
}

export function invalidateDashboardLogoCache() {
  invalidateShared(CACHE_KEY);
}

export async function saveDashboardLogo(
  config: DashboardLogoConfig,
  applyData?: (data: DashboardLogoApiData) => void
): Promise<{ ok: boolean; error?: string }> {
  const res = await api.put<{
    success?: boolean;
    message?: string;
    config?: DashboardLogoConfig;
    logoUrl?: string | null;
    visible?: boolean;
    canEdit?: boolean;
    scope?: "clinic" | "professional";
  }>("/clinical/dashboard-logo", {
    config: normalizeDashboardLogo(config),
  });
  if (res.success && res.data?.success) {
    invalidateDashboardLogoCache();
    const mapped = mapDashboardLogoResponse(res.data);
    applyData?.(mapped);
    return { ok: true };
  }
  return {
    ok: false,
    error: res.message || res.data?.message || res.error || "No se pudo guardar.",
  };
}
