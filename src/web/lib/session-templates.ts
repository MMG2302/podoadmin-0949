import type { AppointmentReason } from "../types/clinical";
import type {
  BuiltInClinicalSectionId,
  ClinicalLayoutConfig,
  ClinicalLayoutSection,
  CustomSectionsData,
} from "../types/clinical-layout";
import {
  getPodiatryVisibleBlocks,
  normalizeClinicalLayout,
  normalizeCustomSections,
} from "../types/clinical-layout";
import {
  normalizeDigitalAlterations,
  normalizeHelomas,
  normalizeLimbAssessment,
  normalizeOnychopathies,
  normalizePodiatryArchType,
  normalizePodiatryFootType,
  normalizeSweatDisorders,
} from "../types/podiatry";
import {
  createDefaultPodiatryExamination,
  type PodiatryExaminationValue,
} from "../components/sessions/podiatry-examination-fields";

export interface SessionTemplateFields {
  anamnesis?: string;
  physicalExamination?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  clinicalNotes?: string;
  appointmentReason?: AppointmentReason | "";
  podiatryExam?: PodiatryExaminationValue;
  customSections?: CustomSectionsData;
  /** Secciones incluidas en la plantilla (como el diseñador de historia clínica). */
  sectionLayout?: ClinicalLayoutConfig;
}

export interface SessionTemplate {
  id: string;
  name: string;
  category: string;
  fields: SessionTemplateFields;
  isShared: boolean;
  createdBy?: string;
}

export type SessionTemplateScope = "personal" | "clinic";

export const TEMPLATE_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "dermatologia", label: "Dermatología / callosidades" },
  { id: "uñas", label: "Uñas" },
  { id: "biomecanica", label: "Biomecánica" },
  { id: "cirugia", label: "Cirugía / procedimientos" },
] as const;

export const DEFAULT_TEMPLATE_FIELDS: SessionTemplateFields = {
  anamnesis: "",
  physicalExamination: "",
  diagnosis: "",
  treatmentPlan: "",
  clinicalNotes: "",
  appointmentReason: "",
  podiatryExam: createDefaultPodiatryExamination(),
  customSections: {},
};

const TEMPLATE_EXCLUDED_BUILTINS = new Set<BuiltInClinicalSectionId>([
  "session_images",
  "session_checklist",
  "session_signature",
  "patient_curp",
  "patient_email",
  "patient_address",
  "patient_medical_history",
  "patient_family_history",
]);

/** Clona el diseño global dejando solo secciones aplicables a plantillas de sesión. */
export function createTemplateSectionLayoutFromGlobal(global: ClinicalLayoutConfig): ClinicalLayoutConfig {
  const sections = global.sections
    .filter((s) => {
      if (s.kind === "builtin" && s.builtinKey && TEMPLATE_EXCLUDED_BUILTINS.has(s.builtinKey)) {
        return false;
      }
      if (s.kind === "builtin" && s.builtinKey?.startsWith("patient_")) return false;
      return true;
    })
    .map((s, index) => ({
      ...s,
      enabled: s.kind === "builtin" ? s.enabled : true,
      showInSession: true,
      showInPrint: true,
      order: index,
    }));
  return { version: 1, sections };
}

export function ensureTemplateSectionLayout(
  fields: SessionTemplateFields,
  globalLayout: ClinicalLayoutConfig
): ClinicalLayoutConfig {
  if (fields.sectionLayout?.sections?.length) {
    return normalizeClinicalLayout(fields.sectionLayout);
  }
  return createTemplateSectionLayoutFromGlobal(globalLayout);
}

export function isTemplateSectionIncluded(
  sectionLayout: ClinicalLayoutConfig | undefined,
  sectionIdOrKey: string
): boolean {
  if (!sectionLayout?.sections?.length) return true;
  const section = sectionLayout.sections.find(
    (s) => s.id === sectionIdOrKey || s.builtinKey === sectionIdOrKey
  );
  return section ? section.enabled : false;
}

