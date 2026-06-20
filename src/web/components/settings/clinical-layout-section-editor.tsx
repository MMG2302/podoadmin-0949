import type { ClinicalLayoutSection } from "../../types/clinical-layout";
import { CUSTOM_KIND_META, getSectionOptions } from "../../types/clinical-layout";

type Props = {
  section: ClinicalLayoutSection;
  canEdit: boolean;
  onPatch: (patch: Partial<ClinicalLayoutSection>) => void;
  onAddOption: () => void;
  onUpdateOption: (index: number, value: string) => void;
  onRemoveOption: (index: number) => void;
  onAddTableColumn: () => void;
  onUpdateTableColumn: (index: number, value: string) => void;
  onRemoveTableColumn: (index: number) => void;
};

function OptionListEditor({
  label,
  hint,
  items,
  canEdit,
  onAdd,
  onUpdate,
  onRemove,
  addLabel,
}: {
  label: string;
  hint?: string;
  items: string[];
  canEdit: boolean;
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  addLabel: string;
}) {
  if (!canEdit) return null;
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-5 shrink-0">{index + 1}.</span>
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-950"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={items.length <= 1}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg disabled:opacity-30"
              title="Quitar"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 w-full py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
      >
        {addLabel}
      </button>
    </div>
  );
}

export function ClinicalLayoutSectionEditor({
  section,
  canEdit,
  onPatch,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onAddTableColumn,
  onUpdateTableColumn,
  onRemoveTableColumn,
}: Props) {
  if (section.kind === "builtin") return null;

  const meta = CUSTOM_KIND_META[section.kind];
  const options = getSectionOptions(section);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-950/50 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
        <strong className="text-gray-700 dark:text-gray-300">{meta.label}:</strong> {meta.hint}
      </p>

      {(section.kind === "custom_checklist" ||
        section.kind === "custom_yes_no_na" ||
        section.kind === "custom_single_choice" ||
        section.kind === "custom_multi_choice") && (
        <OptionListEditor
          label={
            section.kind === "custom_checklist"
              ? "Ítems del checklist"
              : section.kind === "custom_yes_no_na"
                ? "Filas SI / NO / N/A"
                : "Opciones"
          }
          hint={
            section.kind === "custom_yes_no_na"
              ? "Cada fila será una pregunta en la sesión."
              : undefined
          }
          items={options}
          canEdit={canEdit}
          onAdd={onAddOption}
          onUpdate={onUpdateOption}
          onRemove={onRemoveOption}
          addLabel={
            section.kind === "custom_checklist"
              ? "+ Añadir ítem"
              : section.kind === "custom_yes_no_na"
                ? "+ Añadir fila"
                : "+ Añadir opción"
          }
        />
      )}

      {section.kind === "custom_number" && canEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
          <input
            type="text"
            value={section.unit ?? "unidad"}
            onChange={(e) => onPatch({ unit: e.target.value })}
            placeholder="min, ml, mm, %…"
            className="w-full max-w-xs px-3 py-2 text-sm border rounded-lg dark:bg-gray-950"
            maxLength={20}
          />
        </div>
      )}

      {section.kind === "custom_scale" && canEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Escala máxima</label>
          <select
            value={section.scaleMax ?? 10}
            onChange={(e) => onPatch({ scaleMax: Number(e.target.value) })}
            className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-950"
          >
            <option value={5}>0 – 5</option>
            <option value={10}>0 – 10</option>
          </select>
        </div>
      )}

      {section.kind === "custom_conditional" && canEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Pregunta SI/NO</label>
          <input
            type="text"
            value={section.conditionalPrompt ?? ""}
            onChange={(e) => onPatch({ conditionalPrompt: e.target.value })}
            placeholder="¿Hubo complicación?"
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-950"
            maxLength={200}
          />
        </div>
      )}

      {section.kind === "custom_table" && canEdit && (
        <>
          <OptionListEditor
            label="Columnas de la tabla"
            items={section.tableColumns ?? ["Columna 1"]}
            canEdit={canEdit}
            onAdd={onAddTableColumn}
            onUpdate={onUpdateTableColumn}
            onRemove={onRemoveTableColumn}
            addLabel="+ Añadir columna"
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Filas</label>
            <input
              type="number"
              min={1}
              max={10}
              value={section.tableRowCount ?? 3}
              onChange={(e) =>
                onPatch({
                  tableRowCount: Math.min(10, Math.max(1, Number(e.target.value) || 3)),
                })
              }
              className="w-24 px-3 py-2 text-sm border rounded-lg dark:bg-gray-950"
            />
          </div>
        </>
      )}
    </div>
  );
}
