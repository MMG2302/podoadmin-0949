/** Etiquetas de alcance que envía el API en español (sistema, no datos de usuario). */
const SYSTEM_SCOPE_ES = {
  myPractice: "Mi consulta",
  entireClinic: "Toda la clínica",
  podiatrist: "Podólogo",
  assignedPodiatrist: "Podólogo asignado",
} as const;

export type SystemScopeLabels = {
  myPractice: string;
  entireClinic: string;
  podiatristFallback: string;
  assignedPodiatrist: string;
};

/** Traduce labels de alcance del sistema; deja pasar nombres de usuarios/clínicas. */
export function translateSystemScopeLabel(
  label: string | null | undefined,
  t: SystemScopeLabels
): string | null {
  if (!label?.trim()) return null;
  const trimmed = label.trim();
  if (trimmed === SYSTEM_SCOPE_ES.myPractice) return t.myPractice;
  if (trimmed === SYSTEM_SCOPE_ES.entireClinic) return t.entireClinic;
  if (trimmed === SYSTEM_SCOPE_ES.podiatrist) return t.podiatristFallback;
  if (trimmed === SYSTEM_SCOPE_ES.assignedPodiatrist) return t.assignedPodiatrist;
  return trimmed;
}
