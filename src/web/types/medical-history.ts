/** Antecedentes personales y familiares del paciente (ficha + impresión). */

export type FamilyAntecedentId = "hypertension" | "diabetes" | "psoriasis" | "other";

export type AntecedentEntry = {
  /** true = SI, false = NO, null = sin responder (impresión: NO) */
  present: boolean | null;
  /** Enfermedad u otra condición (principalmente para antecedente "other") */
  condition: string;
  notes: string;
};

export type PatientMedicalHistory = {
  allergies: string[];
  medications: string[];
  conditions: string[];
  family: Record<FamilyAntecedentId, AntecedentEntry>;
};

export const FAMILY_ANTECEDENT_IDS: FamilyAntecedentId[] = [
  "hypertension",
  "diabetes",
  "psoriasis",
  "other",
];

export const FAMILY_ANTECEDENT_LABELS: Record<FamilyAntecedentId, string> = {
  hypertension: "Hipertensión arterial",
  diabetes: "Diabetes",
  psoriasis: "Psoriasis",
  other: "Otra enfermedad relevante",
};

export function createDefaultAntecedentEntry(): AntecedentEntry {
  return { present: null, condition: "", notes: "" };
}

export function createDefaultMedicalHistory(): PatientMedicalHistory {
  return {
    allergies: [],
    medications: [],
    conditions: [],
    family: {
      hypertension: createDefaultAntecedentEntry(),
      diabetes: createDefaultAntecedentEntry(),
      psoriasis: createDefaultAntecedentEntry(),
      other: createDefaultAntecedentEntry(),
    },
  };
}

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => typeof x === "string" && x.trim())
    .map((x) => String(x).trim());
}

function parseAntecedentEntry(raw: unknown): AntecedentEntry {
  const base = createDefaultAntecedentEntry();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const row = raw as Record<string, unknown>;
  if (row.present === true || row.present === false) base.present = row.present;
  if (typeof row.condition === "string") base.condition = row.condition.trim();
  if (typeof row.notes === "string") base.notes = row.notes.trim();
  return base;
}

export function normalizeMedicalHistory(raw: unknown): PatientMedicalHistory {
  const base = createDefaultMedicalHistory();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const row = raw as Record<string, unknown>;

  base.allergies = parseStringList(row.allergies);
  base.medications = parseStringList(row.medications);
  base.conditions = parseStringList(row.conditions);

  if (row.family && typeof row.family === "object" && !Array.isArray(row.family)) {
    const fam = row.family as Record<string, unknown>;
    for (const id of FAMILY_ANTECEDENT_IDS) {
      base.family[id] = parseAntecedentEntry(fam[id]);
    }
  }

  return base;
}

export function formatFamilyAntecedentPrintRow(
  id: FamilyAntecedentId,
  entry: AntecedentEntry | undefined
): [label: string, siNo: "SI" | "NO", observations: string] {
  const present = entry?.present ?? null;
  const siNo = formatAntecedentSiNo(present);
  const notes = entry?.notes?.trim() || "";

  if (id === "other") {
    const condition = entry?.condition?.trim() || "";
    const label = condition || FAMILY_ANTECEDENT_LABELS.other;
    const obs = present === true ? notes || "—" : "—";
    return [label, siNo, obs];
  }

  return [FAMILY_ANTECEDENT_LABELS[id], siNo, notes || "—"];
}

export function formatAntecedentSiNo(present: boolean | null): "SI" | "NO" {
  return present === true ? "SI" : "NO";
}
