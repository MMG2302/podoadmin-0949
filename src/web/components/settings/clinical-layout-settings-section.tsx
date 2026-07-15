import { ClinicalLayoutDesigner } from "./clinical-layout-designer";
import { useClinicalLayout } from "../../hooks/use-clinical-layout";
import { useLanguage } from "../../contexts/language-context";
import { semanticAlertErrorClass } from "../../lib/form-field-classes";

export function ClinicalLayoutSettingsSection() {
  const { t } = useLanguage();
  const { layout, canEdit, scope, loading, error, reload } = useClinicalLayout();

  if (loading) {
    return (
      <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center text-sm text-gray-500">
        {t.settings.clinicalLayout.loadingDesigner}
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
