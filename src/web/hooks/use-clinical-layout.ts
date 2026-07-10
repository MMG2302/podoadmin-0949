import { useClinicalLayoutContext } from "../contexts/clinical-layout-context";
import type { ClinicalLayoutConfig } from "../types/clinical-layout";

export type ClinicalLayoutState = {
  layout: ClinicalLayoutConfig;
  scope: "clinic" | "professional";
  scopeId: string;
  canEdit: boolean;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/** @deprecated Prefer useClinicalLayoutContext directly */
export function useClinicalLayout(): ClinicalLayoutState {
  const ctx = useClinicalLayoutContext();
  return {
    ...ctx,
    reload: () => ctx.reload(true),
  };
}

export { saveClinicalLayout } from "../contexts/clinical-layout-context";
