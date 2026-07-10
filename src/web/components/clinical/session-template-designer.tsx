import { useEffect, useMemo, useState } from "react";
import type {
  BuiltInClinicalSectionId,
  ClinicalLayoutConfig,
  ClinicalLayoutSection,
  CustomSectionKind,
} from "../../types/clinical-layout";
import {
  BUILTIN_SECTION_META,
  CUSTOM_KIND_META,
  CUSTOM_SECTION_KINDS,
  createCustomSection,
  getCustomKindLabel,
  getSectionOptions,
  getTableColumns,
  MAX_TABLE_COLUMNS,
  reorderSections,
  type PodiatryBlockKey,
} from "../../types/clinical-layout";
import {
  ensureTemplateSectionLayout,
  getIncludedTemplateSections,
  type SessionTemplateFields,
} from "../../lib/session-templates";
import { ClinicalLayoutSectionEditor } from "../settings/clinical-layout-section-editor";
import {
  CustomSectionField,
  CustomSectionPreview,
} from "../sessions/custom-section-fields";
import {
  PodiatryExaminationFields,
  createDefaultPodiatryExamination,
} from "../sessions/podiatry-examination-fields";

type Props = {
  globalLayout: ClinicalLayoutConfig;
  fields: SessionTemplateFields;
  onChange: (fields: SessionTemplateFields) => void;
};

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className={`inline-flex items-center gap-1.5 text-xs ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-gray-300"
      />
      {label}
    </label>
  );
}

const BUILTIN_FIELD_MAP: Partial<
  Record<BuiltInClinicalSectionId, keyof SessionTemplateFields>
> = {
  anamnesis: "anamnesis",
  physical_examination: "physicalExamination",
  diagnosis: "diagnosis",
  treatment_plan: "treatmentPlan",
  clinical_notes: "clinicalNotes",
};

const PODIATRY_BLOCK_BY_BUILTIN: Partial<Record<BuiltInClinicalSectionId, PodiatryBlockKey>> = {
  podiatry_morphology: "morphology",
  podiatry_sweat: "sweat",
  podiatry_limb: "limb",
  podiatry_helomas: "helomas",
  podiatry_digital: "digital",
  podiatry_onychopathies: "onychopathies",
};

function sectionTypeLabel(section: ClinicalLayoutSection): string {
  if (section.kind === "builtin") {
    const group =
      section.builtinKey && BUILTIN_SECTION_META[section.builtinKey]
        ? BUILTIN_SECTION_META[section.builtinKey].group
        : "custom";
    return group;
  }
  return getCustomKindLabel(section.kind);
}

export function SessionTemplateDesigner({ globalLayout, fields, onChange }: Props) {
  const sectionLayout = ensureTemplateSectionLayout(fields, globalLayout);
  const [selectedId, setSelectedId] = useState<string | null>(
    sectionLayout.sections.find((s) => s.enabled)?.id ?? sectionLayout.sections[0]?.id ?? null
  );
  const [newSectionKind, setNewSectionKind] = useState<CustomSectionKind>("custom_text");
  const [newSectionLabel, setNewSectionLabel] = useState("");

  useEffect(() => {
    if (!fields.sectionLayout?.sections?.length) {
      const initialLayout = ensureTemplateSectionLayout(fields, globalLayout);
      onChange({
        ...fields,
        sectionLayout: initialLayout,
      });
    }
    // Solo inicializar sectionLayout una vez si falta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalLayout]);

  const sorted = useMemo(
    () => [...sectionLayout.sections].sort((a, b) => a.order - b.order),
    [sectionLayout.sections]
  );

  const selected = sorted.find((s) => s.id === selectedId) ?? null;
  const includedCount = getIncludedTemplateSections(sectionLayout).length;

  const patchLayout = (next: ClinicalLayoutConfig) => {
    onChange({ ...fields, sectionLayout: next });
  };

  const patchSection = (id: string, patch: Partial<ClinicalLayoutSection>) => {
    patchLayout({
      ...sectionLayout,
      sections: sectionLayout.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const patchFields = (patch: Partial<SessionTemplateFields>) => {
    onChange({ ...fields, ...patch });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    patchLayout({
      ...sectionLayout,
      sections: reorderSections(
        [...sectionLayout.sections].sort((a, b) => a.order - b.order),
        index,
        target
      ),
    });
  };

  const removeSection = (id: string) => {
    const section = sectionLayout.sections.find((s) => s.id === id);
    if (!section || section.kind === "builtin") return;
    const nextCustom = { ...(fields.customSections ?? {}) };
    delete nextCustom[id];
    const nextSections = sectionLayout.sections
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i }));
    onChange({
      ...fields,
      customSections: nextCustom,
      sectionLayout: { ...sectionLayout, sections: nextSections },
    });
    if (selectedId === id) setSelectedId(null);
  };

  const addCustomSection = () => {
    const section = createCustomSection(newSectionKind, newSectionLabel || "Nueva sección");
    const enabledSection = { ...section, enabled: true, showInSession: true, order: sectionLayout.sections.length };
    patchLayout({
      ...sectionLayout,
      sections: [...sectionLayout.sections, enabledSection],
    });
    setSelectedId(section.id);
    setNewSectionLabel("");
  };

  const patchOptions = (sectionId: string, items: string[]) => {
    const section = sectionLayout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    if (section.kind === "custom_checklist") {
      patchSection(sectionId, { checklistItems: items, options: items });
    } else {
      patchSection(sectionId, { options: items, checklistItems: items });
    }
  };

  const addOption = (sectionId: string) => {
    const section = sectionLayout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const items = [...getSectionOptions(section), `Ítem ${getSectionOptions(section).length + 1}`];
    patchOptions(sectionId, items);
  };

  const updateOption = (sectionId: string, index: number, value: string) => {
    const section = sectionLayout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const items = [...getSectionOptions(section)];
    items[index] = value;
    patchOptions(sectionId, items);
  };

  const removeOption = (sectionId: string, index: number) => {
    const section = sectionLayout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const items = getSectionOptions(section).filter((_, i) => i !== index);
    patchOptions(sectionId, items.length > 0 ? items : ["Ítem 1"]);
  };

  const addTableColumn = (sectionId: string) => {
    const section = sectionLayout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const cols = getTableColumns(section);
    if (cols.length >= MAX_TABLE_COLUMNS) return;
    patchSection(sectionId, { tableColumns: [...cols, `Columna ${cols.length + 1}`] });
  };

  const updateTableColumn = (sectionId: string, index: number, value: string) => {
    const section = sectionLayout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const cols = [...getTableColumns(section)];
    cols[index] = value;
    patchSection(sectionId, { tableColumns: cols });
  };

  const removeTableColumn = (sectionId: string, index: number) => {
    const section = sectionLayout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const cols = getTableColumns(section).filter((_, i) => i !== index);
    patchSection(sectionId, { tableColumns: cols.length > 0 ? cols : ["Columna 1"] });
  };

  const renderBuiltinContent = (section: ClinicalLayoutSection) => {
    if (section.kind !== "builtin" || !section.builtinKey) return null;
    const fieldKey = BUILTIN_FIELD_MAP[section.builtinKey];
    if (fieldKey) {
      return (
        <textarea
          rows={fieldKey === "diagnosis" ? 2 : 3}
          value={String(fields[fieldKey] ?? "")}
          onChange={(e) => patchFields({ [fieldKey]: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-white dark:bg-gray-950 text-brand-ink"
          placeholder={`Contenido predeterminado para ${section.label}`}
        />
      );
    }

    const blockKey = PODIATRY_BLOCK_BY_BUILTIN[section.builtinKey];
    if (blockKey) {
      const visibleBlocks = {
        morphology: false,
        sweat: false,
        limb: false,
        helomas: false,
        digital: false,
        onychopathies: false,
        [blockKey]: true,
      };
      return (
        <PodiatryExaminationFields
          value={fields.podiatryExam ?? createDefaultPodiatryExamination()}
          onChange={(podiatryExam) => patchFields({ podiatryExam })}
          visibleBlocks={visibleBlocks}
        />
      );
    }

    return (
      <p className="text-xs text-brand-muted">
        Esta sección no admite contenido predefinido en plantillas.
      </p>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-brand-muted">
        Marca «Incluir en plantilla» solo en los bloques que correspondan (p. ej. sin helomas en cirugía).
        Al cargar la plantilla en una sesión, solo aparecerán esas secciones; las personalizadas creadas aquí
        se muestran automáticamente sin pasar por Configuración.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border bg-brand-canvas flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-brand-ink">Secciones ({sorted.length})</p>
            <span className="text-xs text-brand-muted">{includedCount} incluidas</span>
          </div>
          <ul className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((section, index) => (
              <li
                key={section.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedId === section.id
                    ? "bg-emerald-50 dark:bg-emerald-950/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                } ${!section.enabled ? "opacity-60" : ""}`}
                onClick={() => setSelectedId(section.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-ink truncate">{section.label}</p>
                    <p className="text-xs text-gray-400 capitalize">{sectionTypeLabel(section)}</p>
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(index, -1);
                      }}
                      className="text-xs px-1.5 py-0.5 border rounded disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === sorted.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(index, 1);
                      }}
                      className="text-xs px-1.5 py-0.5 border rounded disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="p-3 border-t border-brand-border space-y-2">
            <p className="text-xs font-medium text-brand-muted">Añadir sección personalizada</p>
            <select
              value={newSectionKind}
              onChange={(e) => setNewSectionKind(e.target.value as CustomSectionKind)}
              className="w-full text-xs px-2 py-1.5 border rounded-lg dark:bg-gray-950"
            >
              {CUSTOM_SECTION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {CUSTOM_KIND_META[kind].label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400">{CUSTOM_KIND_META[newSectionKind].hint}</p>
            <input
              value={newSectionLabel}
              onChange={(e) => setNewSectionLabel(e.target.value)}
              placeholder="Título de la sección"
              className="w-full text-xs px-2 py-1.5 border rounded-lg dark:bg-gray-950"
            />
            <button
              type="button"
              onClick={addCustomSection}
              className="w-full py-1.5 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              + Añadir sección personalizada
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <div className="bg-brand-surface rounded-xl border border-brand-border p-4 space-y-4">
              <h4 className="font-medium text-brand-ink">Editar sección</h4>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Título</label>
                <input
                  value={selected.label}
                  onChange={(e) => patchSection(selected.id, { label: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-950"
                />
              </div>

              <div className="space-y-2">
                <Toggle
                  label="Incluir en plantilla"
                  checked={selected.enabled}
                  onChange={(enabled) =>
                    patchSection(selected.id, { enabled, showInSession: enabled })
                  }
                />
                <p className="text-xs text-brand-muted bg-brand-canvas/50 rounded-lg p-3 border border-brand-border">
                  Solo las secciones incluidas se cargarán al aplicar esta plantilla en una sesión.
                </p>
              </div>

              {selected.kind !== "builtin" && (
                <ClinicalLayoutSectionEditor
                  section={selected}
                  canEdit
                  onPatch={(patch) => patchSection(selected.id, patch)}
                  onAddOption={() => addOption(selected.id)}
                  onUpdateOption={(i, v) => updateOption(selected.id, i, v)}
                  onRemoveOption={(i) => removeOption(selected.id, i)}
                  onAddTableColumn={() => addTableColumn(selected.id)}
                  onUpdateTableColumn={(i, v) => updateTableColumn(selected.id, i, v)}
                  onRemoveTableColumn={(i) => removeTableColumn(selected.id, i)}
                />
              )}

              {selected.enabled && (
                <div className="space-y-2 border-t border-brand-border pt-4">
                  <p className="text-xs font-medium text-brand-muted">Contenido predeterminado</p>
                  {selected.kind === "builtin" ? (
                    renderBuiltinContent(selected)
                  ) : (
                    <CustomSectionField
                      section={selected}
                      value={fields.customSections?.[selected.id]}
                      onPatch={(val) =>
                        patchFields({
                          customSections: {
                            ...(fields.customSections ?? {}),
                            [selected.id]: { ...(fields.customSections?.[selected.id] ?? {}), ...val },
                          },
                        })
                      }
                    />
                  )}
                </div>
              )}

              {selected.kind !== "builtin" && (
                <button
                  type="button"
                  onClick={() => removeSection(selected.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Eliminar sección personalizada
                </button>
              )}
            </div>
          ) : (
            <div className="bg-brand-canvas rounded-xl border border-dashed border-brand-border p-8 text-center text-sm text-gray-500">
              Selecciona una sección de la lista
            </div>
          )}

          <div className="bg-brand-surface rounded-xl border border-brand-border p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Vista previa — plantilla
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getIncludedTemplateSections(sectionLayout).map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-brand-border bg-gray-50/80 dark:bg-gray-950/50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-brand-ink">{s.label}</p>
                  {s.kind === "builtin" ? (
                    <p className="text-xs text-gray-400 mt-0.5">Campo del sistema</p>
                  ) : (
                    <CustomSectionPreview section={s} />
                  )}
                </div>
              ))}
              {includedCount === 0 && (
                <p className="text-sm text-gray-400">Ninguna sección incluida en la plantilla.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
