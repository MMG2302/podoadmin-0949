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
  createdAt: string;
  createdBy: string;
}
