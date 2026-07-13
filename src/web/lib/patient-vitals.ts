/** Normaliza peso/estatura (kg / cm) para sesiones, pacientes y recetas. */
export function normalizePatientVital(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

export function patientVitalToFormValue(value: string | null | undefined): string {
  return value?.trim() ?? "";
}
