import type {
  ClinicalLayoutSection,
  CustomSectionValue,
  TriStateValue,
} from "../../types/clinical-layout";
import {
  ensureTableRows,
  getSectionOptions,
} from "../../types/clinical-layout";

const inputClass =
  "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white text-sm focus:outline-none focus:border-[#1a1a1a] dark:focus:border-gray-400 focus:ring-1 focus:ring-[#1a1a1a] dark:focus:ring-gray-500";
const inputSm =
  "w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-[#1a1a1a] dark:text-white text-xs focus:outline-none focus:border-[#1a1a1a] dark:focus:border-gray-400";

type Props = {
  section: ClinicalLayoutSection;
  value: CustomSectionValue | undefined;
  readOnly?: boolean;
  onPatch: (patch: Partial<CustomSectionValue>) => void;
};

function TriStateRow({
  label,
  value,
  note,
  readOnly,
  onChange,
  onNoteChange,
}: {
  label: string;
  value: TriStateValue;
  note?: string;
  readOnly?: boolean;
  onChange: (v: TriStateValue) => void;
  onNoteChange: (v: string) => void;
}) {
  const display = value === "yes" ? "SI" : value === "na" ? "N/A" : "NO";
  if (readOnly) {
    const show = value === "yes" || note?.trim();
    if (!show) return null;
    return (
      <tr>
        <td className="py-1 pr-2 text-sm text-gray-700">{label}</td>
        <td className="py-1 text-sm font-medium">{display}</td>
        <td className="py-1 text-sm text-gray-500">{note?.trim() || "—"}</td>
      </tr>
    );
  }
  return (
    <tr>
      <td className="py-1 pr-2 text-sm text-gray-700 align-top">{label}</td>
      <td className="py-1">
        <div className="flex flex-wrap gap-3 text-xs">
          {(["yes", "no", "na"] as const).map((opt) => (
            <label key={opt} className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name={`tristate-${label}`}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt === "yes" ? "SI" : opt === "no" ? "NO" : "N/A"}
            </label>
          ))}
        </div>
      </td>
      <td className="py-1">
        <input
          type="text"
          value={note ?? ""}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Obs."
          className={inputSm}
        />
      </td>
    </tr>
  );
}

