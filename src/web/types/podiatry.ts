/** Valores estructurados de morfología podológica (sesión / impresión). */

export type PodiatryFootType = "egyptian" | "roman" | "greek" | "germanic" | "celtic";
export type PodiatryArchType = "flat" | "normal" | "cavus";

/** IDs canónicos + etiqueta ES para normalización legacy; UI vía t.podiatry.foot.* */
export const PODIATRY_FOOT_OPTIONS: { value: PodiatryFootType; label: string }[] = [
  { value: "egyptian", label: "Egipcio" },
  { value: "roman", label: "Romano" },
  { value: "greek", label: "Griego" },
  { value: "germanic", label: "Germánico" },
  { value: "celtic", label: "Celta" },
];

export const PODIATRY_ARCH_OPTIONS: { value: PodiatryArchType; label: string }[] = [
  { value: "flat", label: "Plano" },
  { value: "normal", label: "Normal" },
  { value: "cavus", label: "Cavo" },
];

export const podiatryFootLabel = (id: PodiatryFootType | null | undefined): string =>
  PODIATRY_FOOT_OPTIONS.find((o) => o.value === id)?.label ?? "—";

export const podiatryArchLabel = (id: PodiatryArchType | null | undefined): string =>
  PODIATRY_ARCH_OPTIONS.find((o) => o.value === id)?.label ?? "—";

function buildPodiatryValueLookup<T extends string>(
  options: { value: T; label: string }[]
): Map<string, T> {
  const map = new Map<string, T>();
  for (const opt of options) {
    map.set(opt.value.toLowerCase(), opt.value);
    map.set(
      opt.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, ""),
      opt.value
    );
  }
  return map;
}

const FOOT_VALUE_LOOKUP = buildPodiatryValueLookup(PODIATRY_FOOT_OPTIONS);
const ARCH_VALUE_LOOKUP = buildPodiatryValueLookup(PODIATRY_ARCH_OPTIONS);

/** Acepta ID canónico o etiqueta en español (p. ej. seed legacy: «Plano», «Egipcio»). */
export function normalizePodiatryFootType(raw: unknown): PodiatryFootType | null {
  if (raw == null || raw === "") return null;
  const key = String(raw)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return FOOT_VALUE_LOOKUP.get(key) ?? null;
}

/** Acepta ID canónico o etiqueta en español (p. ej. «Plano», «Cavo»). */
export function normalizePodiatryArchType(raw: unknown): PodiatryArchType | null {
  if (raw == null || raw === "") return null;
  const key = String(raw)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return ARCH_VALUE_LOOKUP.get(key) ?? null;
}

export type OnychopathyId =
  | "anoniquia"
  | "microniquia"
  | "onicolisis"
  | "onicauxis"
  | "onicocriptosis"
  | "onicogriptosis"
  | "onicofosis"
  | "paquioniquia"
  | "onicomicosis";

export interface OnychopathyEntry {
  id: OnychopathyId;
  /** true = SI; false = NO explícito; null = sin marcar (se guarda como NO) */
  present: boolean | null;
  toesLeft: string;
  toesRight: string;
}

export const PODIATRY_ONYCHOPATHY_OPTIONS: { id: OnychopathyId; label: string }[] = [
  { id: "anoniquia", label: "Anoniquia" },
  { id: "microniquia", label: "Microniquia" },
  { id: "onicolisis", label: "Onicolisis" },
  { id: "onicauxis", label: "Onicauxis" },
  { id: "onicocriptosis", label: "Onicocriptosis" },
  { id: "onicogriptosis", label: "Onicogriptosis" },
  { id: "onicofosis", label: "Onicofosis" },
  { id: "paquioniquia", label: "Paquioniquia" },
  { id: "onicomicosis", label: "Onicomicosis" },
];

export function createDefaultOnychopathies(): OnychopathyEntry[] {
  return PODIATRY_ONYCHOPATHY_OPTIONS.map((o) => ({
    id: o.id,
    present: null,
    toesLeft: "",
    toesRight: "",
  }));
}

/** Solo true es afirmativo; null/undefined/false → NO */
export const podiatryIsPositive = (v: boolean | null | undefined): boolean => v === true;

export function coercePodiatryPresent(v: boolean | null | undefined): boolean {
  return v === true;
}

