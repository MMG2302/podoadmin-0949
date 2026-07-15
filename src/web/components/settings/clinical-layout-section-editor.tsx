import type { ClinicalLayoutSection } from "../../types/clinical-layout";
import {
  getSectionOptions,
  getTableColumns,
  MAX_TABLE_COLUMNS,
} from "../../types/clinical-layout";
import { useLanguage } from "../../contexts/language-context";
import { getCustomKindHint, getCustomKindLabel } from "../../i18n/clinical-labels";

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
  removeTitle,
  maxItems,
  maxColumnsLabel,
}: {
  label: string;
  hint?: string;
  items: string[];
  canEdit: boolean;
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  addLabel: string;
  removeTitle: string;
  maxItems?: number;
  maxColumnsLabel?: string;
}) {
  const atMax = maxItems != null && items.length >= maxItems;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-5 shrink-0">{index + 1}.</span>
            {canEdit ? (
              <>
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
                  title={removeTitle}
                >
                  ×
                </button>
              </>
            ) : (
              <span className="flex-1 text-sm text-brand-muted py-2">{item}</span>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <>
          <button
            type="button"
            onClick={onAdd}
            disabled={atMax}
            className="mt-2 w-full py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-brand-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {addLabel}
          </button>
          {atMax && maxItems != null && maxColumnsLabel && (
            <p className="text-xs text-gray-400 mt-1">{maxColumnsLabel}</p>
          )}
        </>
      )}
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
  const { t } = useLanguage();
  const ed = t.clinicalLayout.editor;
  const defaults = t.clinicalLayout.defaults;

  if (section.kind === "builtin") return null;

  const options = getSectionOptions(section);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 bg-brand-canvas/50 rounded-lg p-2 border border-brand-border">
        <strong className="text-brand-muted">{getCustomKindLabel(t, section.kind)}:</strong>{" "}
        {getCustomKindHint(t, section.kind)}
      </p>

      {(section.kind === "custom_checklist" ||
        section.kind === "custom_yes_no_na" ||
        section.kind === "custom_single_choice" ||
        section.kind === "custom_multi_choice") && (
        <OptionListEditor
          label={
            section.kind === "custom_checklist"
              ? ed.checklistItems
              : section.kind === "custom_yes_no_na"
                ? ed.yesNoNaRows
                : ed.options
          }
          hint={section.kind === "custom_yes_no_na" ? ed.yesNoNaRowsHint : undefined}
          items={options}
          canEdit={canEdit}
          onAdd={onAddOption}
          onUpdate={onUpdateOption}
          onRemove={onRemoveOption}
          removeTitle={ed.remove}
          addLabel={
            section.kind === "custom_checklist"
              ? ed.addItem
              : section.kind === "custom_yes_no_na"
                ? ed.addRow
                : ed.addOption
          }
        />
      )}

      {section.kind === "custom_number" && canEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{ed.unit}</label>
          <input
            type="text"
            value={section.unit ?? defaults.unit}
            onChange={(e) => onPatch({ unit: e.target.value })}
            placeholder={ed.unitPlaceholder}
            className="w-full max-w-xs px-3 py-2 text-sm border rounded-lg dark:bg-gray-950"
            maxLength={20}
          />
        </div>
      )}

      {section.kind === "custom_scale" && canEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{ed.scaleMax}</label>
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
          <label className="block text-xs font-medium text-gray-500 mb-1">{ed.conditionalPrompt}</label>
          <input
            type="text"
            value={section.conditionalPrompt ?? ""}
            onChange={(e) => onPatch({ conditionalPrompt: e.target.value })}
            placeholder={defaults.complication}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-950"
            maxLength={200}
          />
        </div>
      )}

      {section.kind === "custom_table" && (
        <>
          <OptionListEditor
            label={ed.tableColumns}
            hint={ed.tableColumnsHint}
            items={getTableColumns(section)}
            canEdit={canEdit}
            onAdd={onAddTableColumn}
            onUpdate={onUpdateTableColumn}
            onRemove={onRemoveTableColumn}
            removeTitle={ed.remove}
            addLabel={ed.addColumn}
            maxItems={MAX_TABLE_COLUMNS}
            maxColumnsLabel={ed.maxColumns.replace("{n}", String(MAX_TABLE_COLUMNS))}
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{ed.tableRows}</label>
            {canEdit ? (
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
            ) : (
              <p className="text-sm text-brand-muted">{section.tableRowCount ?? 3}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
