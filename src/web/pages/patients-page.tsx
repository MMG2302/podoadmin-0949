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
        p.idNumber.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query)
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
      const updated = updatePatient(editingPatient.id, patientData);
      if (updated) {
        setPatients(getPatients());
        addAuditLog({
          userId: user?.id || "",
          userName: user?.name || "",
          action: "UPDATE",
          entityType: "PATIENT",
          entityId: updated.id,
          details: `Paciente actualizado: ${updated.firstName} ${updated.lastName}`,
        });
      }
    } else {
      const newPatient = savePatient(patientData);
      setPatients(getPatients());
      addAuditLog({
        userId: user?.id || "",
        userName: user?.name || "",
        action: "CREATE",
        entityType: "PATIENT",
        entityId: newPatient.id,
        details: `Nuevo paciente: ${newPatient.firstName} ${newPatient.lastName}`,
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
        entityType: "PATIENT",
        entityId: patient.id,
        details: `Paciente eliminado: ${patient.firstName} ${patient.lastName}`,
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES");
  };

  return (
    <MainLayout title={t.patients.title} credits={credits}>
      {/* Patient Detail View */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#1a1a1a]">{t.patients.patientDetails}</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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

      {/* Patient Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#1a1a1a]">
                {editingPatient ? t.patients.editPatient : t.patients.addPatient}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPatient(null);
                  setFormData(emptyForm);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.firstName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.lastName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.dateOfBirth} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.gender} *
                  </label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as "male" | "female" | "other" })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  >
                    <option value="male">{t.patients.male}</option>
                    <option value="female">{t.patients.female}</option>
                    <option value="other">{t.patients.other}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.patients.idNumber} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
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
                <div className="col-span-2">
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
                <div className="col-span-2">
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
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentGiven}
                    onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                  />
                  <span className="text-sm font-medium text-[#1a1a1a]">{t.patients.consentGiven}</span>
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
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">Paciente</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-[#1a1a1a]">{t.patients.idNumber}</th>
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
                            <p className="text-sm text-gray-500">{patient.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{patient.idNumber}</td>
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
        )}
      </div>
    </MainLayout>
  );
};

export default PatientsPage;
