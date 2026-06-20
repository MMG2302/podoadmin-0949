import type { ClinicalLayoutSection, CustomSectionsData } from "../../types/clinical-layout";
import { getCustomSections } from "../../types/clinical-layout";

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
        <div key={section.id} className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-2">
          <div>
            <p className="text-sm font-medium text-[#1a1a1a]">{section.label}</p>
            {section.hint && <p className="text-xs text-gray-500">{section.hint}</p>}
          </div>
          {section.kind === "custom_text" ? (
            readOnly ? (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{value[section.id]?.text || "—"}</p>
            ) : (
              <textarea
                rows={3}
                value={value[section.id]?.text ?? ""}
                onChange={(e) => patch(section.id, { text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1a1a1a]"
              />
            )
          ) : (
            <ul className="space-y-2">
              {(section.checklistItems ?? []).map((item) => {
                const checked = value[section.id]?.checks?.[item] ?? false;
                return (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    {readOnly ? (
                      <span>{checked ? "☑" : "☐"}</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          patch(section.id, {
                            checks: { ...value[section.id]?.checks, [item]: e.target.checked },
                          })
                        }
                      />
                    )}
                    <span className="text-gray-700">{item}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}
