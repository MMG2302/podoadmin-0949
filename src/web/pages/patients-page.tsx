import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import type { Patient } from "../types/clinical";
import { postAuditLog } from "../lib/audit-client";
import {
  PatientClinicalAlertsSection,
  PatientLabAttachmentsSection,
} from "../components/patients/patient-clinical-extras";
import { PatientEvolutionNotesSection } from "../components/patients/patient-evolution-notes";
import { PatientEvolutionReportButton } from "../components/sessions/session-clinical-extras";
import { api } from "../lib/api-client";
import { useClinicalLayout } from "../hooks/use-clinical-layout";
import { useClinicalListPage } from "../hooks/use-clinical-list-page";
import { fetchPatientById } from "../hooks/use-patient-picker";
import { invalidateClinicalListCache } from "../lib/clinical-list-cache";
import { ClinicalListError, ClinicalListLoading } from "../components/clinical/clinical-list-states";
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from "../components/ui/app-modal";
import { isPatientFieldEnabled } from "../types/clinical-layout";
import { createDefaultMedicalHistory, normalizeMedicalHistory } from "../types/medical-history";
import type { FamilyAntecedentId, PatientMedicalHistory } from "../types/medical-history";
import {
  PatientFamilyAntecedentsFields,
  PatientFamilyAntecedentsSummary,
  PatientPersonalAntecedentsFields,
  PatientPersonalAntecedentsSummary,
} from "../components/patients/patient-antecedents-fields";
import { useTenantCountry } from "../hooks/use-tenant-country";
import { formatPhoneDisplay, phonePlaceholderForCountry } from "../lib/whatsapp-web-link";
import { formErrorClass, formHintClass, formLabelClass, formSuccessClass, semanticAlertErrorClass, semanticAlertWarningClass } from "../lib/form-field-classes";

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  idNumber: string;
  curp: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  allergies: string;
  medications: string;
  conditions: string;
  family: PatientMedicalHistory["family"];
  consentGiven: boolean;
}

const emptyForm: PatientFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "other",
  idNumber: "",
  curp: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  allergies: "",
  medications: "",
  conditions: "",
  family: createDefaultMedicalHistory().family,
  consentGiven: false,
};

