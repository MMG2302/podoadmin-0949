/** Utilidades para formulario e impresión de recetas. */

export type PrescriptionFormData = {
  prescriptionText: string;
  medications: string;
  nextVisitDate: string;
  notes: string;
  patientWeightKg: string;
  patientHeightCm: string;
  podiatristCedula: string;
};

export const EMPTY_PRESCRIPTION_FORM: PrescriptionFormData = {
  prescriptionText: "",
  medications: "",
  nextVisitDate: "",
  notes: "",
  patientWeightKg: "",
  patientHeightCm: "",
  podiatristCedula: "",
};

export function computeAgeYears(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth?.trim()) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 130 ? age : null;
}

export function formatPrescriptionAge(ageYears: number | null | undefined): string {
  if (ageYears == null || Number.isNaN(ageYears)) return "—";
  return `${ageYears} años`;
}
