/** Tipos clínicos compartidos entre frontend y API (D1 es la fuente de verdad). */

export interface ClinicalAlert {
  type: string;
  message: string;
  severity: "low" | "medium" | "high";
}

export interface Patient {
  id: string;
  folio: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  idNumber: string;
  curp?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  consent: {
    given: boolean;
    date: string | null;
    consentedToVersion?: number | null;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  clinicalAlerts?: ClinicalAlert[];
}

export interface Appointment {
  id: string;
  patientId: string | null;
  podiatristId: string;
  clinicId: string;
  date: string;
  time: string;
  duration: number;
  notes: string;
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  checkInStatus?: "none" | "waiting" | "in_room" | "seen";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  pendingPatientName?: string;
  pendingPatientPhone?: string;
}

export type AppointmentReason =
  | "routine_checkup"
  | "treatment_continuation"
  | "post_procedure_review"
  | "new_symptoms"
  | "follow_up"
  | "other";

export interface ClinicalSession {
  id: string;
  patientId: string;
  sessionDate: string;
  status: "draft" | "completed";
  clinicalNotes: string;
  anamnesis: string;
  physicalExamination: string;
  diagnosis: string;
  treatmentPlan: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  createdBy: string;
  nextAppointmentDate: string | null;
  followUpNotes: string | null;
  appointmentReason: AppointmentReason | null;
}

export type ClinicalStatsMap = Record<
  string,
  { patientCount: number; sessionCount: number }
>;