export function getIncludedTemplateSections(sectionLayout: ClinicalLayoutConfig): ClinicalLayoutSection[] {
  return [...sectionLayout.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
}

export function countIncludedTemplateSections(sectionLayout: ClinicalLayoutConfig | undefined): number {
  if (!sectionLayout?.sections?.length) return 0;
  return sectionLayout.sections.filter((s) => s.enabled).length;
}

/**
 * Layout efectivo del formulario de sesión al cargar una plantilla:
 * - Solo muestra secciones marcadas «Incluir en plantilla»
 * - Añade secciones personalizadas creadas solo en la plantilla
 * - Oculta el resto (p. ej. helomas en plantilla quirúrgica)
 */
export function resolveSessionFormLayout(
  globalLayout: ClinicalLayoutConfig,
  templateLayout: ClinicalLayoutConfig
): ClinicalLayoutConfig {
  const globalById = new Map(globalLayout.sections.map((s) => [s.id, s]));
  const globalByBuiltin = new Map(
    globalLayout.sections
      .filter((s): s is ClinicalLayoutSection & { builtinKey: BuiltInClinicalSectionId } => !!s.builtinKey)
      .map((s) => [s.builtinKey, s])
  );

  const merged: ClinicalLayoutSection[] = [];
  const sortedTemplate = [...templateLayout.sections].sort((a, b) => a.order - b.order);

  for (const tmpl of sortedTemplate) {
    if (!tmpl.enabled) continue;

    if (tmpl.kind === "builtin" && tmpl.builtinKey) {
      const globalSec = globalByBuiltin.get(tmpl.builtinKey) ?? globalById.get(tmpl.id);
      if (globalSec && !globalSec.enabled) continue;
      if (globalSec) {
        merged.push({
          ...globalSec,
          label: tmpl.label.trim() || globalSec.label,
          enabled: true,
          showInSession: true,
          order: merged.length,
        });
      }
      continue;
    }

    if (tmpl.kind !== "builtin") {
      const globalSec = globalById.get(tmpl.id);
      merged.push({
        ...(globalSec ?? tmpl),
        id: tmpl.id,
        kind: tmpl.kind,
        label: tmpl.label,
        hint: tmpl.hint ?? globalSec?.hint,
        enabled: true,
        showInSession: true,
        order: merged.length,
        checklistItems: tmpl.checklistItems ?? globalSec?.checklistItems,
        options: tmpl.options ?? globalSec?.options,
        unit: tmpl.unit ?? globalSec?.unit,
        scaleMax: tmpl.scaleMax ?? globalSec?.scaleMax,
        conditionalPrompt: tmpl.conditionalPrompt ?? globalSec?.conditionalPrompt,
        tableColumns: tmpl.tableColumns ?? globalSec?.tableColumns,
        tableRowCount: tmpl.tableRowCount ?? globalSec?.tableRowCount,
      });
    }
  }

  return {
    version: 1,
    sections: merged.map((s, i) => ({
      ...s,
      enabled: true,
      showInSession: true,
      order: i,
    })),
  };
}

function helomaPreset(): PodiatryExaminationValue {
  const exam = createDefaultPodiatryExamination();
  return {
    ...exam,
    helomas: exam.helomas.map((h) =>
      h.id === "interphalangeal" ? { ...h, present: true, notes: "Callosidad dolorosa a la presión" } : h
    ),
  };
}

function onychocryptosisPreset(): PodiatryExaminationValue {
  const exam = createDefaultPodiatryExamination();
  return {
    ...exam,
    onychopathies: exam.onychopathies.map((o) =>
      o.id === "onicocriptosis"
        ? { ...o, present: true, toesLeft: "Hallux", toesRight: "" }
        : o
    ),
  };
}

export function buildPresetFields(
  globalLayout: ClinicalLayoutConfig,
  preset: Omit<SessionTemplatePreset, "name" | "category"> & {
    enabledSections: BuiltInClinicalSectionId[];
  }
): SessionTemplateFields {
  const enabled = new Set(preset.enabledSections);
  const sectionLayout = createTemplateSectionLayoutFromGlobal(globalLayout);
  sectionLayout.sections = sectionLayout.sections.map((s) => ({
    ...s,
    enabled: s.kind === "custom" ? false : s.builtinKey ? enabled.has(s.builtinKey) : false,
  }));
  return {
    ...normalizeTemplateFields(preset.fields),
    sectionLayout,
  };
}

export interface SessionTemplatePreset {
  name: string;
  category: string;
  enabledSections: BuiltInClinicalSectionId[];
  fields: Omit<
    SessionTemplateFields,
    "sectionLayout"
  >;
}

const HELOMA_PRESET_SECTIONS: BuiltInClinicalSectionId[] = [
  "anamnesis",
  "physical_examination",
  "diagnosis",
  "treatment_plan",
  "podiatry_helomas",
];

const ONYCH_PRESET_SECTIONS: BuiltInClinicalSectionId[] = [
  "anamnesis",
  "physical_examination",
  "diagnosis",
  "treatment_plan",
  "podiatry_onychopathies",
];

const SURGERY_PRESET_SECTIONS: BuiltInClinicalSectionId[] = [
  "anamnesis",
  "physical_examination",
  "diagnosis",
  "treatment_plan",
  "clinical_notes",
];

export function resolvePresetFields(
  preset: SessionTemplatePreset,
  globalLayout: ClinicalLayoutConfig
): SessionTemplateFields {
  return buildPresetFields(globalLayout, {
    enabledSections: preset.enabledSections,
    fields: preset.fields,
  });
}

export const SESSION_TEMPLATE_PRESETS: SessionTemplatePreset[] = [
  {
    name: "Callosidad / heloma",
    category: "dermatologia",
    enabledSections: HELOMA_PRESET_SECTIONS,
    fields: {
      anamnesis:
        "Paciente refiere molestias por callosidad/heloma. Dolor a la presión y al calzado. Sin signos de infección.",
      physicalExamination:
        "Piel engrosada hiperqueratósica en zona de apoyo. Eritema perilesional leve. Pulso pedio conservado.",
      diagnosis: "Heloma duro",
      treatmentPlan:
        "Deslaminación del tejido hiperqueratósico. Educación en higiene y calzado. Control en 4-6 semanas.",
      podiatryExam: helomaPreset(),
    },
  },
  {
    name: "Uña encarnada (onicocriptosis)",
    category: "uñas",
    enabledSections: ONYCH_PRESET_SECTIONS,
    fields: {
      anamnesis:
        "Paciente con dolor en lecho ungueal por uña encarnada. Inicio progresivo. Limitación al calzado cerrado.",
      physicalExamination:
        "Bordes ungueales incrustados en pliegue ungueal. Eritema e inflamación perilesional. Sin supuración.",
      diagnosis: "Onicocriptosis",
      treatmentPlan:
        "Avulsión parcial del borde afectado. Antisepsia. Indicaciones de cuidado domiciliario. Control en 2 semanas.",
      podiatryExam: onychocryptosisPreset(),
    },
  },
  {
    name: "Procedimiento quirúrgico",
    category: "cirugia",
    enabledSections: SURGERY_PRESET_SECTIONS,
    fields: {
      anamnesis:
        "Paciente programado para procedimiento quirúrgico podológico. Consentimiento informado. Ayuno y profilaxis según protocolo.",
      physicalExamination:
        "Zona quirúrgica sin signos de infección activa. Neurovascular distal conservado.",
      diagnosis: "Indicación quirúrgica podológica",
      treatmentPlan:
        "Procedimiento en consultorio. Antisepsia, anestesia local, técnica aséptica. Control postoperatorio en 7-10 días.",
      clinicalNotes: "Material estéril, gasas, apósito oclusivo. Indicaciones postoperatorias entregadas.",
    },
  },
];

export function normalizePodiatryExam(raw: unknown): PodiatryExaminationValue {
  const defaults = createDefaultPodiatryExamination();
  if (!raw || typeof raw !== "object") return defaults;
  const exam = raw as Partial<PodiatryExaminationValue>;
  return {
    footType: normalizePodiatryFootType(exam.footType),
    archType: normalizePodiatryArchType(exam.archType),
    sweatDisorders: normalizeSweatDisorders(exam.sweatDisorders),
    limbAssessment: normalizeLimbAssessment(exam.limbAssessment),
    helomas: normalizeHelomas(exam.helomas),
    digitalAlterations: normalizeDigitalAlterations(exam.digitalAlterations),
    onychopathies: normalizeOnychopathies(exam.onychopathies),
  };
}

export function normalizeTemplateFields(raw: unknown): SessionTemplateFields {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_TEMPLATE_FIELDS };
  const fields = raw as SessionTemplateFields;
  return {
    anamnesis: String(fields.anamnesis ?? ""),
    physicalExamination: String(fields.physicalExamination ?? ""),
    diagnosis: String(fields.diagnosis ?? ""),
    treatmentPlan: String(fields.treatmentPlan ?? ""),
    clinicalNotes: String(fields.clinicalNotes ?? ""),
    appointmentReason: (fields.appointmentReason ?? "") as AppointmentReason | "",
    podiatryExam: fields.podiatryExam ? normalizePodiatryExam(fields.podiatryExam) : createDefaultPodiatryExamination(),
    customSections:
      fields.customSections && typeof fields.customSections === "object"
        ? normalizeCustomSections(fields.customSections)
        : {},
    sectionLayout: fields.sectionLayout ? normalizeClinicalLayout(fields.sectionLayout) : undefined,
  };
}