export function normalizeOnychopathies(raw: unknown): OnychopathyEntry[] {
  const defaults = createDefaultOnychopathies();
  if (!Array.isArray(raw)) return defaults;
  const byId = new Map<string, OnychopathyEntry>();
  for (const item of raw) {
    if (!item || typeof item !== "object" || !("id" in item)) continue;
    const row = item as Partial<OnychopathyEntry>;
    if (!PODIATRY_ONYCHOPATHY_OPTIONS.some((o) => o.id === row.id)) continue;
    byId.set(row.id!, {
      id: row.id!,
      present: row.present === true ? true : row.present === false ? false : null,
      toesLeft: typeof row.toesLeft === "string" ? row.toesLeft : "",
      toesRight: typeof row.toesRight === "string" ? row.toesRight : "",
    });
  }
  return defaults.map((d) => byId.get(d.id) ?? d);
}

export type SweatDisorderId = "bromhidrosis" | "hiperhidrosis" | "anhidrosis";

export interface SweatDisorderEntry {
  id: SweatDisorderId;
  present: boolean | null;
  notes: string;
}

export const PODIATRY_SWEAT_OPTIONS: { id: SweatDisorderId; label: string }[] = [
  { id: "bromhidrosis", label: "Bromhidrosis" },
  { id: "hiperhidrosis", label: "Hiperhidrosis" },
  { id: "anhidrosis", label: "Anhidrosis" },
];

export type LimbAssessmentId = "edema" | "xerosis" | "varices" | "dermatomycosis";

export interface LimbAssessmentEntry {
  id: LimbAssessmentId;
  left: boolean | null;
  right: boolean | null;
  notes: string;
}

export const PODIATRY_LIMB_OPTIONS: { id: LimbAssessmentId; label: string }[] = [
  { id: "edema", label: "Edema" },
  { id: "xerosis", label: "Resequedad" },
  { id: "varices", label: "Varices" },
  { id: "dermatomycosis", label: "Dermatomicosis" },
];

export type HelomaId = "interphalangeal" | "interdigital" | "dorsal_fifth";

export interface HelomaEntry {
  id: HelomaId;
  present: boolean | null;
  locationLeft: string;
  locationRight: string;
  notes: string;
}

export const PODIATRY_HELOMA_OPTIONS: { id: HelomaId; label: string }[] = [
  { id: "interphalangeal", label: "Interfalángico (2-4)" },
  { id: "interdigital", label: "Interdigitales" },
  { id: "dorsal_fifth", label: "Dorsal 5º dedo" },
];

export type DigitalAlterationId = "hallux_valgus" | "fifth_varus" | "claw_toes";

export interface DigitalAlterationEntry {
  id: DigitalAlterationId;
  present: boolean | null;
  locationLeft: string;
  locationRight: string;
}

export const PODIATRY_DIGITAL_OPTIONS: { id: DigitalAlterationId; label: string }[] = [
  { id: "hallux_valgus", label: "Hallux valgus" },
  { id: "fifth_varus", label: "Quinto varo" },
  { id: "claw_toes", label: "Dedos garra (2-4)" },
];

function normalizePresentEntries<T extends { id: string; present: boolean | null }>(
  options: { id: T["id"] }[],
  raw: unknown,
  defaults: () => T[],
  mapRow: (row: Partial<T> & { id: T["id"] }, base: T) => T
): T[] {
  const base = defaults();
  if (!Array.isArray(raw)) return base;
  const byId = new Map<string, T>();
  for (const item of raw) {
    if (!item || typeof item !== "object" || !("id" in item)) continue;
    const row = item as Partial<T> & { id: T["id"] };
    if (!options.some((o) => o.id === row.id)) continue;
    const d = base.find((b) => b.id === row.id);
    if (!d) continue;
    byId.set(row.id, mapRow(row, d));
  }
  return base.map((d) => byId.get(d.id) ?? d);
}

export function createDefaultSweatDisorders(): SweatDisorderEntry[] {
  return PODIATRY_SWEAT_OPTIONS.map((o) => ({ id: o.id, present: null, notes: "" }));
}

export function normalizeSweatDisorders(raw: unknown): SweatDisorderEntry[] {
  return normalizePresentEntries(
    PODIATRY_SWEAT_OPTIONS,
    raw,
    createDefaultSweatDisorders,
    (row, base) => ({
      ...base,
      present: row.present === true ? true : row.present === false ? false : null,
      notes: typeof row.notes === "string" ? row.notes : "",
    })
  );
}

