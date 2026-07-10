import { useEffect, useMemo, useState } from "react";
import type {
  ClinicalLayoutConfig,
  ClinicalLayoutSection,
  CustomSectionKind,
} from "../../types/clinical-layout";
import {
  BUILTIN_SECTION_META,
  createCustomSection,
  createDefaultClinicalLayout,
  CUSTOM_KIND_META,
  CUSTOM_SECTION_KINDS,
  getCustomKindLabel,
  getSectionOptions,
  getTableColumns,
  MAX_TABLE_COLUMNS,
  reorderSections,
} from "../../types/clinical-layout";
import { saveClinicalLayout } from "../../hooks/use-clinical-layout";
import { ClinicalLayoutSectionEditor } from "./clinical-layout-section-editor";
import { CustomSectionPreview } from "../sessions/custom-section-fields";

type Props = {
  initialLayout: ClinicalLayoutConfig;
  canEdit: boolean;
  scope: "clinic" | "professional";
  onSaved?: (layout: ClinicalLayoutConfig) => void;
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

export function ClinicalLayoutDesigner({ initialLayout, canEdit, scope, onSaved }: Props) {
  const [layout, setLayout] = useState<ClinicalLayoutConfig>(initialLayout);
  const [selectedId, setSelectedId] = useState<string | null>(initialLayout.sections[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newSectionKind, setNewSectionKind] = useState<CustomSectionKind>("custom_text");
  const [newSectionLabel, setNewSectionLabel] = useState("");

  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);

  const sorted = useMemo(
    () => [...layout.sections].sort((a, b) => a.order - b.order),
    [layout.sections]
  );

  const selected = sorted.find((s) => s.id === selectedId) ?? null;

  const patchSection = (id: string, patch: Partial<ClinicalLayoutSection>) => {
    setLayout((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    setLayout((prev) => ({
      ...prev,
      sections: reorderSections(
        [...prev.sections].sort((a, b) => a.order - b.order),
        index,
        target
      ),
    }));
  };

  const removeSection = (id: string) => {
    const section = layout.sections.find((s) => s.id === id);
    if (!section || section.kind === "builtin") return;
    setLayout((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })),
    }));
    if (selectedId === id) setSelectedId(null);
  };

  const addCustomSection = () => {
    const section = createCustomSection(newSectionKind, newSectionLabel || "Nueva sección");
    setLayout((prev) => ({
      ...prev,
      sections: [...prev.sections, { ...section, order: prev.sections.length }],
    }));
    setSelectedId(section.id);
    setNewSectionLabel("");
    setMessage(null);
  };

  const patchOptions = (sectionId: string, items: string[]) => {
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    if (section.kind === "custom_checklist") {
      patchSection(sectionId, { checklistItems: items, options: items });
    } else {
      patchSection(sectionId, { options: items, checklistItems: items });
    }
  };

  const addOption = (sectionId: string) => {
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const items = [...getSectionOptions(section), `Ítem ${getSectionOptions(section).length + 1}`];
    patchOptions(sectionId, items);
  };

  const updateOption = (sectionId: string, index: number, value: string) => {
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const items = [...getSectionOptions(section)];
    items[index] = value;
    patchOptions(sectionId, items);
  };

  const removeOption = (sectionId: string, index: number) => {
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const items = getSectionOptions(section).filter((_, i) => i !== index);
    patchOptions(sectionId, items.length > 0 ? items : ["Ítem 1"]);
  };

  const addTableColumn = (sectionId: string) => {
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const cols = getTableColumns(section);
    if (cols.length >= MAX_TABLE_COLUMNS) return;
    patchSection(sectionId, { tableColumns: [...cols, `Columna ${cols.length + 1}`] });
  };

  const updateTableColumn = (sectionId: string, index: number, value: string) => {
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const cols = [...getTableColumns(section)];
    cols[index] = value;
    patchSection(sectionId, { tableColumns: cols });
  };

  const removeTableColumn = (sectionId: string, index: number) => {
    const section = layout.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const cols = getTableColumns(section).filter((_, i) => i !== index);
    patchSection(sectionId, { tableColumns: cols.length > 0 ? cols : ["Columna 1"] });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const res = await saveClinicalLayout(layout);
    setSaving(false);
    if (res.ok) {
      setMessage("Diseño guardado correctamente.");
      onSaved?.(layout);
    } else {
      setMessage(res.error || "Error al guardar.");
    }
  };

  const resetDefaults = () => {
    if (!confirm("¿Restaurar todas las secciones al diseño predeterminado? Se perderán las personalizadas.")) return;
    const defaults = createDefaultClinicalLayout();
    setLayout(defaults);
    setSelectedId(defaults.sections[0]?.id ?? null);
  };

  const sectionTypeLabel = (section: ClinicalLayoutSection) => {
    if (section.kind === "builtin") {
      const group =
        section.builtinKey && BUILTIN_SECTION_META[section.builtinKey]
          ? BUILTIN_SECTION_META[section.builtinKey].group
          : "custom";
      return group;
    }
    return getCustomKindLabel(section.kind);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-brand-ink">Diseñador de historia clínica</h3>
          <p className="text-sm text-brand-muted mt-1 max-w-2xl">
            Activa o desactiva bloques para sesiones e impresión. Añade secciones personalizadas (texto, SI/NO,
            opciones, escala, tabla…) para pedicura, podología o tu flujo.{" "}
            {scope === "clinic"
              ? "Aplica a toda la clínica."
              : "Aplica a tu consultorio independiente."}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={resetDefaults}
              className="px-3 py-2 text-sm border border-brand-border rounded-lg"
            >
              Restaurar predeterminado
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-brand-ink text-brand-ink-fg rounded-lg disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar diseño"}
            </button>
          </div>
        )}
      </div>

      {!canEdit && (
        <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3">
          Solo lectura: el administrador de la clínica configura el diseño compartido.
        </p>
      )}

      {message && (
        <p className="text-sm text-blue-800 dark:text-blue-200 bg-semantic-info-bg rounded-lg p-3">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border bg-brand-canvas">
            <p className="text-sm font-medium text-brand-ink">Secciones ({sorted.length})</p>
          </div>
          <ul className="max-h-[420px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
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
                      <p className="text-sm font-medium text-brand-ink truncate">
                        {section.label}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{sectionTypeLabel(section)}</p>
                    </div>
                    {canEdit && (
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
                    )}
                  </div>
                </li>
            ))}
          </ul>

          {canEdit && (
            <div className="p-3 border-t border-brand-border space-y-2">
              <p className="text-xs font-medium text-brand-muted">Añadir sección</p>
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
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <div className="bg-brand-surface rounded-xl border border-brand-border p-4 space-y-4">
              <h4 className="font-medium text-brand-ink">Editar sección</h4>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Título</label>
                <input
                  disabled={!canEdit}
                  value={selected.label}
                  onChange={(e) => patchSection(selected.id, { label: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-950 disabled:opacity-60"
                />
                {selected.kind === "builtin" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Puedes personalizar el título visible en sesión e impresión.
                  </p>
                )}
              </div>
              {canEdit && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-4">
                    <Toggle
                      label={
                        selected.kind === "builtin" && selected.builtinKey?.startsWith("patient_")
                          ? "En ficha paciente"
                          : "Activa"
                      }
                      checked={selected.enabled}
                      onChange={(enabled) => patchSection(selected.id, { enabled })}
                    />
                    {!(selected.kind === "builtin" && selected.builtinKey?.startsWith("patient_")) && (
                    <Toggle
                      label="En sesión"
                      checked={selected.showInSession}
                      disabled={!selected.enabled}
                      onChange={(showInSession) => patchSection(selected.id, { showInSession })}
                    />
                    )}
                    <Toggle
                      label="En impresión"
                      checked={selected.showInPrint}
                      disabled={!selected.enabled}
                      onChange={(showInPrint) => patchSection(selected.id, { showInPrint })}
                    />
                  </div>
                  <div className="text-xs text-brand-muted space-y-1 bg-brand-canvas/50 rounded-lg p-3 border border-brand-border">
                    {selected.kind === "builtin" && selected.builtinKey?.startsWith("patient_") ? (
                      <>
                        <p>
                          <strong className="text-brand-muted">En ficha paciente:</strong> muestra u
                          oculta el campo al crear, editar o ver un paciente.
                        </p>
                        <p>
                          <strong className="text-brand-muted">En impresión:</strong> incluye los
                          antecedentes en la historia clínica podológica impresa.
                        </p>
                      </>
                    ) : (
                      <>
                    <p>
                      <strong className="text-brand-muted">Activa:</strong> incluye o excluye la
                      sección del flujo clínico.
                    </p>
                    <p>
                      <strong className="text-brand-muted">En sesión:</strong> visible al crear o
                      editar una sesión.
                    </p>
                    <p>
                      <strong className="text-brand-muted">En impresión:</strong> incluida en el
                      historial imprimible (solo contenido con datos).
                    </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selected.kind !== "builtin" && (
                <ClinicalLayoutSectionEditor
                  section={selected}
                  canEdit={canEdit}
                  onPatch={(patch) => patchSection(selected.id, patch)}
                  onAddOption={() => addOption(selected.id)}
                  onUpdateOption={(i, v) => updateOption(selected.id, i, v)}
                  onRemoveOption={(i) => removeOption(selected.id, i)}
                  onAddTableColumn={() => addTableColumn(selected.id)}
                  onUpdateTableColumn={(i, v) => updateTableColumn(selected.id, i, v)}
                  onRemoveTableColumn={(i) => removeTableColumn(selected.id, i)}
                />
              )}

              {selected.kind !== "builtin" && canEdit && (
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
              Vista previa — formulario de sesión
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sorted
                .filter((s) => s.enabled && s.showInSession)
                .map((s) => (
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
              {sorted.filter((s) => s.enabled && s.showInSession).length === 0 && (
                <p className="text-sm text-gray-400">Ninguna sección visible en sesión.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
