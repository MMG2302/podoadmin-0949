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
  | "patient_medical_history"
  | "patient_family_history";

export const CUSTOM_SECTION_KINDS = [
  "custom_text",
  "custom_short_text",
  "custom_checklist",
  "custom_yes_no_na",
  "custom_single_choice",
  "custom_multi_choice",
  "custom_number",
  "custom_scale",
  "custom_conditional",
  "custom_table",
] as const;

export type CustomSectionKind = (typeof CUSTOM_SECTION_KINDS)[number];

export type ClinicalSectionKind = "builtin" | CustomSectionKind;

export type TriStateValue = "yes" | "no" | "na" | null;

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
  /** custom_checklist (legacy) y filas/opciones configurables */
  checklistItems?: string[];
  /** Filas SI/NO/N/A, opciones radio/checkbox */
  options?: string[];
  /** custom_number */
  unit?: string;
  /** custom_scale (1–scaleMax) */
  scaleMax?: number;
  /** custom_conditional */
  conditionalPrompt?: string;
  /** custom_table */
  tableColumns?: string[];
  tableRowCount?: number;
}

export interface ClinicalLayoutConfig {
  version: 1;
  sections: ClinicalLayoutSection[];
}

export type CustomSectionValue = {
  text?: string;
  shortText?: string;
  checks?: Record<string, boolean>;
  triState?: Record<string, TriStateValue>;
  triStateNotes?: Record<string, string>;
  selected?: string | null;
  number?: number | null;
  conditionalYes?: boolean | null;
  tableRows?: string[][];
};

export type CustomSectionsData = Record<string, CustomSectionValue>;

export const CUSTOM_KIND_META: Record<
  CustomSectionKind,
  { label: string; hint: string }
> = {
  custom_text: {
    label: "Texto libre",
    hint: "Párrafo amplio: observaciones, protocolo, notas.",
  },
  custom_short_text: {
    label: "Texto corto",
    hint: "Una línea: lote, color, referencia, código.",
  },
  custom_checklist: {
    label: "Checklist",
    hint: "Casillas independientes (material, pasos del servicio).",
  },
  custom_yes_no_na: {
    label: "SI / NO / N/A",
    hint: "Tabla con filas configurables. Sin marcar = NO al guardar.",
  },
  custom_single_choice: {
    label: "Opción única",
    hint: "Radio: tipo de visita, gravedad, una sola respuesta.",
  },
  custom_multi_choice: {
    label: "Opción múltiple",
    hint: "Varias opciones a la vez: servicios, zonas tratadas.",
  },
  custom_number: {
    label: "Número + unidad",
    hint: "Cantidad con unidad (min, ml, mm, %).",
  },
  custom_scale: {
    label: "Escala 0–10",
    hint: "Dolor, satisfacción, adherencia.",
  },
  custom_conditional: {
    label: "SI/NO + nota",
    hint: "Pregunta sí/no; si es SÍ, aparece texto adicional.",
  },
  custom_table: {
    label: "Tabla simple",
    hint: "Filas × columnas de texto (producto, cantidad, lote).",
  },
};

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
    label: "Antecedentes personales (ficha)",
    hint: "Alergias, medicación habitual y patologías crónicas del paciente",
    group: "paciente",
  },
  patient_family_history: {
    label: "Antecedentes familiares (ficha)",
    hint: "Hipertensión, diabetes, psoriasis y otras enfermedades relevantes en familiares",
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
  "patient_family_history",
];

export function isCustomSectionKind(kind: string): kind is CustomSectionKind {
  return (CUSTOM_SECTION_KINDS as readonly string[]).includes(kind);
}

export function getSectionOptions(section: ClinicalLayoutSection): string[] {
  const fromOptions = (section.options ?? []).filter((x) => x.trim());
  if (fromOptions.length > 0) return fromOptions;
  return (section.checklistItems ?? []).filter((x) => x.trim());
}

export const MAX_TABLE_COLUMNS = 6;

export function getTableColumns(section: ClinicalLayoutSection): string[] {
  const cols = (section.tableColumns ?? []).map((c) => c.trim()).filter(Boolean);
  if (cols.length > 0) return cols.slice(0, MAX_TABLE_COLUMNS);
  return ["Columna 1", "Columna 2"];
}

export function getCustomKindLabel(kind: CustomSectionKind): string {
  return CUSTOM_KIND_META[kind]?.label ?? "Personalizada";
}

