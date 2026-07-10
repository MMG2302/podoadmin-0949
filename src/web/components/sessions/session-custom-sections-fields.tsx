import type { ClinicalLayoutSection, CustomSectionsData } from "../../types/clinical-layout";
import { getCustomSections } from "../../types/clinical-layout";
import { CustomSectionField } from "./custom-section-fields";

type Props = {
  layoutSections: ClinicalLayoutSection[];
  value: CustomSectionsData;
  onChange: (value: CustomSectionsData) => void;
  readOnly?: boolean;
  context?: "session" | "print";
};

export function SessionCustomSectionsFields({
  layoutSections,
  value,
  onChange,
  readOnly = false,
  context = "session",
}: Props) {
  const customs = getCustomSections({ version: 1, sections: layoutSections }, context);
  if (customs.length === 0) return null;

  const patch = (id: string, patchVal: Partial<CustomSectionsData[string]>) => {
    onChange({
      ...value,
      [id]: { ...value[id], ...patchVal },
    });
  };

  return (
    <>
      {customs.map((section) => (
        <div
          key={section.id}
          className="rounded-lg border border-brand-border bg-gray-50/80 dark:bg-gray-900/50 p-4 space-y-2"
        >
          <div>
            <p className="text-sm font-medium text-brand-ink">{section.label}</p>
            {section.hint && <p className="text-xs text-gray-500">{section.hint}</p>}
          </div>
          <CustomSectionField
            section={section}
            value={value[section.id]}
            readOnly={readOnly}
            onPatch={(p) => patch(section.id, p)}
          />
        </div>
      ))}
    </>
  );
}