/** Convierte null → false antes de persistir (sin marcar = NO) */
export function finalizeSweatDisorders(entries: SweatDisorderEntry[]): SweatDisorderEntry[] {
  return entries.map((r) => ({ ...r, present: coercePodiatryPresent(r.present) }));
}

export function createDefaultLimbAssessment(): LimbAssessmentEntry[] {
  return PODIATRY_LIMB_OPTIONS.map((o) => ({
    id: o.id,
    left: null,
    right: null,
    notes: "",
  }));
}

export function normalizeLimbAssessment(raw: unknown): LimbAssessmentEntry[] {
  const base = createDefaultLimbAssessment();
  if (!Array.isArray(raw)) return base;
  const byId = new Map<string, LimbAssessmentEntry>();
  for (const item of raw) {
    if (!item || typeof item !== "object" || !("id" in item)) continue;
    const row = item as Partial<LimbAssessmentEntry>;
    if (!PODIATRY_LIMB_OPTIONS.some((o) => o.id === row.id)) continue;
    byId.set(row.id!, {
      id: row.id!,
      left: row.left === true ? true : row.left === false ? false : null,
      right: row.right === true ? true : row.right === false ? false : null,
      notes: typeof row.notes === "string" ? row.notes : "",
    });
  }
  return base.map((d) => byId.get(d.id) ?? d);
}

export function finalizeLimbAssessment(entries: LimbAssessmentEntry[]): LimbAssessmentEntry[] {
  return entries.map((r) => ({
    ...r,
    left: coercePodiatryPresent(r.left),
    right: coercePodiatryPresent(r.right),
  }));
}

export function createDefaultHelomas(): HelomaEntry[] {
  return PODIATRY_HELOMA_OPTIONS.map((o) => ({
    id: o.id,
    present: null,
    locationLeft: "",
    locationRight: "",
    notes: "",
  }));
}

export function normalizeHelomas(raw: unknown): HelomaEntry[] {
  const base = createDefaultHelomas();
  if (!Array.isArray(raw)) return base;
  const byId = new Map<string, HelomaEntry>();
  for (const item of raw) {
    if (!item || typeof item !== "object" || !("id" in item)) continue;
    const row = item as Partial<HelomaEntry>;
    if (!PODIATRY_HELOMA_OPTIONS.some((o) => o.id === row.id)) continue;
    byId.set(row.id!, {
      id: row.id!,
      present: row.present === true ? true : row.present === false ? false : null,
      locationLeft: typeof row.locationLeft === "string" ? row.locationLeft : "",
      locationRight: typeof row.locationRight === "string" ? row.locationRight : "",
      notes: typeof row.notes === "string" ? row.notes : "",
    });
  }
  return base.map((d) => byId.get(d.id) ?? d);
}

export function finalizeHelomas(entries: HelomaEntry[]): HelomaEntry[] {
  return entries.map((r) => ({ ...r, present: coercePodiatryPresent(r.present) }));
}

export function createDefaultDigitalAlterations(): DigitalAlterationEntry[] {
  return PODIATRY_DIGITAL_OPTIONS.map((o) => ({
    id: o.id,
    present: null,
    locationLeft: "",
    locationRight: "",
  }));
}

export function normalizeDigitalAlterations(raw: unknown): DigitalAlterationEntry[] {
  const base = createDefaultDigitalAlterations();
  if (!Array.isArray(raw)) return base;
  const byId = new Map<string, DigitalAlterationEntry>();
  for (const item of raw) {
    if (!item || typeof item !== "object" || !("id" in item)) continue;
    const row = item as Partial<DigitalAlterationEntry>;
    if (!PODIATRY_DIGITAL_OPTIONS.some((o) => o.id === row.id)) continue;
    byId.set(row.id!, {
      id: row.id!,
      present: row.present === true ? true : row.present === false ? false : null,
      locationLeft: typeof row.locationLeft === "string" ? row.locationLeft : "",
      locationRight: typeof row.locationRight === "string" ? row.locationRight : "",
    });
  }
  return base.map((d) => byId.get(d.id) ?? d);
}

export function finalizeDigitalAlterations(entries: DigitalAlterationEntry[]): DigitalAlterationEntry[] {
  return entries.map((r) => ({ ...r, present: coercePodiatryPresent(r.present) }));
}

export function finalizeOnychopathies(entries: OnychopathyEntry[]): OnychopathyEntry[] {
  return entries.map((r) => ({ ...r, present: coercePodiatryPresent(r.present) }));
}
