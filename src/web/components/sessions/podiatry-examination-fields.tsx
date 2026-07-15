import type { ReactNode } from "react";
import type {
  DigitalAlterationEntry,
  HelomaEntry,
  LimbAssessmentEntry,
  OnychopathyEntry,
  PodiatryArchType,
  PodiatryFootType,
  SweatDisorderEntry,
} from "../../types/podiatry";
import {
  PODIATRY_DIGITAL_OPTIONS,
  PODIATRY_HELOMA_OPTIONS,
  PODIATRY_LIMB_OPTIONS,
  PODIATRY_ONYCHOPATHY_OPTIONS,
  PODIATRY_SWEAT_OPTIONS,
  createDefaultDigitalAlterations,
  createDefaultHelomas,
  createDefaultLimbAssessment,
  createDefaultOnychopathies,
  createDefaultSweatDisorders,
  finalizeDigitalAlterations,
  finalizeHelomas,
  finalizeLimbAssessment,
  finalizeOnychopathies,
  finalizeSweatDisorders,
} from "../../types/podiatry";
import { PodiatryFootFields } from "./podiatry-foot-fields";
import {
  formFieldClassXs,
  formHintClass,
  formPanelMutedClass,
  formPanelTitleClass,
  formTableClass,
  formTableHeadClass,
  formTableRowBorderClass,
} from "../../lib/form-field-classes";
import { useLanguage } from "../../contexts/language-context";
import {
  getDigitalLabel,
  getHelomaLabel,
  getLimbLabel,
  getOnychopathyLabel,
  getSweatLabel,
} from "../../i18n/clinical-labels";

const inputClass = formFieldClassXs;

export type PodiatryExaminationValue = {
  footType: PodiatryFootType | null;
  archType: PodiatryArchType | null;
  sweatDisorders: SweatDisorderEntry[];
  limbAssessment: LimbAssessmentEntry[];
  helomas: HelomaEntry[];
  digitalAlterations: DigitalAlterationEntry[];
  onychopathies: OnychopathyEntry[];
};

export function createDefaultPodiatryExamination(): PodiatryExaminationValue {
  return {
    footType: null,
    archType: null,
    sweatDisorders: createDefaultSweatDisorders(),
    limbAssessment: createDefaultLimbAssessment(),
    helomas: createDefaultHelomas(),
    digitalAlterations: createDefaultDigitalAlterations(),
    onychopathies: createDefaultOnychopathies(),
  };
}

export function finalizePodiatryExamination(exam: PodiatryExaminationValue): PodiatryExaminationValue {
  return {
    ...exam,
    sweatDisorders: finalizeSweatDisorders(exam.sweatDisorders),
    limbAssessment: finalizeLimbAssessment(exam.limbAssessment),
    helomas: finalizeHelomas(exam.helomas),
    digitalAlterations: finalizeDigitalAlterations(exam.digitalAlterations),
    onychopathies: finalizeOnychopathies(exam.onychopathies),
  };
}

type Props = {
  value: PodiatryExaminationValue;
  onChange: (value: PodiatryExaminationValue) => void;
  readOnly?: boolean;
  disabled?: boolean;
  /** Si se omite, se muestran todos los bloques podológicos */
  visibleBlocks?: Partial<Record<
    | "morphology"
    | "sweat"
    | "limb"
    | "helomas"
    | "digital"
    | "onychopathies",
    boolean
  >>;
};

function blockOn(visibleBlocks: Props["visibleBlocks"], key: NonNullable<Props["visibleBlocks"]> extends infer T ? keyof T : never): boolean {
  if (!visibleBlocks) return true;
  return visibleBlocks[key as keyof typeof visibleBlocks] !== false;
}

