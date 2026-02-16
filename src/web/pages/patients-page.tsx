import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { useRefreshOnFocus } from "../hooks/use-refresh-on-focus";
import {
  getSessionsByPatient,
  Patient,
  addAuditLog,
} from "../lib/storage";
import { api } from "../lib/api-client";

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  allergies: string;
  medications: string;
  conditions: string;
  consentGiven: boolean;
}

const emptyForm: PatientFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "other",
  idNumber: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  allergies: "",
  medications: "",
  conditions: "",
  consentGiven: false,
};

const PatientsPage = () => {
  const { t } = useLanguage();
  const { user, getAllUsers } = useAuth();
  const { isSuperAdmin, isPodiatrist, isClinicAdmin, isReceptionist } = usePermissions();
  const [location, setLocation] = useLocation();
  
  // Clinic admins should use the Clinic Management page for patient viewing/reassignment
  // Redirect them if they try to access /patients directly (recepcionistas no)
  if (isClinicAdmin) {
    setLocation("/clinic");
    return null;
  }
  
  // Podiatrists can siempre crear pacientes.
  // Recepcionistas solo pueden crear pacientes si tienen al menos un podólogo asignado.
  const receptionistHasAssignedPodiatrists =
    isReceptionist && !!user?.assignedPodiatristIds?.length;
  const canCreatePatient = isPodiatrist || receptionistHasAssignedPodiatrists;
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(emptyForm);
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

  // Cargar pacientes desde la API (backend aplica reglas de visibilidad por rol: podólogo, recepcionista, clinic_admin)
  const loadPatients = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; patients: Patient[] }>("/patients");
      if (response.success && response.data?.success) {
        setPatients(response.data.patients);
      } else {
        console.error("Error cargando pacientes:", response.error || response.data?.message);
      }
    } catch (error) {
      console.error("Error cargando pacientes:", error);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [user?.id, loadPatients]);

  useRefreshOnFocus(loadPatients);

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.phone.includes(query)
    );
  }, [patients, searchQuery]);

  // Abrir/cerrar automáticamente el modal de detalles según /patients?id=...
  useEffect(() => {
    if (patientIdFromUrl) {
      const patient = patients.find((p) => p.id === patientIdFromUrl);
      if (patient) {
        setSelectedPatient(patient);
      }
    } else {
      // Si ya no hay id en la URL, cerramos el modal
      setSelectedPatient(null);
    }
  }, [patientIdFromUrl, patients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdBy = isReceptionist && receptionistPodiatristId ? receptionistPodiatristId : (user?.id || "");
    if (isReceptionist && !receptionistPodiatristId && !editingPatient) {
      return; // receptionist must select podiatrist when creating
    }
    const patientData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      idNumber: formData.idNumber,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      medicalHistory: {
        allergies: formData.allergies.split(",").map((s) => s.trim()).filter(Boolean),
        medications: formData.medications.split(",").map((s) => s.trim()).filter(Boolean),
        conditions: formData.conditions.split(",").map((s) => s.trim()).filter(Boolean),
      },
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
          setPatients((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          addAuditLog({
            userId: user?.id || "",
            userName: user?.name || "",
            action: "UPDATE",
            entityType: "patient",
            entityId: updated.id,
            details: JSON.stringify({
              patientId: updated.id,
              patientName: `${updated.firstName} ${updated.lastName}`,
              folio: updated.folio,
            }),
          });
        } else {
          alert(response.error || response.data?.message || "No se pudo actualizar el paciente.");
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
          setPatients((prev) => [newPatient, ...prev]);
          addAuditLog({
            userId: user?.id || "",
            userName: user?.name || "",
            action: "CREATE",
            entityType: "patient",
            entityId: newPatient.id,
            details: JSON.stringify({
              patientId: newPatient.id,
              patientName: `${newPatient.firstName} ${newPatient.lastName}`,
              folio: newPatient.folio,
            }),
          });
        } else {
          alert(response.error || response.data?.message || "No se pudo crear el paciente.");
        }
      }
    } catch (error) {
      console.error("Error guardando paciente:", error);
      alert("Ha ocurrido un error al guardar el paciente.");
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
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      city: patient.city,
      postalCode: patient.postalCode,
      allergies: patient.medicalHistory.allergies.join(", "),
      medications: patient.medicalHistory.medications.join(", "),
      conditions: patient.medicalHistory.conditions.join(", "),
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
        setPatients((prev) => prev.filter((p) => p.id !== patient.id));
        closeDeleteConfirm();
        if (selectedPatient?.id === patient.id) setSelectedPatient(null);
        addAuditLog({
          userId: user?.id || "",
          userName: user?.name || "",
          action: "DELETE",
          entityType: "patient",
          entityId: patient.id,
          details: JSON.stringify({
            sessionId: null,
            patientId: patient.id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            folio: patient.folio,
            cascade,
          }),
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

  return (
    <MainLayout title={t.patients.title} >
      {/* Patient Detail View - Mobile Optimized */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 overflow-y-auto form-modal-scroll">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] sm:m-4 overflow-y-auto overscroll-contain form-modal-scroll">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-6 z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a]">{t.patients.patientDetails}</h3>
                <button
                  onClick={() => {
                    // Al cerrar manualmente el modal, limpiamos también el parámetro ?id de la URL
                    setLocation("/patients");
                    setSelectedPatient(null);
                  }}
                  className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Folio prominently displayed */}
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm text-gray-600 font-medium">FOLIO:</span>
                <span className="text-base font-bold text-[#1a1a1a] tracking-wide">{selectedPatient.folio || "—"}</span>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Demographics */}
              <div>
                <h4 className="font-medium text-[#1a1a1a] mb-3">Datos personales</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                    <span className="ml-2 font-medium">{selectedPatient.phone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">{t.patients.email}:</span>
                    <span className="ml-2 font-medium">{selectedPatient.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">{t.patients.address}:</span>
                    <span className="ml-2 font-medium">
                      {selectedPatient.address}, {selectedPatient.city} {selectedPatient.postalCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div>
                <h4 className="font-medium text-[#1a1a1a] mb-3">{t.patients.medicalHistory}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">{t.patients.allergies}:</span>
                    <span className="ml-2">
                      {selectedPatient.medicalHistory.allergies.length > 0
                        ? selectedPatient.medicalHistory.allergies.join(", ")
                        : "Ninguna"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t.patients.medications}:</span>
                    <span className="ml-2">
                      {selectedPatient.medicalHistory.medications.length > 0
                        ? selectedPatient.medicalHistory.medications.join(", ")
                        : "Ninguno"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t.patients.conditions}:</span>
                    <span className="ml-2">
                      {selectedPatient.medicalHistory.conditions.length > 0
                        ? selectedPatient.medicalHistory.conditions.join(", ")
                        : "Ninguna"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consent */}
              <div>
                <h4 className="font-medium text-[#1a1a1a] mb-3">{t.patients.consent}</h4>
                <div className="flex items-center gap-2 text-sm">
                  {selectedPatient.consent.given ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700">{t.patients.consentGiven}</span>
                      {selectedPatient.consent.date && (
                        <span className="text-gray-500">
                          ({formatDate(selectedPatient.consent.date)})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-red-700">Sin consentimiento</span>
                    </>
                  )}
                </div>
              </div>

              {/* Sessions Summary */}
              <div>
                <h4 className="font-medium text-[#1a1a1a] mb-3">{t.patients.clinicalHistory}</h4>
                <div className="text-sm">
                  <span className="text-gray-500">{t.patients.totalSessions}:</span>
                  <span className="ml-2 font-medium">
                    {getSessionsByPatient(selectedPatient.id).length}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setLocation("/patients");
                    setSelectedPatient(null);
                    handleEdit(selectedPatient);
                  }}
                  className="flex-1 min-w-[100px] py-2 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  {t.common.edit}
                </button>
                {!isReceptionist && (
                  <Link
                    href={`/sessions?patient=${selectedPatient.id}`}
                    className="flex-1 min-w-[100px] py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium text-sm text-center"
                  >
                    {t.patients.viewHistory}
                  </Link>
                )}
                {!isReceptionist && (
                  <button
                    onClick={() => {
                      setLocation("/patients");
                      openDeleteConfirm(selectedPatient);
                      setSelectedPatient(null);
                    }}
                    className="py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                  >
                    {t.common.delete}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirmPatient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
                  {deleteCascadeMode ? "Eliminar paciente y todo su historial" : "¿Eliminar paciente?"}
                </h3>
                {deleteCascadeMode ? (
                  <p className="text-gray-600 text-sm mb-4">
                    Este paciente tiene sesiones clínicas y/o citas asociadas. Si continúa, se eliminará el paciente, todas sus sesiones y citas. Esta acción no se puede deshacer.
                  </p>
                ) : (
                  <p className="text-gray-600 text-sm mb-4">
                    Se eliminará el paciente <strong>{deleteConfirmPatient.firstName} {deleteConfirmPatient.lastName}</strong> y no se podrá recuperar. Esta acción es permanente.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeDeleteConfirm}
                className="flex-1 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => executeDelete(deleteConfirmPatient, deleteCascadeMode)}
                disabled={deleteInProgress}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteInProgress ? "Eliminando…" : (deleteCascadeMode ? "Eliminar todo" : "Eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Form Modal - Mobile Optimized */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 overflow-y-auto form-modal-scroll">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] sm:m-4 overflow-y-auto overscroll-contain form-modal-scroll">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-6 flex items-center justify-between z-10">
              <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a]">
                {editingPatient ? t.patients.editPatient : t.patients.addPatient}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPatient(null);
                  setFormData(emptyForm);
                  setReceptionistPodiatristId("");
                }}
                className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6 pb-safe">
              {/* Immutable fields notice when editing */}
              {editingPatient && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Campos protegidos</p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        Los campos con 🔒 no pueden ser modificados después de la creación para garantizar la integridad de los datos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Podólogo asignado (solo recepcionista al crear) */}
              {isReceptionist && !editingPatient && assignedPodiatrists.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">Podólogo para el paciente *</label>
                  <select
                    value={receptionistPodiatristId}
                    onChange={(e) => setReceptionistPodiatristId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    required
                  >
                    <option value="">Seleccionar podólogo</option>
                    {assignedPodiatrists.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-0.5">El paciente quedará asignado a este podólogo.</p>
                </div>
              )}

              {/* Personal Info - Responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1 flex items-center gap-1">
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
                        ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed" 
                        : "border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1 flex items-center gap-1">
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
                        ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed" 
                        : "border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1 flex items-center gap-1">
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
                        ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed" 
                        : "border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1 flex items-center gap-1">
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
                        ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed" 
                        : "border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  >
                    <option value="male">{t.patients.male}</option>
                    <option value="female">{t.patients.female}</option>
                    <option value="other">{t.patients.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1 flex items-center gap-1">
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
                        ? "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                        : "border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    }`}
                    title={editingPatient && editingPatient.idNumber?.trim() ? "Este campo no puede ser modificado" : "Obligatorio. Para menores de edad, indicar el DNI del padre o tutor legal."}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Obligatorio para crear sesiones. Si el paciente es menor de edad, indicar el DNI del padre o tutor.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
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
                    placeholder="+34 612 345 678"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
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
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.address}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.city}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.postalCode}
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
              </div>

              {/* Medical History */}
              <div className="space-y-4">
                <h4 className="font-medium text-[#1a1a1a]">{t.patients.medicalHistory}</h4>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.allergies} (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="Penicilina, Látex..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.medications} (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    placeholder="Ibuprofeno, Omeprazol..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.conditions} (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    placeholder="Diabetes, Hipertensión..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
              </div>

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
                        <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{consentText}</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-sm text-amber-800">
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
                            ? "bg-[#1a1a1a] border-[#1a1a1a]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {formData.consentGiven && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[#1a1a1a]">
                        {t.patients.consentGiven}
                        {consentLocked && " 🔒"}
                        {needsReconsent && " (modificado – acepte de nuevo)"}
                      </span>
                    </div>
                    {needsReconsent && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-start gap-2">
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

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPatient(null);
                    setFormData(emptyForm);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
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
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            />
          </div>
          {canCreatePatient ? (
            <button
              onClick={() => {
                setEditingPatient(null);
                setFormData(emptyForm);
                setShowForm(true);
              }}
              className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium flex items-center gap-2"
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
        {filteredPatients.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">{t.patients.noPatients}</h3>
            <p className="text-gray-500 mb-6">
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
                className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium"
              >
                {t.patients.addPatient}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile: Card Layout */}
            <div className="md:hidden space-y-3">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="mobile-card">
                  <div className="mobile-card-header">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="flex items-center gap-3 min-h-[44px]"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-medium text-[#1a1a1a]">
                          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-[#1a1a1a]">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{patient.email || "Sin email"}</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t.patients.phone}</span>
                      <span className="mobile-card-value">{patient.phone || "—"}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t.patients.totalSessions}</span>
                      <span className="mobile-card-value">{getSessionsByPatient(patient.id).length}</span>
                    </div>
                  </div>
                  
                  <div className="mobile-card-actions">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="flex-1 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-medium min-h-[44px]"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleEdit(patient)}
                      className="flex-1 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors text-sm font-medium min-h-[44px]"
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
            <div className="hidden md:block bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">Paciente</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">{t.patients.email}</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">{t.patients.phone}</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">{t.patients.totalSessions}</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[#1a1a1a]">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="flex items-center gap-3 hover:text-[#1a1a1a]"
                          >
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="font-medium text-[#1a1a1a]">
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-[#1a1a1a]">
                                {patient.firstName} {patient.lastName}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patient.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{patient.phone}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {getSessionsByPatient(patient.id).length}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(patient)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={t.common.edit}
                            >
                              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {!isReceptionist && (
                              <button
                                onClick={() => openDeleteConfirm(patient)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
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
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default PatientsPage;