function cleanStringList(raw: unknown, max = 30): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => typeof x === "string" && x.trim())
    .map((x) => x.trim())
    .slice(0, max);
}

function normalizeCustomSectionRow(row: Partial<ClinicalLayoutSection>): ClinicalLayoutSection | null {
  if (!row.id || typeof row.id !== "string") return null;
  if (!row.kind || !isCustomSectionKind(row.kind)) return null;

  const kind = row.kind;
  const options = cleanStringList(row.options);
  const checklistItems = cleanStringList(row.checklistItems);
  const list = options.length > 0 ? options : checklistItems;

  const base: ClinicalLayoutSection = {
    id: row.id,
    kind,
    label: typeof row.label === "string" && row.label.trim() ? row.label.trim() : "Sección personalizada",
    hint: typeof row.hint === "string" ? row.hint : undefined,
    enabled: row.enabled !== false,
    showInSession: row.showInSession !== false,
    showInPrint: row.showInPrint === true,
    order: typeof row.order === "number" ? row.order : 999,
  };

  switch (kind) {
    case "custom_checklist":
      return { ...base, checklistItems: list.length > 0 ? list : ["Ítem 1"] };
    case "custom_yes_no_na":
    case "custom_single_choice":
    case "custom_multi_choice":
      return { ...base, options: list.length > 0 ? list : ["Ítem 1", "Ítem 2"] };
    case "custom_number":
      return {
        ...base,
        unit: typeof row.unit === "string" && row.unit.trim() ? row.unit.trim().slice(0, 20) : "unidad",
      };
    case "custom_scale": {
      const scaleMax =
        typeof row.scaleMax === "number" && row.scaleMax >= 5 && row.scaleMax <= 10
          ? Math.round(row.scaleMax)
          : 10;
      return { ...base, scaleMax };
    }
    case "custom_conditional":
      return {
        ...base,
        conditionalPrompt:
          typeof row.conditionalPrompt === "string" && row.conditionalPrompt.trim()
            ? row.conditionalPrompt.trim().slice(0, 200)
            : "¿Aplica?",
      };
    case "custom_table": {
      const tableColumns = cleanStringList(row.tableColumns, 6);
      const tableRowCount =
        typeof row.tableRowCount === "number" && row.tableRowCount >= 1 && row.tableRowCount <= 10
          ? Math.round(row.tableRowCount)
          : 3;
      return {
        ...base,
        tableColumns: tableColumns.length > 0 ? tableColumns : ["Columna 1", "Columna 2"],
        tableRowCount,
      };
    }
    default:
      return base;
  }
}

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
      showInPrint:
        (!key.startsWith("patient_") ||
          key === "patient_medical_history" ||
          key === "patient_family_history") &&
        key !== "session_checklist" &&
        key !== "session_signature",
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

    if (row.kind && isCustomSectionKind(row.kind)) {
      const normalized = normalizeCustomSectionRow(row);
      if (normalized) byId.set(normalized.id, normalized);
      continue;
    }

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

export function createCustomSection(kind: CustomSectionKind, label: string): ClinicalLayoutSection {
  const id = `custom_${crypto.randomUUID().slice(0, 8)}`;
  const base = {
    id,
    kind,
    label: label.trim() || "Nueva sección",
    enabled: true,
    showInSession: true,
    showInPrint: false,
    order: 999,
  };

  switch (kind) {
    case "custom_checklist":
      return { ...base, checklistItems: ["Ítem 1"] };
    case "custom_yes_no_na":
    case "custom_multi_choice":
      return { ...base, options: ["Ítem 1", "Ítem 2"] };
    case "custom_single_choice":
      return { ...base, options: ["Opción A", "Opción B"] };
    case "custom_number":
      return { ...base, unit: "min" };
    case "custom_scale":
      return { ...base, scaleMax: 10 };
    case "custom_conditional":
      return { ...base, conditionalPrompt: "¿Hubo complicación?" };
    case "custom_table":
      return { ...base, tableColumns: ["Producto", "Cantidad", "Lote"], tableRowCount: 3 };
    default:
      return base;
  }
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
    | "patient_curp"
    | "patient_email"
    | "patient_address"
    | "patient_medical_history"
    | "patient_family_history"
  >
): boolean {
  const section = layout.sections.find((s) => s.builtinKey === id || s.id === id);
  return section ? section.enabled : true;
}

