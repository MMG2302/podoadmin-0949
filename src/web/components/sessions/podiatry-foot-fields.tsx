import type { PodiatryArchType, PodiatryFootType } from "../../types/podiatry";
import { PODIATRY_ARCH_OPTIONS, PODIATRY_FOOT_OPTIONS } from "../../types/podiatry";

type Props = {
  footType: PodiatryFootType | null;
  archType: PodiatryArchType | null;
  onFootTypeChange: (value: PodiatryFootType | null) => void;
  onArchTypeChange: (value: PodiatryArchType | null) => void;
  disabled?: boolean;
};

const selectClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] bg-white text-sm";

export function PodiatryFootFields({
  footType,
  archType,
  onFootTypeChange,
  onArchTypeChange,
  disabled = false,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-[#1a1a1a]">Morfología podológica</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Se usa en la historia imprimible (prioridad sobre texto libre en notas).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de pie</label>
          <select
            disabled={disabled}
            value={footType ?? ""}
            onChange={(e) =>
              onFootTypeChange((e.target.value || null) as PodiatryFootType | null)
            }
            className={selectClass}
          >
            <option value="">Sin especificar</option>
            {PODIATRY_FOOT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de planta / arco</label>
          <select
            disabled={disabled}
            value={archType ?? ""}
            onChange={(e) =>
              onArchTypeChange((e.target.value || null) as PodiatryArchType | null)
            }
            className={selectClass}
          >
            <option value="">Sin especificar</option>
            {PODIATRY_ARCH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
