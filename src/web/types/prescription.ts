export interface Prescription {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientDni: string;
  podiatristId: string;
  podiatristName: string;
  podiatristLicense: string | null;
  prescriptionDate: string;
  prescriptionText: string;
  medications: string;
  nextVisitDate: string | null;
  notes: string;
  folio: string;
  patientAgeYears: number | null;
  patientWeightKg: string | null;
  patientHeightCm: string | null;
  podiatristCedula: string | null;
  createdAt: string;
  createdBy: string;
}