function mergePodiatryExam(
  current: PodiatryExaminationValue,
  template: PodiatryExaminationValue
): PodiatryExaminationValue {
  const normalized = normalizePodiatryExam(template);
  return {
    footType: normalized.footType ?? current.footType,
    archType: normalized.archType ?? current.archType,
    sweatDisorders: normalized.sweatDisorders.map((entry, i) => {
      const cur = current.sweatDisorders[i];
      if (entry.present != null || entry.notes.trim()) return entry;
      return cur ?? entry;
    }),
    limbAssessment: normalized.limbAssessment.map((entry, i) => {
      const cur = current.limbAssessment[i];
      if (entry.left != null || entry.right != null || entry.notes.trim()) return entry;
      return cur ?? entry;
    }),
    helomas: normalized.helomas.map((entry, i) => {
      const cur = current.helomas[i];
      if (entry.present != null || entry.locationLeft.trim() || entry.locationRight.trim() || entry.notes.trim()) {
        return entry;
      }
      return cur ?? entry;
    }),
    digitalAlterations: normalized.digitalAlterations.map((entry, i) => {
      const cur = current.digitalAlterations[i];
      if (entry.present != null || entry.locationLeft.trim() || entry.locationRight.trim()) return entry;
      return cur ?? entry;
    }),
    onychopathies: normalized.onychopathies.map((entry, i) => {
      const cur = current.onychopathies[i];
      if (entry.present != null || entry.toesLeft.trim() || entry.toesRight.trim()) return entry;
      return cur ?? entry;
    }),
  };
}

