import { patients as patientsTable, clinicalSessions as sessionsTable } from '../database/schema';
import type { ClinicalSession, Patient } from '../../web/types/clinical';
import {
  normalizeDigitalAlterations,
  normalizeHelomas,
  normalizeLimbAssessment,
  normalizeOnychopathies,
  normalizeSweatDisorders,
} from '../../web/types/podiatry';
import { normalizeCustomSections } from '../../web/types/clinical-layout';

type DbPatient = typeof patientsTable.$inferSelect;
type DbSession = typeof sessionsTable.$inferSelect;

export function mapDbPatient(row: DbPatient): Patient {
  let medicalHistory: Patient['medicalHistory'] = { allergies: [], medications: [], conditions: [] };
  let consent: Patient['consent'] = { given: false, date: null };

  try {
    if (row.medicalHistory) {
      const parsed = JSON.parse(row.medicalHistory);
      medicalHistory = {
        allergies: parsed.allergies || [],
        medications: parsed.medications || [],
        conditions: parsed.conditions || [],
      };
    }
  } catch {
    // valores por defecto
  }

  try {
    if (row.consent) {
      const parsed = JSON.parse(row.consent);
      consent = {
        given: parsed.given ?? false,
        date: parsed.date ?? null,
        consentedToVersion: parsed.consentedToVersion ?? null,
      };
    }
  } catch {
    // valores por defecto
  }

  let clinicalAlerts: Patient['clinicalAlerts'] = [];
  try {
    if (row.clinicalAlertsJson) {
      const parsed = JSON.parse(row.clinicalAlertsJson);
      if (Array.isArray(parsed)) clinicalAlerts = parsed;
    }
  } catch {
    clinicalAlerts = [];
  }

  return {
    id: row.id,
    folio: row.folio,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender as Patient['gender'],
    idNumber: row.idNumber,
    curp: row.curp ?? undefined,
    phone: row.phone,
    email: row.email ?? '',
    address: row.address ?? '',
    city: row.city ?? '',
    postalCode: row.postalCode ?? '',
    medicalHistory,
    consent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    clinicId: row.clinicId ?? null,
    clinicalAlerts,
  };
}

export function mapDbSession(row: DbSession): ClinicalSession {
  type NotesPayload = {
    clinicalNotes?: string;
    anamnesis?: string;
    physicalExamination?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    images?: string[];
    nextAppointmentDate?: string | null;
    followUpNotes?: string | null;
    appointmentReason?: string | null;
    status?: ClinicalSession['status'];
    completedAt?: string | null;
    creditReservedAt?: string | null;
    footType?: ClinicalSession['footType'];
    archType?: ClinicalSession['archType'];
    sweatDisorders?: ClinicalSession['sweatDisorders'];
    limbAssessment?: ClinicalSession['limbAssessment'];
    helomas?: ClinicalSession['helomas'];
    digitalAlterations?: ClinicalSession['digitalAlterations'];
    onychopathies?: ClinicalSession['onychopathies'];
    customSections?: ClinicalSession['customSections'];
  };

  let extra: NotesPayload = {};

  if (row.notes) {
    try {
      const parsed = JSON.parse(row.notes) as NotesPayload | string;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        extra = parsed as NotesPayload;
      }
    } catch {
      // notes como texto plano
    }
  }

  const status: ClinicalSession['status'] =
    extra.status ?? 'draft';

  return {
    id: row.id,
    patientId: row.patientId,
    sessionDate: row.sessionDate,
    status,
    clinicalNotes: extra.clinicalNotes ?? row.notes ?? '',
    anamnesis: extra.anamnesis ?? '',
    physicalExamination: extra.physicalExamination ?? '',
    diagnosis: extra.diagnosis ?? row.diagnosis ?? '',
    treatmentPlan: extra.treatmentPlan ?? row.treatment ?? '',
    images: extra.images ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: extra.completedAt ?? (status === 'completed' ? row.updatedAt : null),
    createdBy: row.createdBy,
    nextAppointmentDate: extra.nextAppointmentDate ?? null,
    followUpNotes: extra.followUpNotes ?? null,
    appointmentReason: (extra.appointmentReason as ClinicalSession['appointmentReason']) ?? null,
    footType: extra.footType ?? null,
    archType: extra.archType ?? null,
    sweatDisorders: normalizeSweatDisorders(extra.sweatDisorders),
    limbAssessment: normalizeLimbAssessment(extra.limbAssessment),
    helomas: normalizeHelomas(extra.helomas),
    digitalAlterations: normalizeDigitalAlterations(extra.digitalAlterations),
    onychopathies: normalizeOnychopathies(extra.onychopathies),
    customSections: normalizeCustomSections(extra.customSections),
  };
}

export function formatPatientExport(patient: Patient, sessions: ClinicalSession[], tenantId = 'tenant_001') {
  return {
    tenantId,
    patientId: patient.id,
    folio: patient.folio,
    exportedAt: new Date().toISOString(),
    patient: {
      folio: patient.folio,
      demographics: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        idNumber: patient.idNumber,
        curp: patient.curp ?? null,
        contact: {
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
          city: patient.city,
          postalCode: patient.postalCode,
        },
      },
      medicalHistory: patient.medicalHistory,
      consent: patient.consent,
      audit: {
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
        createdBy: patient.createdBy,
      },
    },
    clinicalSessions: sessions.map((s) => ({
      id: s.id,
      date: s.sessionDate,
      status: s.status,
      clinicalNotes: s.clinicalNotes,
      anamnesis: s.anamnesis,
      physicalExamination: s.physicalExamination,
      diagnosis: s.diagnosis,
      treatmentPlan: s.treatmentPlan,
      followUpNotes: s.followUpNotes ?? null,
      appointmentReason: s.appointmentReason ?? null,
      footType: s.footType ?? null,
      archType: s.archType ?? null,
      images: s.images.map((img, idx) => ({
        index: idx + 1,
        format: 'webp',
        data: img,
      })),
      audit: {
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        completedAt: s.completedAt,
        createdBy: s.createdBy,
      },
    })),
  };
}
