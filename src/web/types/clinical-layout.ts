/** Secciones configurables de historia clínica (sesión, detalle, impresión). */

export type BuiltInClinicalSectionId =
  | "anamnesis"
  | "podiatry_morphology"
  | "podiatry_sweat"
  | "podiatry_limb"
  | "podiatry_helomas"
  | "podiatry_digital"
  | "podiatry_onychopathies"
  | "physical_examination"
  | "diagnosis"
  | "treatment_plan"
  | "clinical_notes"
  | "session_images"
  | "session_checklist"
  | "session_signature"
  | "patient_curp"
  | "patient_email"
  | "patient_address"
  | "patient_medical_history";

export type ClinicalSectionKind = "builtin" | "custom_text" | "custom_checklist";

export interface ClinicalLayoutSection {
  id: string;
  kind: ClinicalSectionKind;
  /** builtin: BuiltInClinicalSectionId; custom: uuid */
  builtinKey?: BuiltInClinicalSectionId;
  label: string;
  hint?: string;
  enabled: boolean;
  showInSession: boolean;
  showInPrint: boolean;
  order: number;
  /** custom_checklist */
  checklistItems?: string[];
}

export interface ClinicalLayoutConfig {
  version: 1;
  sections: ClinicalLayoutSection[];
}

export type CustomSectionValue = {
  text?: string;
  checks?: Record<string, boolean>;
};

export type CustomSectionsData = Record<string, CustomSectionValue>;

export const BUILTIN_SECTION_META: Record<
  BuiltInClinicalSectionId,
  { label: string; hint?: string; group: "sesion" | "podiatry" | "paciente" }
> = {
  anamnesis: { label: "Anamnesis", group: "sesion" },
  podiatry_morphology: { label: "Tipo de pie y arco", group: "podiatry" },
  podiatry_sweat: { label: "Patología del sudor", group: "podiatry" },
  podiatry_limb: { label: "Valoración pie y pierna", group: "podiatry" },
  podiatry_helomas: { label: "Helomas / hiperqueratosis", group: "podiatry" },
  podiatry_digital: { label: "Alteraciones digitales", group: "podiatry" },
  podiatry_onychopathies: { label: "Onicopatías", group: "podiatry" },
  physical_examination: { label: "Exploración física", group: "sesion" },
  diagnosis: { label: "Diagnóstico", group: "sesion" },
  treatment_plan: { label: "Plan de tratamiento", group: "sesion" },
  clinical_notes: { label: "Notas clínicas", group: "sesion" },
  session_images: { label: "Fotos de sesión", group: "sesion" },
  session_checklist: { label: "Checklist de sesión", group: "sesion" },
  session_signature: { label: "Firma del paciente", group: "sesion" },
  patient_curp: { label: "CURP (ficha paciente)", group: "paciente" },
  patient_email: { label: "Email (ficha paciente)", group: "paciente" },
  patient_address: { label: "Dirección (ficha paciente)", group: "paciente" },
  patient_medical_history: {
    label: "Antecedentes (ficha paciente)",
    hint: "Alergias, medicación, condiciones",
    group: "paciente",
  },
};

const BUILTIN_ORDER: BuiltInClinicalSectionId[] = [
  "anamnesis",
  "podiatry_morphology",
  "podiatry_sweat",
  "podiatry_limb",
  "podiatry_helomas",
  "podiatry_digital",
  "podiatry_onychopathies",
  "physical_examination",
  "diagnosis",
  "treatment_plan",
  "clinical_notes",
  "session_images",
  "session_checklist",
  "session_signature",
  "patient_curp",
  "patient_email",
  "patient_address",
  "patient_medical_history",
];

export function createDefaultClinicalLayout(): ClinicalLayoutConfig {
  return {
    version: 1,
    sections: BUILTIN_ORDER.map((key, order) => ({
      id: key,
      kind: "builtin" as const,
      builtinKey: key,
      label: BUILTIN_SECTION_META[key].label,
      hint: BUILTIN_SECTION_META[key].hint,
      enabled: true,
      showInSession: key.startsWith("patient_") ? false : true,
      showInPrint: !key.startsWith("patient_") && key !== "session_checklist" && key !== "session_signature",
      order,
    })),
  };
}

export function normalizeClinicalLayout(raw: unknown): ClinicalLayoutConfig {
  const defaults = createDefaultClinicalLayout();
  if (!raw || typeof raw !== "object") return defaults;

  const input = raw as Partial<ClinicalLayoutConfig>;
  if (!Array.isArray(input.sections)) return defaults;

  const byId = new Map<string, ClinicalLayoutSection>();
  for (const item of input.sections) {
    if (!item || typeof item !== "object" || typeof item.id !== "string") continue;
    const row = item as Partial<ClinicalLayoutSection>;
    const kind: ClinicalSectionKind =
      row.kind === "custom_text" || row.kind === "custom_checklist" ? row.kind : "builtin";

    if (kind === "builtin") {
      const key = row.builtinKey ?? (row.id as BuiltInClinicalSectionId);
      if (!BUILTIN_SECTION_META[key as BuiltInClinicalSectionId]) continue;
      const meta = BUILTIN_SECTION_META[key as BuiltInClinicalSectionId];
      byId.set(row.id, {
        id: key,
        kind: "builtin",
        builtinKey: key as BuiltInClinicalSectionId,
        label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : meta.label,
        hint: typeof row.hint === "string" ? row.hint : meta.hint,
        enabled: row.enabled !== false,
        showInSession: row.showInSession !== false,
        showInPrint: row.showInPrint !== false,
        order: typeof row.order === "number" ? row.order : 0,
      });
    } else {
      byId.set(row.id, {
        id: row.id,
        kind,
        label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : "Sección personalizada",
        hint: typeof row.hint === "string" ? row.hint : undefined,
        enabled: row.enabled !== false,
        showInSession: row.showInSession !== false,
        showInPrint: row.showInPrint === true,
        order: typeof row.order === "number" ? row.order : 999,
        checklistItems:
          kind === "custom_checklist" && Array.isArray(row.checklistItems)
            ? row.checklistItems.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim())
            : [],
      });
    }
  }

  const merged = defaults.sections.map((d) => byId.get(d.id) ?? d);
  const customs = [...byId.values()].filter((s) => s.kind !== "builtin" && !merged.some((m) => m.id === s.id));

  return {
    version: 1,
    sections: [...merged, ...customs].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i })),
  };
}

