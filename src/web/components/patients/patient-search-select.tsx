import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Patient } from "../../types/clinical";
import { formFieldClassSm, formFieldDisabledClassSm, formHintClass } from "../../lib/form-field-classes";
import {
  fetchPatientById,
  invalidatePatientDetailCache,
  searchPatients,
} from "../../hooks/use-patient-picker";
import { useLanguage } from "../../contexts/language-context";

function patientLabel(p: Patient): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

function patientMeta(p: Patient): string {
  const parts = [p.idNumber, p.phone, p.email].map((s) => String(s ?? "").trim()).filter(Boolean);
  return parts.join(" · ");
}

type Props = {
  value: string;
  onChange: (patientId: string) => void;
  onPatientChange?: (patient: Patient | null) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  emptyHint?: string;
  isPatientEligible?: (patient: Patient) => boolean;
  ineligibleSuffix?: string;
};

export function PatientSearchSelect({
  value,
  onChange,
  onPatientChange,
  disabled = false,
  required = false,
  placeholder,
  emptyHint,
  isPatientEligible,
  ineligibleSuffix,
}: Props) {
  const { t } = useLanguage();
  const pc = t.patientsClinical;
  const resolvedPlaceholder = placeholder ?? pc.searchPlaceholder;
  const resolvedEmptyHint = emptyHint ?? pc.searchEmptyHint;
  const resolvedIneligible = ineligibleSuffix ?? pc.ineligibleSuffix;
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const syncSelected = useCallback(
    async (patientId: string) => {
      if (!patientId) {
        setSelectedPatient(null);
        onPatientChange?.(null);
        return;
      }
      const fromResults = results.find((p) => p.id === patientId);
      if (fromResults) {
        setSelectedPatient(fromResults);
        onPatientChange?.(fromResults);
        return;
      }
      const fetched = await fetchPatientById(patientId);
      setSelectedPatient(fetched);
      onPatientChange?.(fetched);
    },
    [onPatientChange, results]
  );

  useEffect(() => {
    void syncSelected(value);
  }, [value, syncSelected]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      void searchPatients(q, 30).then((list) => {
        setResults(list);
        setLoading(false);
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [query, open]);

  const pickPatient = (patient: Patient) => {
    onChange(patient.id);
    setSelectedPatient(patient);
    onPatientChange?.(patient);
    setQuery("");
    setOpen(false);
  };

  const clearSelection = () => {
    onChange("");
    setSelectedPatient(null);
    onPatientChange?.(null);
    setQuery("");
    setResults([]);
  };

  const refreshSelected = async () => {
    if (!value) return;
    invalidatePatientDetailCache(value);
    await syncSelected(value);
  };

  if (disabled && selectedPatient) {
    return (
      <div className="space-y-1">
        <input
          type="text"
          readOnly
          disabled
          value={patientLabel(selectedPatient)}
          className={formFieldDisabledClassSm}
        />
        {patientMeta(selectedPatient) && (
          <p className={formHintClass}>{patientMeta(selectedPatient)}</p>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative space-y-1">
      {value && selectedPatient && !open ? (
        <div className="flex gap-2">
          <div className="flex-1 min-w-0 rounded-lg border border-brand-border bg-brand-surface px-3 py-2">
            <p className="text-sm font-medium text-brand-ink truncate">{patientLabel(selectedPatient)}</p>
            {patientMeta(selectedPatient) && (
              <p className="text-xs text-brand-muted truncate">{patientMeta(selectedPatient)}</p>
            )}
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="shrink-0 px-3 py-2 text-sm border border-brand-border rounded-lg hover:bg-brand-canvas"
            aria-label={pc.changePatientAria}
          >
            {pc.changePatient}
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            required={required && !value}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={resolvedPlaceholder}
            className={formFieldClassSm}
          />
          {open && (
            <ul
              id={listId}
              role="listbox"
              className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface shadow-lg py-1"
            >
              {loading && (
                <li className="px-3 py-2 text-sm text-brand-muted">{pc.searching}</li>
              )}
              {!loading && query.trim().length < 2 && (
                <li className="px-3 py-2 text-sm text-brand-muted">{resolvedEmptyHint}</li>
              )}
              {!loading &&
                query.trim().length >= 2 &&
                results.length === 0 && (
                  <li className="px-3 py-2 text-sm text-brand-muted">{pc.noResults}</li>
                )}
              {!loading &&
                results.map((p) => {
                  const eligible = isPatientEligible ? isPatientEligible(p) : true;
                  return (
                    <li key={p.id} role="option">
                      <button
                        type="button"
                        onClick={() => pickPatient(p)}
                        className="w-full text-left px-3 py-2 hover:bg-brand-canvas focus:bg-brand-canvas focus:outline-none"
                      >
                        <p className="text-sm font-medium text-brand-ink">
                          {patientLabel(p)}
                          {!eligible ? resolvedIneligible : ""}
                        </p>
                        <p className="text-xs text-brand-muted truncate">{patientMeta(p) || p.folio}</p>
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </>
      )}
      {value && (
        <button
          type="button"
          onClick={() => void refreshSelected()}
          className="text-xs text-brand-muted underline hover:text-brand-ink"
        >
          {pc.refreshPatient}
        </button>
      )}
    </div>
  );
}