function SectionShell({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${formPanelMutedClass} space-y-2`}>
      <div>
        <p className={formPanelTitleClass}>{title}</p>
        {hint && <p className={`${formHintClass} mt-0.5`}>{hint}</p>}
      </div>
      <div className="-mx-1 overflow-x-auto overscroll-contain">{children}</div>
    </div>
  );
}

function PresentCell({
  name,
  present,
  disabled,
  onChange,
}: {
  name: string;
  present: boolean | null;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <>
      <td className="p-2 text-center">
        <input
          type="radio"
          name={name}
          disabled={disabled}
          checked={present === true}
          onChange={() => onChange(true)}
        />
      </td>
      <td className="p-2 text-center">
        <input
          type="radio"
          name={name}
          disabled={disabled}
          checked={present === false}
          onChange={() => onChange(false)}
        />
      </td>
    </>
  );
}

function PresentReadCells({ present }: { present: boolean | null }) {
  return (
    <>
      <td className="p-2 text-center">{present === true ? "✓" : "—"}</td>
      <td className="p-2 text-center">{present !== true ? "✓" : "—"}</td>
    </>
  );
}

export function PodiatryExaminationFields({ value, onChange, readOnly = false, disabled = false, visibleBlocks }: Props) {
  const { t } = useLanguage();
  const exam = t.podiatry.exam;
  const dash = exam.dash;
  const siNoHint = exam.siNoHint;

  const patch = (partial: Partial<PodiatryExaminationValue>) =>
    onChange({ ...value, ...partial });

  const showMorphology = blockOn(visibleBlocks, "morphology");
  const showSweat = blockOn(visibleBlocks, "sweat");
  const showLimb = blockOn(visibleBlocks, "limb");
  const showHelomas = blockOn(visibleBlocks, "helomas");
  const showDigital = blockOn(visibleBlocks, "digital");
  const showOnychopathies = blockOn(visibleBlocks, "onychopathies");

  if (!showMorphology && !showSweat && !showLimb && !showHelomas && !showDigital && !showOnychopathies) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showMorphology && (
        <PodiatryFootFields
          footType={value.footType}
          archType={value.archType}
          onFootTypeChange={(footType) => patch({ footType })}
          onArchTypeChange={(archType) => patch({ archType })}
          disabled={disabled || readOnly}
        />
      )}

      {showSweat && (
      <SectionShell title={exam.sweatTitle} hint={siNoHint}>
        <table className={formTableClass}>
          <thead className={formTableHeadClass}>
            <tr>
              <th className="text-left p-2">{exam.disorder}</th>
              <th className="p-2 w-14">{exam.yes}</th>
              <th className="p-2 w-14">{exam.no}</th>
              <th className="p-2">{exam.obs}</th>
            </tr>
          </thead>
          <tbody>
            {PODIATRY_SWEAT_OPTIONS.map((o) => {
              const row = value.sweatDisorders.find((r) => r.id === o.id)!;
              return (
                <tr key={o.id} className={formTableRowBorderClass}>
                  <td className="p-2 font-medium">{getSweatLabel(t, o.id)}</td>
                  {readOnly ? (
                    <PresentReadCells present={row.present} />
                  ) : (
                    <PresentCell
                      name={`sweat-${o.id}`}
                      present={row.present}
                      disabled={disabled}
                      onChange={(present) =>
                        patch({
                          sweatDisorders: value.sweatDisorders.map((r) =>
                            r.id === o.id ? { ...r, present } : r
                          ),
                        })
                      }
                    />
                  )}
                  <td className="p-2">
                    {readOnly ? (
                      <span className="text-brand-muted">{row.notes || dash}</span>
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.notes}
                        onChange={(e) =>
                          patch({
                            sweatDisorders: value.sweatDisorders.map((r) =>
                              r.id === o.id ? { ...r, notes: e.target.value } : r
                            ),
                          })
                        }
                        className={inputClass}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionShell>
      )}

      {showLimb && (
      <SectionShell title={exam.limbTitle} hint={siNoHint}>
        <table className={formTableClass}>
          <thead className={formTableHeadClass}>
            <tr>
              <th className="text-left p-2">{exam.sign}</th>
              <th className="p-2" colSpan={2}>
                {exam.left}
              </th>
              <th className="p-2" colSpan={2}>
                {exam.right}
              </th>
              <th className="p-2">{exam.obs}</th>
            </tr>
            <tr>
              <th></th>
              <th className="p-1">{exam.yes}</th>
              <th className="p-1">{exam.no}</th>
              <th className="p-1">{exam.yes}</th>
              <th className="p-1">{exam.no}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {PODIATRY_LIMB_OPTIONS.map((o) => {
              const row = value.limbAssessment.find((r) => r.id === o.id)!;
              const sideRadio = (side: "left" | "right", v: boolean) =>
                patch({
                  limbAssessment: value.limbAssessment.map((r) =>
                    r.id === o.id ? { ...r, [side]: v } : r
                  ),
                });
              const sideRead = (v: boolean | null) => (v === true ? exam.yes : exam.no);
              return (
                <tr key={o.id} className={formTableRowBorderClass}>
                  <td className="p-2 font-medium">{getLimbLabel(t, o.id)}</td>
                  {readOnly ? (
                    <>
                      <td className="p-2 text-center" colSpan={2}>
                        {sideRead(row.left)}
                      </td>
                      <td className="p-2 text-center" colSpan={2}>
                        {sideRead(row.right)}
                      </td>
                    </>
                  ) : (
                    <>
                      <PresentCell
                        name={`limb-l-${o.id}`}
                        present={row.left}
                        disabled={disabled}
                        onChange={(v) => sideRadio("left", v)}
                      />
                      <PresentCell
                        name={`limb-r-${o.id}`}
                        present={row.right}
                        disabled={disabled}
                        onChange={(v) => sideRadio("right", v)}
                      />
                    </>
                  )}
                  <td className="p-2">
                    {readOnly ? (
                      row.notes || dash
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.notes}
                        onChange={(e) =>
                          patch({
                            limbAssessment: value.limbAssessment.map((r) =>
                              r.id === o.id ? { ...r, notes: e.target.value } : r
                            ),
                          })
                        }
                        className={inputClass}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionShell>
      )}

      {showHelomas && (
      <SectionShell title={exam.helomasTitle} hint={`${siNoHint} ${exam.helomasHint}`}>
        <table className={formTableClass}>
          <thead className={formTableHeadClass}>
            <tr>
              <th className="text-left p-2">{exam.type}</th>
              <th className="p-2 w-14">{exam.yes}</th>
              <th className="p-2 w-14">{exam.no}</th>
              <th className="p-2">{exam.left}</th>
              <th className="p-2">{exam.right}</th>
              <th className="p-2">{exam.obs}</th>
            </tr>
          </thead>
          <tbody>
            {PODIATRY_HELOMA_OPTIONS.map((o) => {
              const row = value.helomas.find((r) => r.id === o.id)!;
              return (
                <tr key={o.id} className={formTableRowBorderClass}>
                  <td className="p-2 font-medium">{getHelomaLabel(t, o.id)}</td>
                  {readOnly ? (
                    <PresentReadCells present={row.present} />
                  ) : (
                    <PresentCell
                      name={`heloma-${o.id}`}
                      present={row.present}
                      disabled={disabled}
                      onChange={(present) =>
                        patch({
                          helomas: value.helomas.map((r) =>
                            r.id === o.id ? { ...r, present } : r
                          ),
                        })
                      }
                    />
                  )}
                  <td className="p-2">
                    {readOnly ? (
                      row.locationLeft || dash
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.locationLeft}
                        onChange={(e) =>
                          patch({
                            helomas: value.helomas.map((r) =>
                              r.id === o.id ? { ...r, locationLeft: e.target.value } : r
                            ),
                          })
                        }
                        className={inputClass}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    {readOnly ? (
                      row.locationRight || dash
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.locationRight}
                        onChange={(e) =>
                          patch({
                            helomas: value.helomas.map((r) =>
                              r.id === o.id ? { ...r, locationRight: e.target.value } : r
                            ),
                          })
                        }
                        className={inputClass}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    {readOnly ? (
                      row.notes || dash
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.notes}
                        onChange={(e) =>
                          patch({
                            helomas: value.helomas.map((r) =>
                              r.id === o.id ? { ...r, notes: e.target.value } : r
                            ),
                          })
                        }
                        className={inputClass}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionShell>
      )}

      {showDigital && (
      <SectionShell title={exam.digitalTitle} hint={siNoHint}>
        <table className={formTableClass}>
          <thead className={formTableHeadClass}>
            <tr>
              <th className="text-left p-2">{exam.alteration}</th>
              <th className="p-2 w-14">{exam.yes}</th>
              <th className="p-2 w-14">{exam.no}</th>
              <th className="p-2">{exam.left}</th>
              <th className="p-2">{exam.right}</th>
            </tr>
          </thead>
          <tbody>
            {PODIATRY_DIGITAL_OPTIONS.map((o) => {
              const row = value.digitalAlterations.find((r) => r.id === o.id)!;
              return (
                <tr key={o.id} className={formTableRowBorderClass}>
                  <td className="p-2 font-medium">{getDigitalLabel(t, o.id)}</td>
                  {readOnly ? (
                    <PresentReadCells present={row.present} />
                  ) : (
                    <PresentCell
                      name={`digital-${o.id}`}
                      present={row.present}
                      disabled={disabled}
                      onChange={(present) =>
                        patch({
                          digitalAlterations: value.digitalAlterations.map((r) =>
                            r.id === o.id ? { ...r, present } : r
                          ),
                        })
                      }
                    />
                  )}
                  <td className="p-2">
                    {readOnly ? (
                      row.locationLeft || dash
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.locationLeft}
                        onChange={(e) =>
                          patch({
                            digitalAlterations: value.digitalAlterations.map((r) =>
                              r.id === o.id ? { ...r, locationLeft: e.target.value } : r
                            ),
                          })
                        }
                        className={inputClass}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    {readOnly ? (
                      row.locationRight || dash
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.locationRight}
                        onChange={(e) =>
                          patch({
                            digitalAlterations: value.digitalAlterations.map((r) =>
                              r.id === o.id ? { ...r, locationRight: e.target.value } : r
                            ),
                          })
                        }
                        className={inputClass}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionShell>
      )}

      {showOnychopathies && (
      <SectionShell
        title={exam.onychopathiesTitle}
        hint={`${siNoHint} ${exam.onychopathiesHint}`}
      >
        <table className={formTableClass}>
          <thead className={formTableHeadClass}>
            <tr>
              <th className="text-left p-2">{exam.onychopathy}</th>
              <th className="p-2 w-14">{exam.yes}</th>
              <th className="p-2 w-14">{exam.no}</th>
              <th className="p-2">{exam.toesLeft}</th>
              <th className="p-2">{exam.toesRight}</th>
            </tr>
          </thead>
          <tbody>
            {PODIATRY_ONYCHOPATHY_OPTIONS.map((o) => {
              const row = value.onychopathies.find((r) => r.id === o.id)!;
              return (
                <tr key={o.id} className={formTableRowBorderClass}>
                  <td className="p-2 font-medium">{getOnychopathyLabel(t, o.id)}</td>
                  {readOnly ? (
                    <PresentReadCells present={row.present} />
                  ) : (
                    <PresentCell
                      name={`ony-${o.id}`}
                      present={row.present}
                      disabled={disabled}
                      onChange={(present) =>
                        patch({
                          onychopathies: value.onychopathies.map((r) =>
                            r.id === o.id ? { ...r, present } : r
                          ),
                        })
                      }
                    />
                  )}
                  <td className="p-2">
                    {readOnly ? (
                      row.toesLeft || dash
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.toesLeft}
                        onChange={(e) =>
                          patch({
                            onychopathies: value.onychopathies.map((r) =>
                              r.id === o.id ? { ...r, toesLeft: e.target.value } : r
                            ),
                          })
                        }
                        placeholder="1,2"
                        className={inputClass}
                      />
                    )}
                  </td>
                  <td className="p-2">
                    {readOnly ? (
                      row.toesRight || dash
                    ) : (
                      <input
                        disabled={disabled}
                        value={row.toesRight}
                        onChange={(e) =>
                          patch({
                            onychopathies: value.onychopathies.map((r) =>
                              r.id === o.id ? { ...r, toesRight: e.target.value } : r
                            ),
                          })
                        }
                        placeholder="1"
                        className={inputClass}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionShell>
      )}
    </div>
  );
}