const PatientsPage = () => {
  const { t } = useLanguage();
  const { user, getAllUsers } = useAuth();
  const tenantCountry = useTenantCountry(user);
  const { isSuperAdmin, isPodiatrist, isClinicAdmin, isReceptionist } = usePermissions();
  const { layout: clinicalLayout } = useClinicalLayout();
  const showPatientCurp = isPatientFieldEnabled(clinicalLayout, "patient_curp");
  const showPatientEmail = isPatientFieldEnabled(clinicalLayout, "patient_email");
  const showPatientAddress = isPatientFieldEnabled(clinicalLayout, "patient_address");
  const showPatientMedicalHistory = isPatientFieldEnabled(clinicalLayout, "patient_medical_history");
  const showPatientFamilyHistory = isPatientFieldEnabled(clinicalLayout, "patient_family_history");
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isClinicAdmin) setLocation("/clinic");
  }, [isClinicAdmin, setLocation]);

  // Podiatrists can siempre crear pacientes.
  // Recepcionistas solo pueden crear pacientes si tienen al menos un podólogo asignado.
  const receptionistHasAssignedPodiatrists =
    isReceptionist && !!user?.assignedPodiatristIds?.length;
  const canCreatePatient = isPodiatrist || receptionistHasAssignedPodiatrists;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    items: patients,
    hasMore,
    isLoading: clinicalListLoading,
    isLoadingMore,
    error: clinicalListError,
    reload: reloadClinicalLists,
    loadMore,
  } = useClinicalListPage<Patient>({
    path: "/patients",
    listKey: "patients",
    filters: debouncedQ ? { q: debouncedQ } : {},
  });
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Podólogos disponibles para una recepcionista (los que tiene asignados)
  const allUsers = getAllUsers();
  const assignedPodiatrists = isReceptionist && user?.assignedPodiatristIds?.length
    ? allUsers.filter((u) => user.assignedPodiatristIds!.includes(u.id))
    : [];
  const [receptionistPodiatristId, setReceptionistPodiatristId] = useState<string>("");
  const [deleteConfirmPatient, setDeleteConfirmPatient] = useState<Patient | null>(null);
  const [deleteCascadeMode, setDeleteCascadeMode] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Términos y condiciones / consentimiento informado (configurado por clinic_admin o podólogo)
  const [consentText, setConsentText] = useState<string | null>(null);
  const [consentTextVersion, setConsentTextVersion] = useState<number>(0);
  const [graceError, setGraceError] = useState<string | null>(null);

  useEffect(() => {
    if (!showForm || !canCreatePatient) return;
    const podiatristId = isReceptionist ? receptionistPodiatristId : user?.id;
    if (isReceptionist && !podiatristId) {
      setConsentText(null);
      setConsentTextVersion(0);
      return;
    }
    const url = isReceptionist && podiatristId
      ? `/consent-document?podiatristId=${encodeURIComponent(podiatristId)}`
      : "/consent-document";
    api.get<{ success?: boolean; consentText?: string | null; consentTextVersion?: number }>(url).then((res) => {
      setConsentText(res.success && res.data?.consentText ? res.data.consentText : null);
      setConsentTextVersion(res.data?.consentTextVersion ?? 0);
    }).catch(() => {
      setConsentText(null);
      setConsentTextVersion(0);
    });
  }, [showForm, canCreatePatient, isReceptionist, receptionistPodiatristId, user?.id]);

  // Leer id de paciente desde la URL para poder abrir directamente la ficha (/patients?id=...)
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const patientIdFromUrl: string | null = searchParams.get("id");

  const sessionCountByPatient = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of patients) {
      counts[p.id] = p.sessionCount ?? 0;
    }
    return counts;
  }, [patients]);

  // Abrir/cerrar automáticamente el modal de detalles según /patients?id=...
  useEffect(() => {
    if (!patientIdFromUrl) {
      setSelectedPatient(null);
      return;
    }
    const inList = patients.find((p) => p.id === patientIdFromUrl);
    if (inList) {
      setSelectedPatient(inList);
      return;
    }
    void fetchPatientById(patientIdFromUrl).then((p) => {
      if (p) setSelectedPatient(p);
    });
  }, [patientIdFromUrl, patients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setFormErrors({});
  setGraceError(null);
    const createdBy = isReceptionist && receptionistPodiatristId ? receptionistPodiatristId : (user?.id || "");
    if (isReceptionist && !receptionistPodiatristId && !editingPatient) {
      return; // receptionist must select podiatrist when creating
    }
    // Validación rápida en frontend para evitar "error interno" cuando algo viene vacío/undefined (especialmente en móviles)
    const localErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) localErrors.firstName = "Nombre es requerido";
    if (!formData.lastName.trim()) localErrors.lastName = "Apellidos son requeridos";
    if (!formData.dateOfBirth) localErrors.dateOfBirth = "Fecha de nacimiento es requerida";
    if (!formData.gender) localErrors.gender = "Género es requerido";
    if (!formData.idNumber.trim()) localErrors.idNumber = "DNI/NIE es requerido";
    if (!formData.phone.trim()) localErrors.phone = "Teléfono es requerido";
    // Email es opcional, pero si se rellena, validamos formato básico
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      localErrors.email = "Email inválido";
    }
    if (Object.keys(localErrors).length > 0) {
      setFormErrors(localErrors);
      return;
    }

    const patientData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      idNumber: formData.idNumber,
      curp: formData.curp.trim() || undefined,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      medicalHistory: normalizeMedicalHistory({
        allergies: formData.allergies.split(",").map((s) => s.trim()).filter(Boolean),
        medications: formData.medications.split(",").map((s) => s.trim()).filter(Boolean),
        conditions: formData.conditions.split(",").map((s) => s.trim()).filter(Boolean),
        family: formData.family,
      }),
      consent: {
        given: formData.consentGiven,
        date: formData.consentGiven ? new Date().toISOString() : null,
        consentedToVersion: formData.consentGiven ? consentTextVersion : undefined,
      },
    };

    try {
      if (editingPatient) {
        // Only update mutable fields - protect immutable fields from being changed
        const mutableUpdates: Record<string, unknown> = {
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          medicalHistory: patientData.medicalHistory,
          consent: patientData.consent,
        };
        if (!editingPatient.idNumber?.trim()) {
          mutableUpdates.idNumber = formData.idNumber;
        }

        // Backend aplica permisos y lógica de negocio
        const response = await api.put<{ success: boolean; patient: Patient }>(
          `/patients/${editingPatient.id}`,
          mutableUpdates
        );

        if (response.success && response.data?.success) {
          const updated = response.data.patient;
          invalidateClinicalListCache();
          void reloadClinicalLists();
          void postAuditLog({
            action: "UPDATE",
            resourceType: "patient",
            resourceId: updated.id,
            details: {
              patientId: updated.id,
              patientName: `${updated.firstName} ${updated.lastName}`,
              folio: updated.folio,
            },
          });
        } else {
          const errData = response.data as any;
          if (errData?.issues && Array.isArray(errData.issues)) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of errData.issues as { path?: unknown[]; message?: string }[]) {
              const field = issue?.path && Array.isArray(issue.path) ? issue.path[0] : undefined;
              if (typeof field === "string" && issue.message && !fieldErrors[field]) {
                fieldErrors[field] = issue.message;
              }
            }
            setFormErrors(fieldErrors);
          }
          alert(response.error || errData?.message || "No se pudo actualizar el paciente.");
          return;
        }
      } else {
        // Crear nuevo paciente vía API. Recepcionista debe enviar createdBy (podólogo asignado).
        const payload =
          isReceptionist && receptionistPodiatristId
            ? { ...patientData, createdBy: receptionistPodiatristId }
            : patientData;
        const response = await api.post<{ success: boolean; patient: Patient }>(
          "/patients",
          payload
        );

        if (response.success && response.data?.success) {
          const newPatient = response.data.patient;
          invalidateClinicalListCache();
          void reloadClinicalLists();
          void postAuditLog({
            action: "CREATE",
            resourceType: "patient",
            resourceId: newPatient.id,
            details: {
              patientId: newPatient.id,
              patientName: `${newPatient.firstName} ${newPatient.lastName}`,
              folio: newPatient.folio,
            },
          });
        } else {
          const errData = response.data as any;
          const errorCode = response.error || errData?.error;

          if (errorCode === "usuario_en_periodo_gracia") {
            setGraceError(
              errData?.message ||
                "Tu cuenta está en período de gracia por exceso de pago. Durante 30 días puedes ver tus datos, pero no crear nuevos pacientes."
            );
            return;
          }

          if (errData?.issues && Array.isArray(errData.issues)) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of errData.issues as { path?: unknown[]; message?: string }[]) {
              const field = issue?.path && Array.isArray(issue.path) ? issue.path[0] : undefined;
              if (typeof field === "string" && issue.message && !fieldErrors[field]) {
                fieldErrors[field] = issue.message;
              }
            }
            setFormErrors(fieldErrors);
          }
          alert(response.error || errData?.message || "No se pudo crear el paciente.");
          return;
        }
      }
    } catch (error) {
      console.error("Error guardando paciente:", error);
      alert("Ha ocurrido un error al guardar el paciente.");
      return;
    }

    setShowForm(false);
    setEditingPatient(null);
    setFormData(emptyForm);
    setReceptionistPodiatristId("");
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      idNumber: patient.idNumber,
      curp: patient.curp ?? "",
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      city: patient.city,
      postalCode: patient.postalCode,
      allergies: patient.medicalHistory.allergies.join(", "),
      medications: patient.medicalHistory.medications.join(", "),
      conditions: patient.medicalHistory.conditions.join(", "),
      family: normalizeMedicalHistory(patient.medicalHistory).family,
      consentGiven: patient.consent.given,
    });
    setShowForm(true);
  };

  const openDeleteConfirm = (patient: Patient) => {
    if (isReceptionist) return;
    setDeleteCascadeMode(false);
    setDeleteConfirmPatient(patient);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmPatient(null);
    setDeleteCascadeMode(false);
  };

  const executeDelete = async (patient: Patient, cascade: boolean) => {
    setDeleteInProgress(true);
    try {
      const url = cascade ? `/patients/${patient.id}?cascade=true` : `/patients/${patient.id}`;
      const response = await api.delete<{ success: boolean; message?: string }>(url);

      if (response.success && response.data?.success) {
        invalidateClinicalListCache();
        void reloadClinicalLists();
        closeDeleteConfirm();
        if (selectedPatient?.id === patient.id) setSelectedPatient(null);
        void postAuditLog({
          action: "DELETE",
          resourceType: "patient",
          resourceId: patient.id,
          details: {
            patientId: patient.id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            folio: patient.folio,
            cascade,
          },
        });
      } else {
        const err = response.data as { error?: string; message?: string } | undefined;
        if (err?.error === "patient_has_records") {
          setDeleteCascadeMode(true);
        } else {
          alert(err?.message || response.error || "No se pudo eliminar el paciente.");
        }
      }
    } catch (error) {
      console.error("Error eliminando paciente:", error);
      alert("Ha ocurrido un error al eliminar el paciente.");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES");
  };

  const closePatientDetail = () => {
    setLocation("/patients");
    setSelectedPatient(null);
  };

  const closePatientForm = () => {
    setShowForm(false);
    setEditingPatient(null);
    setFormData(emptyForm);
    setReceptionistPodiatristId("");
  };

  if (isClinicAdmin) return null;

  return (
    <MainLayout title={t.patients.title} >
      {/* Patient Detail View - Mobile Optimized */}
      {selectedPatient && (
        <AppModal open onClose={closePatientDetail} maxWidth="2xl">
            <AppModalHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-brand-ink">
                    {t.patients.patientDetails}
                  </h3>
                  <div className="flex items-center gap-2 bg-brand-canvas px-3 py-2 rounded-lg mt-2">
                    <span className="text-sm text-brand-muted font-medium">FOLIO:</span>
                    <span className="text-base font-bold text-brand-ink tracking-wide truncate">
                      {selectedPatient.folio || "—"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePatientDetail}
                  className="p-2 hover:bg-brand-canvas active:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                  aria-label={t.common.close}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </AppModalHeader>
            
            <AppModalBody className="space-y-6">
              {/* Demographics */}
              <div>
                <h4 className="font-medium text-brand-ink mb-3">Datos personales</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t.patients.firstName}:</span>
                    <span className="ml-2 font-medium">{selectedPatient.firstName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t.patients.lastName}:</span>
                    <span className="ml-2 font-medium">{selectedPatient.lastName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t.patients.dateOfBirth}:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedPatient.dateOfBirth)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t.patients.gender}:</span>
                    <span className="ml-2 font-medium">
                      {selectedPatient.gender === "male" ? t.patients.male : 
                       selectedPatient.gender === "female" ? t.patients.female : t.patients.other}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t.patients.idNumber}:</span>
                    <span className="ml-2 font-medium">{selectedPatient.idNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t.patients.phone}:</span>
                    <span className="ml-2 font-medium">{formatPhoneDisplay(selectedPatient.phone, tenantCountry)}</span>
                  </div>
                  {showPatientEmail && (
                  <div className="col-span-2">
                    <span className="text-gray-500">{t.patients.email}:</span>
                    <span className="ml-2 font-medium">{selectedPatient.email}</span>
                  </div>
                  )}
                  {showPatientAddress && (
                  <div className="col-span-2">
                    <span className="text-gray-500">{t.patients.address}:</span>
                    <span className="ml-2 font-medium">
                      {selectedPatient.address}, {selectedPatient.city} {selectedPatient.postalCode}
                    </span>
                  </div>
                  )}
                </div>
              </div>

              {showPatientMedicalHistory && (
              <PatientPersonalAntecedentsSummary
                medicalHistory={normalizeMedicalHistory(selectedPatient.medicalHistory)}
                labels={{
                  title: t.patients.medicalHistory,
                  allergies: t.patients.allergies,
                  medications: t.patients.medications,
                  conditions: t.patients.conditions,
                  none: "Ninguna",
                }}
              />
              )}

              {showPatientFamilyHistory && (
              <PatientFamilyAntecedentsSummary
                medicalHistory={normalizeMedicalHistory(selectedPatient.medicalHistory)}
              />
              )}

              {/* Alertas clínicas */}
              <PatientClinicalAlertsSection
                patient={selectedPatient}
                onUpdated={(alerts) =>
                  setSelectedPatient((p) => (p ? { ...p, clinicalAlerts: alerts } : p))
                }
              />

              <PatientEvolutionNotesSection patient={selectedPatient} />

              <div className="mt-2">
                <PatientEvolutionReportButton patientId={selectedPatient.id} />
              </div>

              {/* Consent */}
              <div>
                <h4 className="font-medium text-brand-ink mb-3">{t.patients.consent}</h4>
                <div className="flex items-center gap-2 text-sm">
                  {selectedPatient.consent.given ? (
                    <>
                      <svg className="w-5 h-5 text-semantic-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={formSuccessClass}>{t.patients.consentGiven}</span>
                      {selectedPatient.consent.date && (
                        <span className="text-gray-500">
                          ({formatDate(selectedPatient.consent.date)})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-semantic-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className={formErrorClass}>Sin consentimiento</span>
                    </>
                  )}
                </div>
              </div>

              <PatientLabAttachmentsSection patientId={selectedPatient.id} />

              {/* Sessions Summary */}
              <div>
                <h4 className="font-medium text-brand-ink mb-3">{t.patients.clinicalHistory}</h4>
                <div className="text-sm">
                  <span className="text-gray-500">{t.patients.totalSessions}:</span>
                  <span className="ml-2 font-medium">
                    {sessionCountByPatient[selectedPatient.id] ?? 0}
                  </span>
                </div>
              </div>

            </AppModalBody>

            <AppModalFooter>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    closePatientDetail();
                    handleEdit(selectedPatient);
                  }}
                  className="flex-1 min-w-[100px] py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  {t.common.edit}
                </button>
                {!isReceptionist && (
                  <Link
                    href={`/sessions?patient=${selectedPatient.id}`}
                    className="flex-1 min-w-[100px] py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium text-sm text-center"
                  >
                    {t.patients.viewHistory}
                  </Link>
                )}
                {!isReceptionist && (
                  <button
                    type="button"
                    onClick={() => {
                      openDeleteConfirm(selectedPatient);
                      closePatientDetail();
                    }}
                    className="py-2.5 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm sm:flex-none"
                  >
                    {t.common.delete}
                  </button>
                )}
              </div>
            </AppModalFooter>
        </AppModal>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirmPatient && (
        <AppModal open onClose={closeDeleteConfirm} maxWidth="md" zIndex={60}>
          <AppModalBody className="!py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-brand-ink mb-2">
                  {deleteCascadeMode ? "Eliminar paciente y todo su historial" : "¿Eliminar paciente?"}
                </h3>
                {deleteCascadeMode ? (
                  <p className="text-brand-muted text-sm">
                    Este paciente tiene sesiones clínicas y/o citas asociadas. Si continúa, se eliminará el paciente, todas sus sesiones y citas. Esta acción no se puede deshacer.
                  </p>
                ) : (
                  <p className="text-brand-muted text-sm">
                    Se eliminará el paciente <strong>{deleteConfirmPatient.firstName} {deleteConfirmPatient.lastName}</strong> y no se podrá recuperar. Esta acción es permanente.
                  </p>
                )}
              </div>
            </div>
          </AppModalBody>
          <AppModalFooter>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeDelete(deleteConfirmPatient, deleteCascadeMode)}
                disabled={deleteInProgress}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteInProgress ? "Eliminando…" : (deleteCascadeMode ? "Eliminar todo" : "Eliminar")}
              </button>
            </div>
          </AppModalFooter>
        </AppModal>
      )}

      {/* Patient Form Modal */}
      {showForm && (
        <AppModal open onClose={closePatientForm} maxWidth="2xl">
            <AppModalHeader>
              <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg sm:text-xl font-semibold text-brand-ink min-w-0 truncate">
                {editingPatient ? t.patients.editPatient : t.patients.addPatient}
              </h3>
              <button
                type="button"
                onClick={closePatientForm}
                className="p-2 hover:bg-brand-canvas active:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                aria-label={t.common.close}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              </div>
            </AppModalHeader>

            <AppModalBody>
            <form id="patient-form" onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 pb-safe">
              {/* Immutable fields notice when editing */}
              {editingPatient && (
                <div className={semanticAlertWarningClass}>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-semantic-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">Campos protegidos</p>
                      <p className="text-sm mt-0.5">
                        Los campos con 🔒 no pueden ser modificados después de la creación para garantizar la integridad de los datos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Podólogo asignado (solo recepcionista al crear) */}
              {isReceptionist && !editingPatient && assignedPodiatrists.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">Podólogo para el paciente *</label>
                  <select
                    value={receptionistPodiatristId}
                    onChange={(e) => setReceptionistPodiatristId(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    required
                  >
                    <option value="">Seleccionar podólogo</option>
                    {assignedPodiatrists.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className={`text-xs ${formHintClass} mt-0.5`}>El paciente quedará asignado a este podólogo.</p>
                </div>
              )}

              {/* Personal Info - Responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1 flex items-center gap-1">
                    {t.patients.firstName} *
                    {editingPatient && <span title="Este campo no puede ser modificado">🔒</span>}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => !editingPatient && setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!!editingPatient}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      editingPatient
                        ? "bg-brand-canvas border-brand-border text-brand-muted cursor-not-allowed"
                        : formErrors.firstName
                        ? "border-semantic-error focus:border-semantic-error focus:ring-1 focus:ring-semantic-error"
                        : "border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  />
                  {formErrors.firstName && (
                    <p className={`mt-1 text-xs ${formErrorClass}`}>{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1 flex items-center gap-1">
                    {t.patients.lastName} *
                    {editingPatient && <span title="Este campo no puede ser modificado">🔒</span>}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => !editingPatient && setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!!editingPatient}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      editingPatient
                        ? "bg-brand-canvas border-brand-border text-brand-muted cursor-not-allowed"
                        : formErrors.lastName
                        ? "border-semantic-error focus:border-semantic-error focus:ring-1 focus:ring-semantic-error"
                        : "border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  />
                  {formErrors.lastName && (
                    <p className={`mt-1 text-xs ${formErrorClass}`}>{formErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1 flex items-center gap-1">
                    {t.patients.dateOfBirth} *
                    {editingPatient && <span title="Este campo no puede ser modificado">🔒</span>}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => !editingPatient && setFormData({ ...formData, dateOfBirth: e.target.value })}
                    disabled={!!editingPatient}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      editingPatient
                        ? "bg-brand-canvas border-brand-border text-brand-muted cursor-not-allowed"
                        : formErrors.dateOfBirth
                        ? "border-semantic-error focus:border-semantic-error focus:ring-1 focus:ring-semantic-error"
                        : "border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  />
                  {formErrors.dateOfBirth && (
                    <p className={`mt-1 text-xs ${formErrorClass}`}>{formErrors.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1 flex items-center gap-1">
                    {t.patients.gender} *
                    {editingPatient && <span title="Este campo no puede ser modificado">🔒</span>}
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => !editingPatient && setFormData({ ...formData, gender: e.target.value as "male" | "female" | "other" })}
                    disabled={!!editingPatient}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      editingPatient
                        ? "bg-brand-canvas border-brand-border text-brand-muted cursor-not-allowed"
                        : formErrors.gender
                        ? "border-semantic-error focus:border-semantic-error focus:ring-1 focus:ring-semantic-error"
                        : "border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  >
                    <option value="male">{t.patients.male}</option>
                    <option value="female">{t.patients.female}</option>
                    <option value="other">{t.patients.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1 flex items-center gap-1">
                    {t.patients.idNumber} *
                    {editingPatient && editingPatient.idNumber?.trim() && <span title="Este campo no puede ser modificado">🔒</span>}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.idNumber}
                    onChange={(e) => {
                      const canEditIdNumber = !editingPatient || !editingPatient.idNumber?.trim();
                      if (canEditIdNumber) setFormData({ ...formData, idNumber: e.target.value });
                    }}
                    disabled={!!editingPatient && !!editingPatient.idNumber?.trim()}
                    placeholder="Para menores, DNI del padre o tutor"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      editingPatient && editingPatient.idNumber?.trim()
                        ? "bg-brand-canvas border-brand-border text-brand-muted cursor-not-allowed"
                        : formErrors.idNumber
                        ? "border-semantic-error focus:border-semantic-error focus:ring-1 focus:ring-semantic-error"
                        : "border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    }`}
                    title={editingPatient && editingPatient.idNumber?.trim() ? "Este campo no puede ser modificado" : "Obligatorio. Para menores de edad, indicar el DNI del padre o tutor legal."}
                  />
                  <p className={`text-xs ${formHintClass} mt-1`}>
                    Obligatorio para crear sesiones. Si el paciente es menor de edad, indicar el DNI del padre o tutor.
                  </p>
                  {formErrors.idNumber && (
                    <p className={`mt-1 text-xs ${formErrorClass}`}>{formErrors.idNumber}</p>
                  )}
                </div>
                {showPatientCurp && (
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1 flex items-center gap-1">
                    {t.patients.curp}
                    {editingPatient && editingPatient.curp?.trim() && (
                      <span title="Este campo no puede ser modificado">🔒</span>
                    )}
                  </label>
                  <p className="text-xs text-brand-muted mb-1">{t.patients.curpHint}</p>
                  <input
                    type="text"
                    value={formData.curp}
                    onChange={(e) => {
                      const canEditCurp = !editingPatient || !editingPatient.curp?.trim();
                      if (canEditCurp) setFormData({ ...formData, curp: e.target.value.toUpperCase() });
                    }}
                    disabled={!!editingPatient && !!editingPatient.curp?.trim()}
                    maxLength={18}
                    placeholder="XXXX000000HXXXXXX00"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      editingPatient && editingPatient.curp?.trim()
                        ? "bg-gray-100 dark:bg-gray-900 border-brand-border text-brand-muted cursor-not-allowed"
                        : "border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink"
                    }`}
                    title={
                      editingPatient && editingPatient.curp?.trim()
                        ? "La CURP no puede modificarse una vez registrada"
                        : undefined
                    }
                  />
                </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">
                    {t.patients.phone} *
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d+\-\s()]/g, "");
                      setFormData({ ...formData, phone: v });
                    }}
                    placeholder={phonePlaceholderForCountry(tenantCountry)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      formErrors.phone
                        ? "border-semantic-error focus:border-semantic-error focus:ring-1 focus:ring-semantic-error"
                        : "border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    }`}
                  />
                  {formErrors.phone && (
                    <p className={`mt-1 text-xs ${formErrorClass}`}>{formErrors.phone}</p>
                  )}
                </div>
                {showPatientEmail && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brand-ink mb-1">
                    {t.patients.email}
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\w@.\-+]/g, "");
                      setFormData({ ...formData, email: v });
                    }}
                    placeholder="paciente@ejemplo.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      formErrors.email
                        ? "border-semantic-error focus:border-semantic-error focus:ring-1 focus:ring-semantic-error"
                        : "border-brand-border bg-brand-surface text-brand-ink focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    }`}
                  />
                  {formErrors.email && (
                    <p className={`mt-1 text-xs ${formErrorClass}`}>{formErrors.email}</p>
                  )}
                </div>
                )}
                {showPatientAddress && (
                <>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brand-ink mb-1">
                    {t.patients.address}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">
                    {t.patients.city}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1">
                    {t.patients.postalCode}
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
                </>
                )}
              </div>

              {showPatientMedicalHistory && (
              <PatientPersonalAntecedentsFields
                allergies={formData.allergies}
                medications={formData.medications}
                conditions={formData.conditions}
                onChange={(patch) => setFormData({ ...formData, ...patch })}
                labels={{
                  title: t.patients.medicalHistory,
                  allergies: `${t.patients.allergies} (separadas por coma)`,
                  medications: `${t.patients.medications} (separados por coma)`,
                  conditions: `${t.patients.conditions} (separadas por coma)`,
                  allergiesPlaceholder: "Penicilina, Látex...",
                  medicationsPlaceholder: "Ibuprofeno, Omeprazol...",
                  conditionsPlaceholder: "Diabetes, Hipertensión...",
                }}
              />
              )}

              {showPatientFamilyHistory && (
              <PatientFamilyAntecedentsFields
                family={formData.family}
                onChange={(id: FamilyAntecedentId, patch) =>
                  setFormData({
                    ...formData,
                    family: {
                      ...formData.family,
                      [id]: { ...formData.family[id], ...patch },
                    },
                  })
                }
              />
              )}

              {/* Consent - Términos y condiciones */}
              <div className="space-y-3">
                {(() => {
                  const patientForConsent = editingPatient ?? selectedPatient;
                  const hadOldConsent = (patientForConsent?.consent?.consentedToVersion ?? null) != null && (patientForConsent.consent.consentedToVersion ?? 0) !== consentTextVersion;
                  const dataCleared = !patientForConsent?.idNumber?.trim();
                  const needsReconsent = !!editingPatient && (dataCleared || hadOldConsent);
                  const consentLocked = !!editingPatient && !needsReconsent;
                  return (
                  <>
                    {consentText ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 max-h-40 overflow-y-auto">
                        <p className="text-sm text-brand-ink whitespace-pre-wrap">{consentText}</p>
                      </div>
                    ) : (
                      <div className={semanticAlertWarningClass}>
                        <p className="text-sm">
                          No hay términos configurados. Configúralos en <strong>Configuración</strong> para que el paciente pueda aceptarlos.
                        </p>
                      </div>
                    )}
                    <div
                      role="button"
                      tabIndex={consentLocked ? -1 : 0}
                      onKeyDown={(e) => {
                        if (!consentLocked && (e.key === " " || e.key === "Enter")) {
                          e.preventDefault();
                          setFormData((prev) => ({ ...prev, consentGiven: !prev.consentGiven }));
                        }
                      }}
                      onClick={() => !consentLocked && setFormData((prev) => ({ ...prev, consentGiven: !prev.consentGiven }))}
                      className={`flex items-center gap-3 select-none ${
                        consentLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-80"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          formData.consentGiven
                            ? "bg-brand-ink border-brand-ink"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {formData.consentGiven && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-medium text-brand-ink`}>
                        {t.patients.consentGiven}
                        {consentLocked && " 🔒"}
                        {needsReconsent && " (modificado – acepte de nuevo)"}
                      </span>
                    </div>
                    {needsReconsent && (
                      <p className={`text-xs ${semanticAlertWarningClass} flex items-start gap-2 !py-2`}>
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        El consentimiento informado fue modificado. Es necesario que el paciente (o tutor) vuelva a aceptarlo. Marque la casilla para registrar la nueva aceptación.
                      </p>
                    )}
                  </>
                );
                })()}
              </div>

              {graceError && (
                <div className={`${semanticAlertErrorClass} flex gap-3`}>
                  <svg
                    className="w-5 h-5 text-semantic-error flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0020.9 16.32L13.93 4.64a2 2 0 00-3.46 0L3.1 16.32A2 2 0 005.07 19z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold">
                      No puedes crear nuevos pacientes en este momento
                    </p>
                    <p className="mt-1 text-sm">
                      {graceError}
                    </p>
                  </div>
                </div>
              )}

            </form>
            </AppModalBody>

            <AppModalFooter>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={closePatientForm}
                  className="flex-1 py-3 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  form="patient-form"
                  className="flex-1 py-3 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium"
                >
                  {t.common.save}
                </button>
              </div>
            </AppModalFooter>
        </AppModal>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t.patients.searchPatients}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          {canCreatePatient ? (
            <button
              onClick={() => {
                setEditingPatient(null);
                setFormData(emptyForm);
                setShowForm(true);
              }}
              className="px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t.patients.addPatient}
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="px-4 py-2.5 bg-gray-200 text-gray-400 rounded-lg cursor-not-allowed font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t.patients.addPatient}
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Solo los podólogos pueden crear pacientes
              </div>
            </div>
          )}
        </div>

        {/* Patient List */}
        {clinicalListError && (
          <ClinicalListError message={clinicalListError} onRetry={() => void reloadClinicalLists()} />
        )}
        {clinicalListLoading && patients.length === 0 ? (
          <ClinicalListLoading label="Cargando pacientes…" />
        ) : patients.length === 0 ? (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-12 text-center">
            <div className="w-16 h-16 bg-brand-canvas rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.patients.noPatients}</h3>
            <p className="text-brand-muted mb-6">
              {canCreatePatient 
                ? "Añade tu primer paciente para comenzar" 
                : "Solo los podólogos pueden crear pacientes"}
            </p>
            {canCreatePatient && (
              <button
                onClick={() => {
                  setEditingPatient(null);
                  setFormData(emptyForm);
                  setShowForm(true);
                }}
                className="px-6 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium"
              >
                {t.patients.addPatient}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: Card Layout */}
            <div className="md:hidden space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="mobile-card">
                  <div className="mobile-card-header">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="flex items-center gap-3 min-h-[44px]"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-medium text-brand-ink">
                          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-brand-ink">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{patient.email || "Sin email"}</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t.patients.phone}</span>
                      <span className="mobile-card-value">{formatPhoneDisplay(patient.phone, tenantCountry) || "—"}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t.patients.totalSessions}</span>
                      <span className="mobile-card-value">{sessionCountByPatient[patient.id] ?? 0}</span>
                    </div>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-medium min-h-[44px]"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleEdit(patient)}
                      className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-medium min-h-[44px]"
                    >
                      {t.common.edit}
                    </button>
                    {!isReceptionist && (
                      <button
                        onClick={() => openDeleteConfirm(patient)}
                        className="py-2.5 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors min-h-[44px]"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden md:block bg-brand-surface rounded-xl border border-brand-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 dark:border-gray-800">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-ink">Paciente</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-ink">{t.patients.email}</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-ink">{t.patients.phone}</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-brand-ink">{t.patients.totalSessions}</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-brand-ink">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr key={patient.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="flex items-center gap-3 hover:text-brand-ink dark:hover:text-white"
                          >
                            <div className="w-10 h-10 bg-brand-canvas rounded-full flex items-center justify-center">
                              <span className="font-medium text-brand-ink">
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-brand-ink">
                                {patient.firstName} {patient.lastName}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-brand-muted">{patient.email}</td>
                        <td className="px-6 py-4 text-sm text-brand-muted">{formatPhoneDisplay(patient.phone, tenantCountry)}</td>
                        <td className="px-6 py-4 text-sm text-brand-muted">
                          {sessionCountByPatient[patient.id] ?? 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(patient)}
                              className="p-2 hover:bg-brand-canvas rounded-lg transition-colors"
                              title={t.common.edit}
                            >
                              <svg className="w-4 h-4 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {!isReceptionist && (
                              <button
                                onClick={() => openDeleteConfirm(patient)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                title={t.common.delete}
                              >
                                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {hasMore && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => loadMore()}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 border border-brand-border rounded-lg text-sm font-medium text-brand-ink hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {isLoadingMore ? "Cargando…" : "Cargar más pacientes"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default PatientsPage;
