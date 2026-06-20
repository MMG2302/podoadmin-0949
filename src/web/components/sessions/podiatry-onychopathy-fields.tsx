import type { OnychopathyEntry } from "../../types/podiatry";
import { PODIATRY_ONYCHOPATHY_OPTIONS } from "../../types/podiatry";

type Props = {
  value: OnychopathyEntry[];
  onChange: (value: OnychopathyEntry[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
};

const inputClass =
  "w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-[#1a1a1a]";

export function PodiatryOnychopathyFields({ value, onChange, disabled = false, readOnly = false }: Props) {
  const byId = new Map(value.map((e) => [e.id, e]));

  const update = (id: OnychopathyEntry["id"], patch: Partial<OnychopathyEntry>) => {
    onChange(
      PODIATRY_ONYCHOPATHY_OPTIONS.map((o) => {
        const current = byId.get(o.id) ?? { id: o.id, present: null, toesLeft: "", toesRight: "" };
        return o.id === id ? { ...current, ...patch } : current;
      })
    );
  };

  if (readOnly) {
    const marked = value.filter((e) => e.present !== null);
    if (marked.length === 0) {
      return <p className="text-sm text-gray-400">Sin onicopatías registradas.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 font-medium">Onicopatía</th>
              <th className="p-2 w-12">SI</th>
              <th className="p-2 w-12">NO</th>
              <th className="p-2">Dedos izq.</th>
              <th className="p-2">Dedos der.</th>
            </tr>
          </thead>
          <tbody>
            {marked.map((row) => {
              const label = PODIATRY_ONYCHOPATHY_OPTIONS.find((o) => o.id === row.id)?.label ?? row.id;
              return (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="p-2">{label}</td>
                  <td className="p-2 text-center">{row.present === true ? "✓" : ""}</td>
                  <td className="p-2 text-center">{row.present === false ? "✓" : ""}</td>
                  <td className="p-2 text-gray-600">{row.toesLeft || "—"}</td>
                  <td className="p-2 text-gray-600">{row.toesRight || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-2">
      <div>
        <p className="text-sm font-medium text-[#1a1a1a]">Onicopatías</p>
        <p className="text-xs text-gray-500">Marque SI/NO y anote dedos afectados (1=hallux … 5=meñique).</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2 font-medium min-w-[120px]">Onicopatía</th>
              <th className="p-2 w-14">SI</th>
              <th className="p-2 w-14">NO</th>
              <th className="p-2 min-w-[72px]">Izq.</th>
              <th className="p-2 min-w-[72px]">Der.</th>
            </tr>
          </thead>
          <tbody>
            {PODIATRY_ONYCHOPATHY_OPTIONS.map((o) => {
              const row = byId.get(o.id) ?? { id: o.id, present: null, toesLeft: "", toesRight: "" };
              return (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="p-2 font-medium text-gray-800">{o.label}</td>
                  <td className="p-2 text-center">
                    <input
                      type="radio"
                      name={`ony-${o.id}`}
                      disabled={disabled}
                      checked={row.present === true}
                      onChange={() => update(o.id, { present: true })}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="radio"
                      name={`ony-${o.id}`}
                      disabled={disabled}
                      checked={row.present === false}
                      onChange={() => update(o.id, { present: false })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      disabled={disabled}
                      value={row.toesLeft}
                      onChange={(e) => update(o.id, { toesLeft: e.target.value })}
                      placeholder="ej. 1,2"
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      disabled={disabled}
                      value={row.toesRight}
                      onChange={(e) => update(o.id, { toesRight: e.target.value })}
                      placeholder="ej. 1"
                      className={inputClass}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