export function CustomSectionField({ section, value, readOnly = false, onPatch }: Props) {
  const val = value ?? {};

  switch (section.kind) {
    case "custom_text":
      return readOnly ? (
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{val.text || "—"}</p>
      ) : (
        <textarea
          rows={3}
          value={val.text ?? ""}
          onChange={(e) => onPatch({ text: e.target.value })}
          className={inputClass}
        />
      );

    case "custom_short_text":
      return readOnly ? (
        <p className="text-sm text-gray-600">{val.shortText || "—"}</p>
      ) : (
        <input
          type="text"
          value={val.shortText ?? ""}
          onChange={(e) => onPatch({ shortText: e.target.value })}
          className={inputClass}
          maxLength={200}
        />
      );

    case "custom_checklist":
    case "custom_multi_choice":
      return (
        <ul className="space-y-2">
          {getSectionOptions(section).map((item) => {
            const checked = val.checks?.[item] ?? false;
            return (
              <li key={item} className="flex items-center gap-2 text-sm">
                {readOnly ? (
                  <span>{checked ? "☑" : "☐"}</span>
                ) : (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      onPatch({ checks: { ...val.checks, [item]: e.target.checked } })
                    }
                  />
                )}
                <span className="text-gray-700">{item}</span>
              </li>
            );
          })}
        </ul>
      );

    case "custom_yes_no_na": {
      const rows = getSectionOptions(section);
      if (readOnly) {
        const visible = rows.filter(
          (row) => val.triState?.[row] === "yes" || val.triStateNotes?.[row]?.trim()
        );
        if (visible.length === 0) {
          return <p className="text-sm text-gray-500 italic">Sin hallazgos positivos.</p>;
        }
      }
      return (
        <div className="overflow-x-auto">
          <p className="text-xs text-gray-500 mb-2">Marque SI solo si aplica. Sin marcar = NO al guardar.</p>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200">
                <th className="py-1 pr-2 font-medium">Ítem</th>
                <th className="py-1 font-medium">Respuesta</th>
                <th className="py-1 font-medium">Observación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <TriStateRow
                  key={row}
                  label={row}
                  value={val.triState?.[row] ?? null}
                  note={val.triStateNotes?.[row]}
                  readOnly={readOnly}
                  onChange={(v) =>
                    onPatch({ triState: { ...val.triState, [row]: v } })
                  }
                  onNoteChange={(note) =>
                    onPatch({ triStateNotes: { ...val.triStateNotes, [row]: note } })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "custom_single_choice":
      return readOnly ? (
        <p className="text-sm text-gray-600">{val.selected || "—"}</p>
      ) : (
        <div className="space-y-2">
          {getSectionOptions(section).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={`single-${section.id}`}
                checked={val.selected === opt}
                onChange={() => onPatch({ selected: opt })}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );

    case "custom_number":
      return readOnly ? (
        <p className="text-sm text-gray-600">
          {val.number != null ? `${val.number} ${section.unit ?? ""}`.trim() : "—"}
        </p>
      ) : (
        <div className="flex gap-2 items-center max-w-xs">
          <input
            type="number"
            value={val.number ?? ""}
            onChange={(e) =>
              onPatch({
                number: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className={`${inputClass} flex-1`}
          />
          <span className="text-sm text-gray-500 shrink-0">{section.unit ?? "unidad"}</span>
        </div>
      );

    case "custom_scale": {
      const max = section.scaleMax ?? 10;
      return readOnly ? (
        <p className="text-sm text-gray-600">
          {val.number != null ? `${val.number}/${max}` : "—"}
        </p>
      ) : (
        <div className="space-y-2 max-w-md">
          <input
            type="range"
            min={0}
            max={max}
            step={1}
            value={val.number ?? 0}
            onChange={(e) => onPatch({ number: Number(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span className="font-medium text-[#1a1a1a] dark:text-white">
              {val.number ?? 0}/{max}
            </span>
            <span>{max}</span>
          </div>
        </div>
      );
    }

    case "custom_conditional":
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">{section.conditionalPrompt ?? "¿Aplica?"}</p>
          {readOnly ? (
            <>
              <p className="text-sm font-medium">{val.conditionalYes ? "SI" : "NO"}</p>
              {val.conditionalYes && val.text?.trim() && (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{val.text}</p>
              )}
            </>
          ) : (
            <>
              <div className="flex gap-4 text-sm">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`cond-${section.id}`}
                    checked={val.conditionalYes === true}
                    onChange={() => onPatch({ conditionalYes: true })}
                  />
                  SI
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`cond-${section.id}`}
                    checked={val.conditionalYes === false || val.conditionalYes == null}
                    onChange={() => onPatch({ conditionalYes: false, text: "" })}
                  />
                  NO
                </label>
              </div>
              {val.conditionalYes && (
                <textarea
                  rows={2}
                  value={val.text ?? ""}
                  onChange={(e) => onPatch({ text: e.target.value })}
                  placeholder="Detalle…"
                  className={inputClass}
                />
              )}
            </>
          )}
        </div>
      );

    case "custom_table": {
      const cols = section.tableColumns ?? ["Col 1", "Col 2"];
      const rows = ensureTableRows(section, val.tableRows);
      if (readOnly) {
        const hasData = rows.some((r) => r.some((c) => c.trim()));
        if (!hasData) return <p className="text-sm text-gray-500">—</p>;
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  {cols.map((c) => (
                    <th key={c} className="px-2 py-1 text-left text-xs font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) =>
                  row.some((c) => c.trim()) ? (
                    <tr key={ri} className="border-t border-gray-100">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2 py-1 text-gray-700">
                          {cell || "—"}
                        </td>
                      ))}
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        );
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {cols.map((c) => (
                  <th key={c} className="text-xs text-gray-500 font-medium pb-1 pr-1 text-left">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="pr-1 pb-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => {
                          const next = rows.map((r) => [...r]);
                          next[ri][ci] = e.target.value;
                          onPatch({ tableRows: next });
                        }}
                        className={inputSm}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return null;
  }
}

export function CustomSectionPreview({ section }: { section: ClinicalLayoutSection }) {
  switch (section.kind) {
    case "custom_text":
      return <div className="mt-1 h-8 rounded border border-dashed border-gray-200 dark:border-gray-700" />;
    case "custom_short_text":
      return <div className="mt-1 h-6 rounded border border-dashed border-gray-200 dark:border-gray-700" />;
    case "custom_checklist":
    case "custom_multi_choice":
      return (
        <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
          {getSectionOptions(section).map((item) => (
            <li key={item}>☐ {item || "—"}</li>
          ))}
        </ul>
      );
    case "custom_yes_no_na":
      return (
        <p className="mt-1 text-xs text-gray-500">
          Tabla SI/NO/N/A · {getSectionOptions(section).length} filas
        </p>
      );
    case "custom_single_choice":
      return (
        <ul className="mt-1 text-xs text-gray-500 space-y-0.5">
          {getSectionOptions(section).map((opt) => (
            <li key={opt}>○ {opt}</li>
          ))}
        </ul>
      );
    case "custom_number":
      return (
        <p className="mt-1 text-xs text-gray-500">
          Número ({section.unit ?? "unidad"})
        </p>
      );
    case "custom_scale":
      return <p className="mt-1 text-xs text-gray-500">Escala 0–{section.scaleMax ?? 10}</p>;
    case "custom_conditional":
      return (
        <p className="mt-1 text-xs text-gray-500">
          {section.conditionalPrompt ?? "¿Aplica?"} → nota si SI
        </p>
      );
    case "custom_table":
      return (
        <p className="mt-1 text-xs text-gray-500">
          Tabla {section.tableRowCount ?? 3}×{(section.tableColumns ?? []).length}
        </p>
      );
    default:
      return null;
  }
}
