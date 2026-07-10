import { ClinicalLayoutDesigner } from "./clinical-layout-designer";
import { useClinicalLayout } from "../../hooks/use-clinical-layout";

export function ClinicalLayoutSettingsSection() {
  const { layout, canEdit, scope, loading, error, reload } = useClinicalLayout();

  if (loading) {
    return (
      <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center text-sm text-gray-500">
        Cargando diseñador…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">{error}</p>
      )}
      <ClinicalLayoutDesigner
        initialLayout={layout}
        canEdit={canEdit}
        scope={scope}
        onSaved={() => void reload()}
      />
    </div>
  );
}