function pickText(templateVal: string | undefined, currentVal: string | undefined): string {
  const t = String(templateVal ?? "").trim();
  if (t.length > 0) return t;
  return String(currentVal ?? "");
}

function mergePodiatryExamSelective(
  current: PodiatryExaminationValue,
  template: PodiatryExaminationValue,
  sectionLayout?: ClinicalLayoutConfig
): PodiatryExaminationValue {
  const merged = mergePodiatryExam(current, template);
  if (!sectionLayout?.sections?.length) return merged;
  const blocks = getPodiatryVisibleBlocks(sectionLayout, "session");
  return {
    footType: blocks.morphology ? merged.footType : current.footType,
    archType: blocks.morphology ? merged.archType : current.archType,
    sweatDisorders: blocks.sweat ? merged.sweatDisorders : current.sweatDisorders,
    limbAssessment: blocks.limb ? merged.limbAssessment : current.limbAssessment,
    helomas: blocks.helomas ? merged.helomas : current.helomas,
    digitalAlterations: blocks.digital ? merged.digitalAlterations : current.digitalAlterations,
    onychopathies: blocks.onychopathies ? merged.onychopathies : current.onychopathies,
  };
}

function mergeCustomSectionsSelective(
  current: CustomSectionsData,
  template: CustomSectionsData,
  sectionLayout?: ClinicalLayoutConfig
): CustomSectionsData {
  if (!sectionLayout?.sections?.length) {
    return { ...current, ...template };
  }
  const out = { ...current };
  for (const section of sectionLayout.sections) {
    if (section.kind === "builtin" || !section.enabled) continue;
    if (template[section.id]) {
      out[section.id] = template[section.id];
    }
  }
  return out;
}

