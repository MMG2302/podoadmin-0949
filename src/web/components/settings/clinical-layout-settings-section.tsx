import { ClinicalLayoutDesigner } from "./clinical-layout-designer";
import { useClinicalLayout } from "../../hooks/use-clinical-layout";
import { semanticAlertErrorClass } from "../../lib/form-field-classes";

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
        <div className={`${semanticAlertErrorClass} !p-3`}>{error}</div>
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