function normalizeTriState(v: unknown): TriStateValue {
  if (v === "yes" || v === "no" || v === "na") return v;
  return null;
}

export function normalizeCustomSections(raw: unknown): CustomSectionsData {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: CustomSectionsData = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== "object" || Array.isArray(val)) continue;
    const row = val as Record<string, unknown>;
    const entry: CustomSectionValue = {};

    if (typeof row.text === "string") entry.text = row.text;
    if (typeof row.shortText === "string") entry.shortText = row.shortText;
    if (typeof row.selected === "string") entry.selected = row.selected;
    if (row.selected === null) entry.selected = null;
    if (typeof row.number === "number" && Number.isFinite(row.number)) entry.number = row.number;
    if (row.number === null) entry.number = null;
    if (row.conditionalYes === true || row.conditionalYes === false) entry.conditionalYes = row.conditionalYes;
    if (row.conditionalYes === null) entry.conditionalYes = null;

    if (row.checks && typeof row.checks === "object" && !Array.isArray(row.checks)) {
      entry.checks = Object.fromEntries(
        Object.entries(row.checks as Record<string, unknown>).filter(([, v]) => typeof v === "boolean") as [
          string,
          boolean,
        ][]
      );
    }

    if (row.triState && typeof row.triState === "object" && !Array.isArray(row.triState)) {
      entry.triState = Object.fromEntries(
        Object.entries(row.triState as Record<string, unknown>).map(([k, v]) => [k, normalizeTriState(v)])
      );
    }

    if (row.triStateNotes && typeof row.triStateNotes === "object" && !Array.isArray(row.triStateNotes)) {
      entry.triStateNotes = Object.fromEntries(
        Object.entries(row.triStateNotes as Record<string, unknown>).filter(
          ([, v]) => typeof v === "string"
        ) as [string, string][]
      );
    }

    if (Array.isArray(row.tableRows)) {
      entry.tableRows = row.tableRows
        .filter((r) => Array.isArray(r))
        .map((r) => (r as unknown[]).map((c) => (typeof c === "string" ? c : "")).slice(0, 6));
    }

    out[key] = entry;
  }
  return out;
}

/** null en SI/NO/N/A → no explícito; al guardar sesión se convierte en "no". */
export function finalizeCustomSections(
  data: CustomSectionsData,
  layout: ClinicalLayoutConfig
): CustomSectionsData {
  const out: CustomSectionsData = { ...data };
  for (const section of layout.sections) {
    if (section.kind !== "custom_yes_no_na") continue;
    const val = out[section.id];
    if (!val) continue;
    const rows = getSectionOptions(section);
    const triState = { ...(val.triState ?? {}) };
    for (const row of rows) {
      if (triState[row] == null) triState[row] = "no";
    }
    out[section.id] = { ...val, triState };
  }
  return out;
}

export function ensureTableRows(
  section: ClinicalLayoutSection,
  existing?: string[][]
): string[][] {
  const cols = getTableColumns(section).length;
  const rows = section.tableRowCount ?? 3;
  const current = existing ?? [];
  return Array.from({ length: rows }, (_, ri) =>
    Array.from({ length: cols }, (_, ci) => current[ri]?.[ci] ?? "")
  );
}

export function customSectionHasPrintContent(
  section: ClinicalLayoutSection,
  val: CustomSectionValue | undefined
): boolean {
  if (!val) return false;
  switch (section.kind) {
    case "custom_text":
      return Boolean(val.text?.trim());
    case "custom_short_text":
      return Boolean(val.shortText?.trim());
    case "custom_checklist":
      return getSectionOptions(section).some((item) => val.checks?.[item]);
    case "custom_yes_no_na":
      return getSectionOptions(section).some(
        (row) => val.triState?.[row] === "yes" || val.triStateNotes?.[row]?.trim()
      );
    case "custom_single_choice":
      return Boolean(val.selected?.trim());
    case "custom_multi_choice":
      return getSectionOptions(section).some((opt) => val.checks?.[opt]);
    case "custom_number":
    case "custom_scale":
      return val.number != null && !Number.isNaN(val.number);
    case "custom_conditional":
      return val.conditionalYes === true || Boolean(val.text?.trim());
    case "custom_table":
      return (val.tableRows ?? []).some((row) => row.some((cell) => cell.trim()));
    default:
      return false;
  }
}