export function applySessionTemplateFields(
  fields: SessionTemplateFields,
  current: SessionTemplateFields
): SessionTemplateFields {
  const normalized = normalizeTemplateFields(fields);
  const currentNorm = normalizeTemplateFields(current);
  const layout = normalized.sectionLayout;

  return {
    anamnesis: isTemplateSectionIncluded(layout, "anamnesis")
      ? pickText(normalized.anamnesis, currentNorm.anamnesis)
      : currentNorm.anamnesis,
    physicalExamination: isTemplateSectionIncluded(layout, "physical_examination")
      ? pickText(normalized.physicalExamination, currentNorm.physicalExamination)
      : currentNorm.physicalExamination,
    diagnosis: isTemplateSectionIncluded(layout, "diagnosis")
      ? pickText(normalized.diagnosis, currentNorm.diagnosis)
      : currentNorm.diagnosis,
    treatmentPlan: isTemplateSectionIncluded(layout, "treatment_plan")
      ? pickText(normalized.treatmentPlan, currentNorm.treatmentPlan)
      : currentNorm.treatmentPlan,
    clinicalNotes: isTemplateSectionIncluded(layout, "clinical_notes")
      ? pickText(normalized.clinicalNotes, currentNorm.clinicalNotes)
      : currentNorm.clinicalNotes,
    appointmentReason: normalized.appointmentReason || currentNorm.appointmentReason || "",
    podiatryExam: mergePodiatryExamSelective(
      currentNorm.podiatryExam!,
      normalized.podiatryExam!,
      layout
    ),
    customSections: mergeCustomSectionsSelective(
      currentNorm.customSections ?? {},
      normalized.customSections ?? {},
      layout
    ),
    sectionLayout: layout,
  };
}

function podiatryExamHasContent(exam: PodiatryExaminationValue): boolean {
  if (exam.footType || exam.archType) return true;
  const rows = [
    ...exam.sweatDisorders,
    ...exam.limbAssessment,
    ...exam.helomas,
    ...exam.digitalAlterations,
    ...exam.onychopathies,
  ];
  return rows.some(
    (r) =>
      "present" in r &&
      (r.present === true ||
        ("notes" in r && String(r.notes ?? "").trim()) ||
        ("locationLeft" in r && String(r.locationLeft ?? "").trim()) ||
        ("locationRight" in r && String(r.locationRight ?? "").trim()) ||
        ("toesLeft" in r && String(r.toesLeft ?? "").trim()) ||
        ("toesRight" in r && String(r.toesRight ?? "").trim()) ||
        ("left" in r && r.left != null) ||
        ("right" in r && r.right != null))
  );
}

export function sessionFormHasClinicalContent(fields: SessionTemplateFields): boolean {
  const normalized = normalizeTemplateFields(fields);
  const textFilled = [
    normalized.anamnesis,
    normalized.physicalExamination,
    normalized.diagnosis,
    normalized.treatmentPlan,
    normalized.clinicalNotes,
  ].some((s) => String(s ?? "").trim().length > 0);
  const customFilled =
    normalized.customSections &&
    Object.values(normalized.customSections).some((v) => v != null && JSON.stringify(v) !== "{}");
  return textFilled || podiatryExamHasContent(normalized.podiatryExam!) || Boolean(customFilled);
}

export function templateScopeLabel(template: SessionTemplate, currentUserId?: string): string {
  if (template.isShared) return "Consultorio";
  if (template.createdBy && template.createdBy === currentUserId) return "Personal";
  return "Personal";
}
