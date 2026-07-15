import type { PodiatryArchType, PodiatryFootType } from "../../types/podiatry";
import { PODIATRY_ARCH_OPTIONS, PODIATRY_FOOT_OPTIONS } from "../../types/podiatry";
import {
  formFieldClassSm,
  formHintClass,
  formLabelClassXs,
  formPanelMutedClass,
  formPanelTitleClass,
} from "../../lib/form-field-classes";
import { useLanguage } from "../../contexts/language-context";
import { getPodiatryArchLabel, getPodiatryFootLabel } from "../../i18n/clinical-labels";

type Props = {
  footType: PodiatryFootType | null;
  archType: PodiatryArchType | null;
  onFootTypeChange: (value: PodiatryFootType | null) => void;
  onArchTypeChange: (value: PodiatryArchType | null) => void;
  disabled?: boolean;
};

const selectClass = formFieldClassSm;

export function PodiatryFootFields({
  footType,
  archType,
  onFootTypeChange,
  onArchTypeChange,
  disabled = false,
}: Props) {
  const { t } = useLanguage();
  const exam = t.podiatry.exam;

  return (
    <div className={`${formPanelMutedClass} space-y-3`}>
      <div>
        <p className={formPanelTitleClass}>{exam.morphologyTitle}</p>
        <p className={`${formHintClass} mt-0.5`}>{exam.morphologyHint}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={`${formLabelClassXs} mb-1`}>{exam.footType}</label>
          <select
            disabled={disabled}
            value={footType ?? ""}
            onChange={(e) =>
              onFootTypeChange((e.target.value || null) as PodiatryFootType | null)
            }
            className={selectClass}
          >
            <option value="">{exam.unspecified}</option>
            {PODIATRY_FOOT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {getPodiatryFootLabel(t, o.value)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={`${formLabelClassXs} mb-1`}>{exam.archType}</label>
          <select
            disabled={disabled}
            value={archType ?? ""}
            onChange={(e) =>
              onArchTypeChange((e.target.value || null) as PodiatryArchType | null)
            }
            className={selectClass}
          >
            <option value="">{exam.unspecified}</option>
            {PODIATRY_ARCH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {getPodiatryArchLabel(t, o.value)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
