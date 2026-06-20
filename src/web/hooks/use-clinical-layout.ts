import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api-client";
import {
  createDefaultClinicalLayout,
  normalizeClinicalLayout,
  type ClinicalLayoutConfig,
} from "../types/clinical-layout";

export type ClinicalLayoutState = {
  layout: ClinicalLayoutConfig;
  scope: "clinic" | "professional";
  scopeId: string;
  canEdit: boolean;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useClinicalLayout(): ClinicalLayoutState {
  const [layout, setLayout] = useState<ClinicalLayoutConfig>(createDefaultClinicalLayout());
  const [scope, setScope] = useState<"clinic" | "professional">("professional");
  const [scopeId, setScopeId] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<{
      success?: boolean;
      layout?: ClinicalLayoutConfig;
      scope?: "clinic" | "professional";
      scopeId?: string;
      canEdit?: boolean;
    }>("/clinical/layout");
    if (res.success && res.data?.layout) {
      setLayout(normalizeClinicalLayout(res.data.layout));
      setScope(res.data.scope ?? "professional");
      setScopeId(res.data.scopeId ?? "");
      setCanEdit(Boolean(res.data.canEdit));
    } else {
      setLayout(createDefaultClinicalLayout());
      setError(res.error || "No se pudo cargar el diseño clínico.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { layout, scope, scopeId, canEdit, loading, error, reload };
}

export async function saveClinicalLayout(layout: ClinicalLayoutConfig): Promise<{ ok: boolean; error?: string }> {
  const res = await api.put<{ success?: boolean; layout?: ClinicalLayoutConfig; message?: string }>(
    "/clinical/layout",
    { layout: normalizeClinicalLayout(layout) }
  );
  if (res.success && res.data?.success) return { ok: true };
  return {
    ok: false,
    error: res.data?.message || res.message || res.error || "No se pudo guardar.",
  };
}
