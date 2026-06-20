import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import {
  DEFAULT_WORKSPACE_WATERMARK,
  normalizeWorkspaceWatermark,
  type WorkspaceWatermarkConfig,
} from "../types/workspace-watermark";

export function useWorkspaceWatermark() {
  const [config, setConfig] = useState<WorkspaceWatermarkConfig>(DEFAULT_WORKSPACE_WATERMARK);
  const [displayImage, setDisplayImage] = useState<string | null>(null);
  const [scope, setScope] = useState<"clinic" | "professional">("professional");
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{
      success?: boolean;
      config?: WorkspaceWatermarkConfig;
      displayImage?: string | null;
      scope?: "clinic" | "professional";
      canEdit?: boolean;
    }>("/clinical/workspace-watermark");
    if (res.success && res.data?.config) {
      setConfig(normalizeWorkspaceWatermark(res.data.config));
      setDisplayImage(res.data.displayImage ?? null);
      setScope(res.data.scope ?? "professional");
      setCanEdit(Boolean(res.data.canEdit));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { config, displayImage, scope, canEdit, loading, reload };
}

export async function saveWorkspaceWatermark(
  config: WorkspaceWatermarkConfig
): Promise<{ ok: boolean; error?: string }> {
  const res = await api.put<{ success?: boolean; message?: string }>("/clinical/workspace-watermark", {
    config: normalizeWorkspaceWatermark(config),
  });
  if (res.success && res.data?.success) return { ok: true };
  return {
    ok: false,
    error: res.data?.message || res.message || res.error || "No se pudo guardar.",
  };
}
