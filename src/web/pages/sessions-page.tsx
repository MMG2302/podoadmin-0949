import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import {
  getSessions,
  getPatients,
  getPatientById,
  saveSession,
  updateSession,
  deleteSession,
  getUserCredits,
  reserveCredit,
  consumeCredit,
  releaseCredit,
  exportPatientData,
  addAuditLog,
  ClinicalSession,
  Patient,
} from "../lib/storage";

interface SessionFormData {
  patientId: string;
  sessionDate: string;
  clinicalNotes: string;
  anamnesis: string;
  physicalExamination: string;
  diagnosis: string;
  treatmentPlan: string;
  images: string[];
}

const emptyForm: SessionFormData = {
  patientId: "",
  sessionDate: new Date().toISOString().split("T")[0],
  clinicalNotes: "",
  anamnesis: "",
  physicalExamination: "",
  diagnosis: "",
  treatmentPlan: "",
  images: [],
};

const SessionsPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [location] = useLocation();
  
  const credits = getUserCredits(user?.id || "");
  const params = new URLSearchParams(location.split("?")[1] || "");
  const filterPatientId = params.get("patient");
  
  const [sessions, setSessions] = useState<ClinicalSession[]>(() => getSessions());
  const [patients] = useState<Patient[]>(() => getPatients());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "completed">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ClinicalSession | null>(null);
  const [formData, setFormData] = useState<SessionFormData>(
    filterPatientId ? { ...emptyForm, patientId: filterPatientId } : emptyForm
  );
  const [selectedSession, setSelectedSession] = useState<ClinicalSession | null>(null);

  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    if (filterPatientId) {
      filtered = filtered.filter((s) => s.patientId === filterPatientId);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => {
        const patient = getPatientById(s.patientId);
        return (
          patient?.firstName.toLowerCase().includes(query) ||
          patient?.lastName.toLowerCase().includes(query) ||
          s.diagnosis.toLowerCase().includes(query)
        );
      });
    }
    
    return filtered.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [sessions, searchQuery, statusFilter, filterPatientId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || formData.images.length >= 2) return;
    
    Array.from(files).slice(0, 2 - formData.images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Mock conversion to webp (in real app, would actually convert)
        const base64 = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, base64],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent, asDraft: boolean) => {
    e.preventDefault();
    
    if (!formData.patientId) return;

    const sessionData = {
      patientId: formData.patientId,
      sessionDate: formData.sessionDate,
      status: asDraft ? "draft" : "completed" as const,
      clinicalNotes: formData.clinicalNotes,
      anamnesis: formData.anamnesis,
      physicalExamination: formData.physicalExamination,
      diagnosis: formData.diagnosis,
      treatmentPlan: formData.treatmentPlan,
      images: formData.images,
      completedAt: asDraft ? null : new Date().toISOString(),
      createdBy: user?.id || "",
      creditReservedAt: null,
    };

    if (editingSession) {
      // Release credit if was draft and stays draft
      if (editingSession.creditReservedAt && !asDraft) {
        consumeCredit(user?.id || "", editingSession.id);
      } else if (editingSession.creditReservedAt && asDraft) {
        // Keep reservation
      }
      
      updateSession(editingSession.id, {
        ...sessionData,
        completedAt: asDraft ? null : new Date().toISOString(),
      });
      
      addAuditLog({
        userId: user?.id || "",
        userName: user?.name || "",
        action: asDraft ? "UPDATE_DRAFT" : "COMPLETE",
        entityType: "SESSION",
        entityId: editingSession.id,
        details: `Sesión ${asDraft ? "actualizada" : "completada"}`,
      });
    } else {
      // Reserve credit for new session
      if (asDraft) {
        const reserved = reserveCredit(user?.id || "", "pending");
        if (!reserved) {
          alert(t.credits.insufficientCredits);
          return;
        }
      }
      
      const newSession = saveSession({
        ...sessionData,
        creditReservedAt: asDraft ? new Date().toISOString() : null,
      });
      
      if (!asDraft) {
        consumeCredit(user?.id || "", newSession.id);
      }
      
      addAuditLog({
        userId: user?.id || "",
        userName: user?.name || "",
        action: "CREATE",
        entityType: "SESSION",
        entityId: newSession.id,
        details: `Nueva sesión para paciente`,
      });
    }

    setSessions(getSessions());
    setShowForm(false);
    setEditingSession(null);
    setFormData(emptyForm);
  };

  const handleEdit = (session: ClinicalSession) => {
    if (session.status === "completed") return;
    
    setEditingSession(session);
    setFormData({
      patientId: session.patientId,
      sessionDate: session.sessionDate,
      clinicalNotes: session.clinicalNotes,
      anamnesis: session.anamnesis,
      physicalExamination: session.physicalExamination,
      diagnosis: session.diagnosis,
      treatmentPlan: session.treatmentPlan,
      images: session.images,
    });
    setShowForm(true);
  };

  const handleDelete = (session: ClinicalSession) => {
    if (session.status === "completed") return;
    
    if (confirm("¿Eliminar esta sesión?")) {
      if (session.creditReservedAt) {
        releaseCredit(user?.id || "", session.id);
      }
      deleteSession(session.id);
      setSessions(getSessions());
      
      addAuditLog({
        userId: user?.id || "",
        userName: user?.name || "",
        action: "DELETE",
        entityType: "SESSION",
        entityId: session.id,
        details: "Sesión eliminada",
      });
    }
  };

  const handleExport = (session: ClinicalSession) => {
    const data = exportPatientData(session.patientId);
    if (!data) return;
    
    // Consume credit if not already done
    consumeCredit(user?.id || "", session.id);
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historia_clinica_${session.patientId}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addAuditLog({
      userId: user?.id || "",
      userName: user?.name || "",
      action: "EXPORT",
      entityType: "SESSION",
      entityId: session.id,
      details: "Historia clínica exportada",
    });
  };

  const handlePrint = (session: ClinicalSession) => {
    const patient = getPatientById(session.patientId);
    if (!patient) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Historia Clínica - ${patient.firstName} ${patient.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 20px; }
          .section { margin-bottom: 16px; }
          .label { font-weight: bold; color: #666; }
          .value { margin-top: 4px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .images { display: flex; gap: 16px; margin-top: 12px; }
          .images img { max-width: 300px; max-height: 200px; border: 1px solid #ddd; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PodoAdmin - Historia Clínica</h1>
          <p>Fecha: ${new Date(session.sessionDate).toLocaleDateString("es-ES")}</p>
        </div>
        
        <h2>Datos del Paciente</h2>
        <div class="section">
          <p><span class="label">Nombre:</span> ${patient.firstName} ${patient.lastName}</p>
          <p><span class="label">DNI/NIE:</span> ${patient.idNumber}</p>
          <p><span class="label">Fecha de nacimiento:</span> ${new Date(patient.dateOfBirth).toLocaleDateString("es-ES")}</p>
          <p><span class="label">Teléfono:</span> ${patient.phone}</p>
        </div>
        
        <h2>Anamnesis</h2>
        <div class="section value">${session.anamnesis || "N/A"}</div>
        
        <h2>Exploración Física</h2>
        <div class="section value">${session.physicalExamination || "N/A"}</div>
        
        <h2>Diagnóstico Podológico</h2>
        <div class="section value">${session.diagnosis || "N/A"}</div>
        
        <h2>Plan de Tratamiento</h2>
        <div class="section value">${session.treatmentPlan || "N/A"}</div>
        
        <h2>Notas Clínicas</h2>
        <div class="section value">${session.clinicalNotes || "N/A"}</div>
        
        ${session.images.length > 0 ? `
          <h2>Imágenes</h2>
          <div class="images">
            ${session.images.map((img) => `<img src="${img}" alt="Imagen clínica" />`).join("")}
          </div>
        ` : ""}
        
        <div class="footer">
          <p>Documento generado por PodoAdmin</p>
          <p>Profesional: ${user?.name} | Fecha de impresión: ${new Date().toLocaleString("es-ES")}</p>
          <p>ID Sesión: ${session.id}</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
    
    addAuditLog({
      userId: user?.id || "",
      userName: user?.name || "",
      action: "PRINT",
      entityType: "SESSION",
      entityId: session.id,
      details: "Historia clínica impresa",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPatientName = (patientId: string) => {
    const patient = getPatientById(patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Paciente desconocido";
  };

  return (
    <MainLayout title={t.sessions.title} credits={credits}>
      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[#1a1a1a]">{t.sessions.sessionDetails}</h3>
                <p className="text-sm text-gray-500">{getPatientName(selectedSession.patientId)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedSession.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {selectedSession.status === "completed" ? t.sessions.completed : t.sessions.draft}
                </span>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t.sessions.sessionDate}</p>
                <p className="font-medium">{formatDate(selectedSession.sessionDate)}</p>
              </div>
              
              {selectedSession.anamnesis && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">{t.sessions.anamnesis}</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.anamnesis}</p>
                </div>
              )}
              
              {selectedSession.physicalExamination && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">{t.sessions.physicalExamination}</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.physicalExamination}</p>
                </div>
              )}
              
              {selectedSession.diagnosis && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">{t.sessions.diagnosis}</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.diagnosis}</p>
                </div>
              )}
              
              {selectedSession.treatmentPlan && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">{t.sessions.treatmentPlan}</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.treatmentPlan}</p>
                </div>
              )}
              
              {selectedSession.clinicalNotes && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">{t.sessions.clinicalNotes}</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.clinicalNotes}</p>
                </div>
              )}
              
              {selectedSession.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">{t.sessions.images}</h4>
                  <div className="flex gap-4">
                    {selectedSession.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Imagen ${idx + 1}`}
                        className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {selectedSession.status === "draft" && (
                  <button
                    onClick={() => {
                      setSelectedSession(null);
                      handleEdit(selectedSession);
                    }}
                    className="flex-1 py-2 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    {t.common.edit}
                  </button>
                )}
                <button
                  onClick={() => handleExport(selectedSession)}
                  className="flex-1 py-2 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  {t.common.export} JSON
                </button>
                <button
                  onClick={() => handlePrint(selectedSession)}
                  className="flex-1 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium text-sm"
                >
                  {t.common.print}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#1a1a1a]">
                {editingSession ? t.sessions.editSession : t.sessions.newSession}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingSession(null);
                  setFormData(emptyForm);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.sessions.selectPatient} *
                  </label>
                  <select
                    required
                    value={formData.patientId}
                    onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    disabled={!!editingSession}
                  >
                    <option value="">Seleccionar...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    {t.sessions.sessionDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.sessionDate}
                    onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {t.sessions.anamnesis}
                </label>
                <textarea
                  rows={3}
                  value={formData.anamnesis}
                  onChange={(e) => setFormData({ ...formData, anamnesis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Motivo de consulta, antecedentes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {t.sessions.physicalExamination}
                </label>
                <textarea
                  rows={3}
                  value={formData.physicalExamination}
                  onChange={(e) => setFormData({ ...formData, physicalExamination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Hallazgos de la exploración..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {t.sessions.diagnosis}
                </label>
                <textarea
                  rows={2}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Diagnóstico podológico..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {t.sessions.treatmentPlan}
                </label>
                <textarea
                  rows={3}
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Plan de tratamiento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {t.sessions.clinicalNotes}
                </label>
                <textarea
                  rows={2}
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  {t.sessions.images} ({formData.images.length}/2)
                </label>
                
                <div className="flex flex-wrap gap-4 mb-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`Imagen ${idx + 1}`}
                        className="w-32 h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                {formData.images.length < 2 && (
                  <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{t.sessions.uploadImages}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-xs text-gray-500 mt-2">{t.sessions.maxImages}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSession(null);
                    setFormData(emptyForm);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="flex-1 py-3 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t.sessions.saveDraft}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  className="flex-1 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium"
                >
                  {t.sessions.complete}
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
          <div className="flex items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
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
                placeholder={t.common.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "draft" | "completed")}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
            >
              <option value="all">Todas</option>
              <option value="draft">{t.sessions.draft}</option>
              <option value="completed">{t.sessions.completed}</option>
            </select>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t.sessions.newSession}
          </button>
        </div>

        {/* Session List */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">{t.sessions.noSessions}</h3>
            <p className="text-gray-500 mb-6">Crea tu primera sesión clínica</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium"
            >
              {t.sessions.newSession}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1" onClick={() => setSelectedSession(session)}>
                    <div className="flex items-center gap-3 mb-2 cursor-pointer">
                      <h4 className="font-medium text-[#1a1a1a]">
                        {getPatientName(session.patientId)}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        session.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {session.status === "completed" ? t.sessions.completed : t.sessions.draft}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{formatDate(session.sessionDate)}</p>
                    {session.diagnosis && (
                      <p className="text-sm text-gray-600 line-clamp-2">{session.diagnosis}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {session.status === "draft" && (
                      <>
                        <button
                          onClick={() => handleEdit(session)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={t.common.edit}
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(session)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title={t.common.delete}
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleExport(session)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={t.common.export}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePrint(session)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={t.common.print}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SessionsPage;
