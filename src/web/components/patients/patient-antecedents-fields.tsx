import type { AntecedentEntry, FamilyAntecedentId, PatientMedicalHistory } from "../../types/medical-history";
import {
  createDefaultMedicalHistory,
  FAMILY_ANTECEDENT_IDS,
  FAMILY_ANTECEDENT_LABELS,
} from "../../types/medical-history";

type PersonalFieldsProps = {
  allergies: string;
  medications: string;
  conditions: string;
  onChange: (patch: { allergies?: string; medications?: string; conditions?: string }) => void;
  labels: {
    title: string;
    allergies: string;
    medications: string;
    conditions: string;
    allergiesPlaceholder: string;
    medicationsPlaceholder: string;
    conditionsPlaceholder: string;
  };
};

export function PatientPersonalAntecedentsFields({
  allergies,
  medications,
  conditions,
  onChange,
  labels,
}: PersonalFieldsProps) {
  const inputClass =
    "w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-[#1a1a1a] dark:text-white focus:outline-none focus:border-[#1a1a1a] dark:focus:border-gray-400";

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-[#1a1a1a] dark:text-white">{labels.title}</h4>
      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] dark:text-gray-100 mb-1">
          {labels.allergies}
        </label>
        <input
          type="text"
          value={allergies}
          onChange={(e) => onChange({ allergies: e.target.value })}
          placeholder={labels.allergiesPlaceholder}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] dark:text-gray-100 mb-1">
          {labels.medications}
        </label>
        <input
          type="text"
          value={medications}
          onChange={(e) => onChange({ medications: e.target.value })}
          placeholder={labels.medicationsPlaceholder}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-[#1a1a1a] dark:text-gray-100 mb-1">
          {labels.conditions}
        </label>
        <input
          type="text"
          value={conditions}
          onChange={(e) => onChange({ conditions: e.target.value })}
          placeholder={labels.conditionsPlaceholder}
          className={inputClass}
        />
      </div>
    </div>
  );
}

type FamilyFieldsProps = {
  family: PatientMedicalHistory["family"];
  onChange: (id: FamilyAntecedentId, patch: Partial<AntecedentEntry>) => void;
  readOnly?: boolean;
};

function FamilyAntecedentRow({
  label,
  entry,
  readOnly,
  variant = "standard",
  onChange,
}: {
  label: string;
  entry: AntecedentEntry;
  readOnly?: boolean;
  variant?: "standard" | "other";
  onChange: (patch: Partial<AntecedentEntry>) => void;
}) {
  const inputClass =
    "w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:border-[#1a1a1a] dark:focus:border-gray-400 disabled:bg-gray-100 dark:disabled:bg-gray-900";

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <p className="text-sm font-medium text-[#1a1a1a] dark:text-white">{label}</p>
      {variant === "other" && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Indique si algún familiar tuvo otra enfermedad que considere relevante.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name={`family-${label}`}
            checked={entry.present === true}
            disabled={readOnly}
            onChange={() => onChange({ present: true })}
          />
          SI
        </label>
        <label className="inline-flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name={`family-${label}`}
            checked={entry.present === false}
            disabled={readOnly}
            onChange={() => onChange({ present: false, condition: "", notes: "" })}
          />
          NO
        </label>
      </div>
      {variant === "other" && entry.present === true && (
        <input
          type="text"
          value={entry.condition}
          disabled={readOnly}
          onChange={(e) => onChange({ condition: e.target.value })}
          placeholder="Enfermedad o condición del familiar"
          className={inputClass}
        />
      )}
      {(variant === "standard" || entry.present === true) && (
        <input
          type="text"
          value={entry.notes}
          disabled={readOnly || (variant === "other" && entry.present !== true)}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={variant === "other" ? "Observaciones (opcional)" : "Observaciones (opcional)"}
          className={inputClass}
        />
      )}
    </div>
  );
}

export function PatientFamilyAntecedentsFields({ family, onChange, readOnly }: FamilyFieldsProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-[#1a1a1a] dark:text-white">Antecedentes familiares</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Indique si algún familiar directo padece estas enfermedades.
      </p>
      {FAMILY_ANTECEDENT_IDS.map((id) => (
        <FamilyAntecedentRow
          key={id}
          label={FAMILY_ANTECEDENT_LABELS[id]}
          variant={id === "other" ? "other" : "standard"}
          entry={family[id] ?? createDefaultMedicalHistory().family[id]}
          readOnly={readOnly}
          onChange={(patch) => onChange(id, patch)}
        />
      ))}
    </div>
  );
}

export function PatientPersonalAntecedentsSummary({
  medicalHistory,
  labels,
}: {
  medicalHistory: PatientMedicalHistory;
  labels: {
    title: string;
    allergies: string;
    medications: string;
    conditions: string;
    none: string;
  };
}) {
  const joinOrNone = (items: string[]) => (items.length > 0 ? items.join(", ") : labels.none);

  return (
    <div>
      <h4 className="font-medium text-[#1a1a1a] dark:text-white mb-3">{labels.title}</h4>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-500">{labels.allergies}:</span>
          <span className="ml-2">{joinOrNone(medicalHistory.allergies)}</span>
        </div>
        <div>
          <span className="text-gray-500">{labels.medications}:</span>
          <span className="ml-2">{joinOrNone(medicalHistory.medications)}</span>
        </div>
        <div>
          <span className="text-gray-500">{labels.conditions}:</span>
          <span className="ml-2">{joinOrNone(medicalHistory.conditions)}</span>
        </div>
      </div>
    </div>
  );
}

export function PatientFamilyAntecedentsSummary({
  medicalHistory,
}: {
  medicalHistory: PatientMedicalHistory;
}) {
  return (
    <div>
      <h4 className="font-medium text-[#1a1a1a] dark:text-white mb-3">Antecedentes familiares</h4>
      <div className="space-y-2 text-sm">
        {FAMILY_ANTECEDENT_IDS.map((id) => {
          const entry = medicalHistory.family[id];
          const siNo = entry?.present === true ? "SI" : "NO";
          if (id === "other") {
            const condition = entry?.condition?.trim();
            const notes = entry?.notes?.trim();
            return (
              <div key={id} className="flex flex-wrap gap-x-2">
                <span className="text-gray-500">{FAMILY_ANTECEDENT_LABELS.other}:</span>
                <span className="font-medium">{siNo}</span>
                {entry?.present === true && condition ? (
                  <span className="text-gray-600">— {condition}</span>
                ) : null}
                {entry?.present === true && notes ? (
                  <span className="text-gray-600">{condition ? `(${notes})` : `— ${notes}`}</span>
                ) : null}
              </div>
            );
          }
          return (
            <div key={id} className="flex flex-wrap gap-x-2">
              <span className="text-gray-500">{FAMILY_ANTECEDENT_LABELS[id]}:</span>
              <span className="font-medium">{siNo}</span>
              {entry?.notes ? <span className="text-gray-600">— {entry.notes}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
