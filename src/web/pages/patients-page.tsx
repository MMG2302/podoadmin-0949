import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import {
  getPatients,
  savePatient,
  updatePatient,
  deletePatient,
  getSessionsByPatient,
  getUserCredits,
  Patient,
  addAuditLog,
  getClinicById,
} from "../lib/storage";

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
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [, setLocation] = useLocation();
  
  const credits = getUserCredits(user?.id || "");
  
  const [patients, setPatients] = useState<Patient[]>(() => getPatients());
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
      },
      createdBy: user?.id || "",
    };

    if (editingPatient) {
      // Only update mutable fields - protect immutable fields from being changed
      const mutableUpdates = {
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
        // Note: firstName, lastName, dateOfBirth, idNumber, gender, consent are immutable
      };
      
      const updated = updatePatient(editingPatient.id, mutableUpdates);
      if (updated) {
        setPatients(getPatients());
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
      }
    } else {
      // Get clinic code for folio generation
      const clinic = user?.clinicId ? getClinicById(user.clinicId) : null;
      const clinicCode = clinic?.clinicCode || null;
      
      const newPatient = savePatient(patientData, clinicCode);
      setPatients(getPatients());
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
    }

    setShowForm(false);
    setEditingPatient(null);
    setFormData(emptyForm);
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

  const handleDelete = (patient: Patient) => {
    if (confirm(`¿Eliminar paciente ${patient.firstName} ${patient.lastName}?`)) {
      deletePatient(patient.id);
      setPatients(getPatients());
      addAuditLog({
        userId: user?.id || "",
        userName: user?.name || "",
        action: "DELETE",
        entityType: "patient",
        entityId: patient.id,
        details: JSON.stringify({
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          folio: patient.folio,
        }),
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES");
  };

  return (
    <MainLayout title={t.patients.title} credits={credits}>
      {/* Patient Detail View - Mobile Optimized */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] sm:m-4 overflow-y-auto overscroll-contain">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-6 z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a]">{t.patients.patientDetails}</h3>
                <button
                  onClick={() => setSelectedPatient(null)}
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
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedPatient(null);
                    handleEdit(selectedPatient);
                  }}
                  className="flex-1 py-2 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  {t.common.edit}
                </button>
                <Link
                  href={`/sessions?patient=${selectedPatient.id}`}
                  className="flex-1 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium text-sm text-center"
                >
                  {t.patients.viewHistory}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Form Modal - Mobile Optimized */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] sm:m-4 overflow-y-auto overscroll-contain">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-6 flex items-center justify-between z-10">
              <h3 className="text-lg sm:text-xl font-semibold text-[#1a1a1a]">
                {editingPatient ? t.patients.editPatient : t.patients.addPatient}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPatient(null);
                  setFormData(emptyForm);
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
                    {editingPatient && <span title="Este campo no puede ser modificado">🔒</span>}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.idNumber}
                    onChange={(e) => !editingPatient && setFormData({ ...formData, idNumber: e.target.value })}
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
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.email}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

              {/* Consent */}
              <div>
                <label className={`flex items-center gap-3 ${editingPatient ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={(e) => !editingPatient && setFormData({ ...formData, consentGiven: e.target.checked })}
                    disabled={!!editingPatient}
                    className={`w-5 h-5 rounded border-gray-300 focus:ring-[#1a1a1a] ${
                      editingPatient ? "text-gray-400 cursor-not-allowed" : "text-[#1a1a1a]"
                    }`}
                    title={editingPatient ? "Este campo no puede ser modificado después de la creación del paciente" : ""}
                  />
                  <span className="text-sm font-medium text-[#1a1a1a] flex items-center gap-1">
                    {t.patients.consentGiven}
                    {editingPatient && <span title="Este campo no puede ser modificado">🔒</span>}
                  </span>
                </label>
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
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t.patients.addPatient}
          </button>
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
            <p className="text-gray-500 mb-6">Añade tu primer paciente para comenzar</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium"
            >
              {t.patients.addPatient}
            </button>
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
                    <button
                      onClick={() => handleDelete(patient)}
                      className="py-2.5 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors min-h-[44px]"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
                            <button
                              onClick={() => handleDelete(patient)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title={t.common.delete}
                            >
                              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
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
