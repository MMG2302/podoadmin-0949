import type {
  BuiltInClinicalSectionId,
  ClinicalLayoutConfig,
  ClinicalLayoutSection,
  CustomSectionKind,
} from "../types/clinical-layout";
import { BUILTIN_SECTION_META } from "../types/clinical-layout";
import type {
  DigitalAlterationId,
  HelomaId,
  LimbAssessmentId,
  OnychopathyId,
  PodiatryArchType,
  PodiatryFootType,
  SweatDisorderId,
} from "../types/podiatry";
import type { FamilyAntecedentId } from "../types/medical-history";
import {
  clinicalSharedByLang,
  type ClinicalLayoutI18n,
  type ClinicalToolsExtrasI18n,
  type PatientsClinicalI18n,
  type PodiatryI18n,
} from "./clinical-i18n";

/** Subconjunto de Translations usado por helpers clínicos. */
export type ClinicalLabelSource = {
  clinicalLayout: ClinicalLayoutI18n;
  podiatry: PodiatryI18n;
  patientsClinical: PatientsClinicalI18n;
  clinicalToolsExtras: ClinicalToolsExtrasI18n;
};

/** True si el título guardado es el default del sistema (cualquier idioma). */
export function isSystemBuiltinLabel(
  id: BuiltInClinicalSectionId,
  label: string | null | undefined
): boolean {
  const trimmed = label?.trim();
  if (!trimmed) return true;
  if (trimmed === BUILTIN_SECTION_META[id]?.label) return true;
  for (const bundle of Object.values(clinicalSharedByLang)) {
    const builtins = bundle.clinicalLayout.builtins as Record<string, string>;
    if (builtins[id] === trimmed) return true;
  }
  return false;
}

/** Título visible de una sección: i18n para builtins del sistema; custom tal cual. */
export function resolveSectionDisplayLabel(
  t: ClinicalLabelSource,
  section: Pick<ClinicalLayoutSection, "kind" | "builtinKey" | "label"> | null | undefined,
  fallbackId?: BuiltInClinicalSectionId | string
): string {
  const builtinKey =
    (section?.kind === "builtin" ? section.builtinKey : undefined) ??
    (fallbackId && fallbackId in BUILTIN_SECTION_META
      ? (fallbackId as BuiltInClinicalSectionId)
      : undefined);

  if (builtinKey && BUILTIN_SECTION_META[builtinKey]) {
    if (isSystemBuiltinLabel(builtinKey, section?.label)) {
      return getBuiltinSectionLabel(t, builtinKey);
    }
    if (section?.label?.trim()) return section.label.trim();
    return getBuiltinSectionLabel(t, builtinKey);
  }

  return section?.label?.trim() || String(fallbackId ?? "");
}

export function resolveLayoutSectionLabel(
  t: ClinicalLabelSource,
  layout: ClinicalLayoutConfig,
  id: BuiltInClinicalSectionId | string
): string {
  const section = layout.sections.find((s) => s.id === id || s.builtinKey === id);
  return resolveSectionDisplayLabel(t, section, id);
}

export function getCustomKindLabel(t: ClinicalLabelSource, kind: CustomSectionKind): string {
  return t.clinicalLayout.kinds[kind]?.label ?? t.clinicalLayout.defaults.personalized;
}

export function getCustomKindHint(t: ClinicalLabelSource, kind: CustomSectionKind): string {
  return t.clinicalLayout.kinds[kind]?.hint ?? "";
}

export function getBuiltinSectionLabel(
  t: ClinicalLabelSource,
  id: BuiltInClinicalSectionId
): string {
  const map = t.clinicalLayout.builtins;
  if (id === "patient_medical_history") return map.patient_medical_history;
  if (id === "patient_family_history") return map.patient_family_history;
  return (map as Record<string, string>)[id] ?? id;
}

export function getBuiltinSectionHint(
  t: ClinicalLabelSource,
  id: BuiltInClinicalSectionId
): string | undefined {
  if (id === "patient_medical_history") return t.clinicalLayout.builtins.patient_medical_historyHint;
  if (id === "patient_family_history") return t.clinicalLayout.builtins.patient_family_historyHint;
  return undefined;
}

export function getSectionGroupLabel(
  t: ClinicalLabelSource,
  group: "sesion" | "podiatry" | "paciente" | "custom"
): string {
  return t.clinicalLayout.groups[group];
}

export function getPodiatryFootLabel(
  t: ClinicalLabelSource,
  id: PodiatryFootType | null | undefined
): string {
  if (!id) return t.podiatry.exam.dash;
  return t.podiatry.foot[id] ?? t.podiatry.exam.dash;
}

export function getPodiatryArchLabel(
  t: ClinicalLabelSource,
  id: PodiatryArchType | null | undefined
): string {
  if (!id) return t.podiatry.exam.dash;
  return t.podiatry.arch[id] ?? t.podiatry.exam.dash;
}

export function getSweatLabel(t: ClinicalLabelSource, id: SweatDisorderId): string {
  return t.podiatry.sweat[id];
}

export function getLimbLabel(t: ClinicalLabelSource, id: LimbAssessmentId): string {
  return t.podiatry.limb[id];
}

export function getHelomaLabel(t: ClinicalLabelSource, id: HelomaId): string {
  return t.podiatry.helomas[id];
}

export function getDigitalLabel(t: ClinicalLabelSource, id: DigitalAlterationId): string {
  return t.podiatry.digital[id];
}

export function getOnychopathyLabel(t: ClinicalLabelSource, id: OnychopathyId): string {
  return t.podiatry.onychopathies[id];
}

export function getFamilyAntecedentLabel(
  t: ClinicalLabelSource,
  id: FamilyAntecedentId
): string {
  return t.patientsClinical.familyLabels[id];
}

export function getTemplateCategoryLabel(t: ClinicalLabelSource, categoryId: string): string {
  const cats = t.clinicalToolsExtras.categories;
  if (categoryId === "uñas") return cats.unas;
  if (categoryId in cats) return cats[categoryId as keyof typeof cats];
  return categoryId;
}

export function getTemplatePresetName(
  t: ClinicalLabelSource,
  presetKey: "heloma" | "onychocryptosis" | "surgery"
): string {
  return t.clinicalToolsExtras.presets[presetKey];
}

export function getTemplateScopeLabel(t: ClinicalLabelSource, isShared: boolean): string {
  return isShared ? t.clinicalToolsExtras.scopeClinic : t.clinicalToolsExtras.scopePersonal;
}