export function isSectionActive(
  layout: ClinicalLayoutConfig,
  id: BuiltInClinicalSectionId | string,
  context: "session" | "print"
): boolean {
  const section = layout.sections.find((s) => s.id === id || s.builtinKey === id);
  if (!section || !section.enabled) return false;
  return context === "session" ? section.showInSession : section.showInPrint;
}

export function getEnabledBuiltinSections(
  layout: ClinicalLayoutConfig,
  context: "session" | "print"
): Set<BuiltInClinicalSectionId> {
  const out = new Set<BuiltInClinicalSectionId>();
  for (const s of layout.sections) {
    if (s.kind !== "builtin" || !s.builtinKey || !s.enabled) continue;
    if (context === "session" && !s.showInSession) continue;
    if (context === "print" && !s.showInPrint) continue;
    out.add(s.builtinKey);
  }
  return out;
}

export function getCustomSections(layout: ClinicalLayoutConfig, context: "session" | "print") {
  return layout.sections.filter((s) => {
    if (s.kind === "builtin" || !s.enabled) return false;
    return context === "session" ? s.showInSession : s.showInPrint;
  });
}

export function createCustomSection(
  kind: "custom_text" | "custom_checklist",
  label: string
): ClinicalLayoutSection {
  const id = `custom_${crypto.randomUUID().slice(0, 8)}`;
  return {
    id,
    kind,
    label: label.trim() || "Nueva sección",
    enabled: true,
    showInSession: true,
    showInPrint: false,
    order: 999,
    checklistItems: kind === "custom_checklist" ? ["Ítem 1"] : undefined,
  };
}

export function reorderSections(sections: ClinicalLayoutSection[], fromIndex: number, toIndex: number) {
  const next = [...sections];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return sections;
  next.splice(toIndex, 0, moved);
  return next.map((s, i) => ({ ...s, order: i }));
}

export type PodiatryBlockKey =
  | "morphology"
  | "sweat"
  | "limb"
  | "helomas"
  | "digital"
  | "onychopathies";

const PODIATRY_BLOCK_MAP: Record<PodiatryBlockKey, BuiltInClinicalSectionId> = {
  morphology: "podiatry_morphology",
  sweat: "podiatry_sweat",
  limb: "podiatry_limb",
  helomas: "podiatry_helomas",
  digital: "podiatry_digital",
  onychopathies: "podiatry_onychopathies",
};

export function getPodiatryVisibleBlocks(
  layout: ClinicalLayoutConfig,
  context: "session" | "print" = "session"
): Partial<Record<PodiatryBlockKey, boolean>> {
  const out: Partial<Record<PodiatryBlockKey, boolean>> = {};
  for (const [key, id] of Object.entries(PODIATRY_BLOCK_MAP) as [PodiatryBlockKey, BuiltInClinicalSectionId][]) {
    out[key] = isSectionActive(layout, id, context);
  }
  return out;
}

export function getSectionLabel(
  layout: ClinicalLayoutConfig,
  id: BuiltInClinicalSectionId | string
): string {
  const section = layout.sections.find((s) => s.id === id || s.builtinKey === id);
  if (section?.label) return section.label;
  if (id in BUILTIN_SECTION_META) return BUILTIN_SECTION_META[id as BuiltInClinicalSectionId].label;
  return String(id);
}

export function isPatientFieldEnabled(
  layout: ClinicalLayoutConfig,
  id: Extract<
    BuiltInClinicalSectionId,
    "patient_curp" | "patient_email" | "patient_address" | "patient_medical_history"
  >
): boolean {
  const section = layout.sections.find((s) => s.builtinKey === id || s.id === id);
  return section ? section.enabled : true;
}

export function normalizeCustomSections(raw: unknown): CustomSectionsData {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: CustomSectionsData = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    const row = val as { text?: unknown; checks?: unknown };
    out[key] = {
      text: typeof row.text === "string" ? row.text : undefined,
      checks:
        row.checks && typeof row.checks === "object" && !Array.isArray(row.checks)
          ? Object.fromEntries(
              Object.entries(row.checks as Record<string, unknown>).filter(
                ([, v]) => typeof v === "boolean"
              ) as [string, boolean][]
            )
          : undefined,
    };
  }
  return out;
}
