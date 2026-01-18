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
  getClinicLogo,
  getProfessionalLogo,
  getClinicById,
  getProfessionalLicense,
  getProfessionalInfo,
  getPrescriptionsBySession,
  savePrescription,
  deletePrescription,
  ClinicalSession,
  Patient,
  AppointmentReason,
  Prescription,
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
  nextAppointmentDate: string;
  followUpNotes: string;
  appointmentReason: AppointmentReason | "";
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
  nextAppointmentDate: "",
  followUpNotes: "",
  appointmentReason: "",
};

const appointmentReasons: { value: AppointmentReason; label: string }[] = [
  { value: "routine_checkup", label: "Revisión rutinaria" },
  { value: "treatment_continuation", label: "Continuación de tratamiento" },
  { value: "post_procedure_review", label: "Revisión post-procedimiento" },
  { value: "new_symptoms", label: "Nuevos síntomas" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "other", label: "Otro" },
];

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
  
  // Prescription state
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    prescriptionText: "",
    medications: "",
    nextVisitDate: "",
    notes: "",
  });
  const [sessionPrescriptions, setSessionPrescriptions] = useState<Prescription[]>([]);

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
      nextAppointmentDate: formData.nextAppointmentDate || null,
      followUpNotes: formData.followUpNotes || null,
      appointmentReason: formData.appointmentReason || null,
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
      nextAppointmentDate: session.nextAppointmentDate || "",
      followUpNotes: session.followUpNotes || "",
      appointmentReason: session.appointmentReason || "",
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
    
    // Get clinic logo and full info based on user's clinic membership
    let clinicLogo: string | undefined = undefined;
    const clinic = user?.clinicId ? getClinicById(user.clinicId) : null;
    if (user?.clinicId) {
      // Get logo from separate storage key (not clinic.logo)
      clinicLogo = getClinicLogo(user.clinicId);
    } else if (user?.id) {
      // For independent doctors, get their professional logo
      clinicLogo = getProfessionalLogo(user.id);
    }
    
    // Get professional license
    let podiatristLicense: string | null = null;
    if (user?.id) {
      podiatristLicense = getProfessionalLicense(user.id);
      // For independent podiatrists, also check professionalInfo
      if (!podiatristLicense && !user?.clinicId) {
        const profInfo = getProfessionalInfo(user.id);
        podiatristLicense = profInfo?.professionalLicense || null;
      }
    }
    
    // Build clinic contact info for header
    const clinicName = clinic?.clinicName || "";
    const clinicPhone = clinic?.phone || "";
    const clinicEmail = clinic?.email || "";
    const clinicAddress = clinic?.address 
      ? `${clinic.address}${clinic.city ? `, ${clinic.city}` : ""}${clinic.postalCode ? ` ${clinic.postalCode}` : ""}`
      : "";
    const hasClinicInfo = !!(clinicName || clinicPhone || clinicEmail || clinicAddress);
    const clinicLicenseNumber = clinic?.licenseNumber || "";
    
    // For independent doctors, get their professional info
    const isIndependent = !clinic;
    const profInfo = isIndependent && user?.id ? getProfessionalInfo(user.id) : null;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Historia Clínica - ${patient.firstName} ${patient.lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; color: #333; }
          .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 16px; }
          .header-content { display: flex; align-items: flex-start; gap: 20px; }
          .header-logo { max-height: 60px; max-width: 160px; object-fit: contain; }
          .header-text { flex: 1; }
          .clinic-contact { font-size: 12px; color: #666; margin-top: 4px; line-height: 1.4; }
          .folio-bar { background: #f5f5f5; padding: 10px 16px; margin: 12px 0; border-radius: 4px; text-align: center; }
          .folio-bar span.label { font-size: 12px; color: #666; margin-right: 8px; }
          .folio-bar span.value { font-size: 16px; font-weight: bold; color: #1a1a1a; letter-spacing: 1px; }
          .patient-header { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
          .patient-name { font-size: 18px; font-weight: 600; }
          .patient-folio { font-size: 12px; color: #666; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
          .section { margin-bottom: 14px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-top: 4px; }
          .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; }
          .patient-grid p { margin: 0; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
          .images { display: flex; gap: 16px; margin-top: 12px; }
          .images img { max-width: 280px; max-height: 180px; border: 1px solid #ddd; border-radius: 4px; }
          @media print { 
            body { padding: 20px; } 
            .folio-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            ${clinicLogo ? `<img src="${clinicLogo}" alt="Logo" class="header-logo" />` : ''}
            <div class="header-text">
              ${isIndependent 
                ? `<h1>${profInfo?.name || user?.name || "Profesional Independiente"}</h1>
                   ${podiatristLicense ? `<p style="margin: 0; color: #333; font-size: 13px; font-weight: 500;">Lic. ${podiatristLicense}</p>` : ''}
                   <p style="margin: 0; color: #666; font-size: 14px;">Historia Clínica Podológica</p>
                   ${profInfo ? `
                     <div class="clinic-contact">
                       ${profInfo.phone ? `<div>Tel: ${profInfo.phone}</div>` : ''}
                       ${profInfo.email ? `<div>Email: ${profInfo.email}</div>` : ''}
                       ${profInfo.address ? `<div>${profInfo.address}${profInfo.city ? `, ${profInfo.city}` : ""}${profInfo.postalCode ? ` ${profInfo.postalCode}` : ""}</div>` : ''}
                       ${profInfo.licenseNumber ? `<div>Reg. Sanitario: ${profInfo.licenseNumber}</div>` : ''}
                     </div>
                   ` : ''}`
                : `<h1>${clinicName}</h1>
                   ${clinicLicenseNumber ? `<p style="margin: 0; color: #555; font-size: 12px;">Reg. Sanitario: ${clinicLicenseNumber}</p>` : ''}
                   ${hasClinicInfo ? `
                     <div class="clinic-contact">
                       ${clinicPhone ? `<div>Tel: ${clinicPhone}</div>` : ''}
                       ${clinicEmail ? `<div>Email: ${clinicEmail}</div>` : ''}
                       ${clinicAddress ? `<div>${clinicAddress}</div>` : ''}
                     </div>
                   ` : ''}
                  `
              }
            </div>
          </div>
          <!-- Folio prominently displayed below header -->
          <div class="folio-bar">
            <span class="label">FOLIO:</span>
            <span class="value">${patient.folio || "—"}</span>
          </div>
        </div>
        
        <h2>Datos del Paciente</h2>
        <div class="section">
          <div class="patient-header">
            <span class="patient-name">${patient.firstName} ${patient.lastName}</span>
            <span class="patient-folio">Folio: ${patient.folio || "—"}</span>
          </div>
          <div class="patient-grid">
            <p><span class="label">DNI/NIE:</span> ${patient.idNumber}</p>
            <p><span class="label">Fecha de nacimiento:</span> ${new Date(patient.dateOfBirth).toLocaleDateString("es-ES")}</p>
            <p><span class="label">Teléfono:</span> ${patient.phone}</p>
            <p><span class="label">Email:</span> ${patient.email || "—"}</p>
          </div>
        </div>
        
        <p style="font-size: 13px; color: #666; margin-bottom: 16px;">
          <strong>Fecha de sesión:</strong> ${new Date(session.sessionDate).toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
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
          <h2>Imágenes Clínicas</h2>
          <div class="images">
            ${session.images.map((img) => `<img src="${img}" alt="Imagen clínica" />`).join("")}
          </div>
        ` : ""}
        
        <div class="footer">
          <p><strong>Documento generado por PodoAdmin</strong></p>
          <p>Profesional: ${user?.name}${podiatristLicense ? ` | Lic. ${podiatristLicense}` : ''} | Fecha de impresión: ${new Date().toLocaleString("es-ES")}</p>
          <p>ID Sesión: ${session.id} | Folio Paciente: ${patient.folio || "—"}</p>
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
  
  // Load prescriptions when session is selected
  const loadSessionPrescriptions = (session: ClinicalSession) => {
    const prescriptions = getPrescriptionsBySession(session.id);
    setSessionPrescriptions(prescriptions);
  };
  
  // Create prescription handler
  const handleCreatePrescription = () => {
    if (!selectedSession || !user) return;
    
    const patient = getPatientById(selectedSession.patientId);
    if (!patient) return;
    
    // Get professional license
    let license: string | null = null;
    if (user.id) {
      license = getProfessionalLicense(user.id);
      if (!license && !user.clinicId) {
        const profInfo = getProfessionalInfo(user.id);
        license = profInfo?.professionalLicense || null;
      }
    }
    
    const newPrescription = savePrescription({
      sessionId: selectedSession.id,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientDob: patient.dateOfBirth,
      patientDni: patient.idNumber,
      podiatristId: user.id,
      podiatristName: user.name,
      podiatristLicense: license,
      prescriptionDate: new Date().toISOString().split("T")[0],
      prescriptionText: prescriptionData.prescriptionText,
      medications: prescriptionData.medications,
      nextVisitDate: prescriptionData.nextVisitDate || null,
      notes: prescriptionData.notes,
      createdBy: user.id,
    });
    
    setSessionPrescriptions(prev => [...prev, newPrescription]);
    setPrescriptionData({ prescriptionText: "", medications: "", nextVisitDate: "", notes: "" });
    setShowPrescriptionForm(false);
    
    addAuditLog({
      userId: user.id,
      userName: user.name,
      action: "CREATE",
      entityType: "PRESCRIPTION",
      entityId: newPrescription.id,
      details: `Receta creada para paciente ${patient.firstName} ${patient.lastName}`,
    });
  };
  
  // Print prescription
  const handlePrintPrescription = (prescription: Prescription) => {
    // Get clinic/professional info
    let clinicLogo: string | undefined = undefined;
    const clinic = user?.clinicId ? getClinicById(user.clinicId) : null;
    if (user?.clinicId) {
      clinicLogo = getClinicLogo(user.clinicId);
    } else if (user?.id) {
      clinicLogo = getProfessionalLogo(user.id);
    }
    
    const isIndependent = !clinic;
    const profInfo = isIndependent && user?.id ? getProfessionalInfo(user.id) : null;
    
    const clinicName = clinic?.clinicName || profInfo?.name || user?.name || "";
    const clinicPhone = clinic?.phone || profInfo?.phone || "";
    const clinicEmail = clinic?.email || profInfo?.email || "";
    const clinicAddress = clinic?.address 
      ? `${clinic.address}${clinic.city ? `, ${clinic.city}` : ""}${clinic.postalCode ? ` ${clinic.postalCode}` : ""}`
      : profInfo?.address 
        ? `${profInfo.address}${profInfo.city ? `, ${profInfo.city}` : ""}${profInfo.postalCode ? ` ${profInfo.postalCode}` : ""}`
        : "";
    const clinicLicenseNumber = clinic?.licenseNumber || profInfo?.licenseNumber || "";
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receta - ${prescription.patientName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
          .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
          .header-content { display: flex; align-items: flex-start; gap: 20px; }
          .header-logo { max-height: 60px; max-width: 160px; object-fit: contain; }
          .header-text h1 { margin: 0 0 4px; font-size: 22px; }
          .clinic-contact { font-size: 12px; color: #666; margin-top: 4px; line-height: 1.4; }
          .license { font-size: 13px; color: #333; font-weight: 500; margin: 4px 0; }
          .folio-bar { background: #f5f5f5; padding: 10px 16px; margin: 12px 0 20px; border-radius: 4px; text-align: center; }
          .folio-bar span.label { font-size: 12px; color: #666; margin-right: 8px; }
          .folio-bar span.value { font-size: 16px; font-weight: bold; color: #1a1a1a; letter-spacing: 1px; }
          .patient-section { background: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
          .patient-section h3 { margin: 0 0 12px; font-size: 14px; color: #666; }
          .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; }
          .patient-grid p { margin: 0; }
          .label { font-weight: bold; color: #555; }
          .section { margin-bottom: 20px; }
          .section h2 { font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; color: #333; }
          .section-content { min-height: 80px; padding: 12px; background: #fafafa; border-radius: 6px; white-space: pre-wrap; }
          .signature-area { margin-top: 60px; text-align: center; }
          .signature-line { border-top: 1px solid #333; width: 300px; margin: 0 auto; padding-top: 8px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
          @media print { 
            body { padding: 20px; } 
            .folio-bar, .patient-section { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-content">
            ${clinicLogo ? `<img src="${clinicLogo}" alt="Logo" class="header-logo" />` : ''}
            <div class="header-text">
              <h1>${clinicName}</h1>
              ${prescription.podiatristLicense ? `<p class="license">Lic. ${prescription.podiatristLicense}</p>` : ''}
              ${clinicLicenseNumber ? `<p style="margin: 0; color: #555; font-size: 12px;">Reg. Sanitario: ${clinicLicenseNumber}</p>` : ''}
              <div class="clinic-contact">
                ${clinicPhone ? `<div>Tel: ${clinicPhone}</div>` : ''}
                ${clinicEmail ? `<div>Email: ${clinicEmail}</div>` : ''}
                ${clinicAddress ? `<div>${clinicAddress}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
        
        <div class="folio-bar">
          <span class="label">FOLIO RECETA:</span>
          <span class="value">${prescription.folio}</span>
        </div>
        
        <div class="patient-section">
          <h3>DATOS DEL PACIENTE</h3>
          <div class="patient-grid">
            <p><span class="label">Nombre:</span> ${prescription.patientName}</p>
            <p><span class="label">DNI/NIE:</span> ${prescription.patientDni}</p>
            <p><span class="label">Fecha de nacimiento:</span> ${new Date(prescription.patientDob).toLocaleDateString("es-ES")}</p>
            <p><span class="label">Fecha de la receta:</span> ${new Date(prescription.prescriptionDate).toLocaleDateString("es-ES")}</p>
          </div>
        </div>
        
        <div class="section">
          <h2>Prescripción / Indicaciones</h2>
          <div class="section-content">${prescription.prescriptionText || "—"}</div>
        </div>
        
        ${prescription.medications ? `
          <div class="section">
            <h2>Medicamentos / Tratamientos</h2>
            <div class="section-content">${prescription.medications}</div>
          </div>
        ` : ''}
        
        ${prescription.nextVisitDate ? `
          <div class="section">
            <h2>Próxima Visita</h2>
            <p style="font-size: 14px;">${new Date(prescription.nextVisitDate).toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        ` : ''}
        
        ${prescription.notes ? `
          <div class="section">
            <h2>Notas Adicionales</h2>
            <div class="section-content">${prescription.notes}</div>
          </div>
        ` : ''}
        
        <div class="signature-area">
          <div class="signature-line">
            <p style="margin: 0; font-size: 12px;">Firma del Profesional</p>
            <p style="margin: 4px 0 0; font-size: 14px; font-weight: 500;">${prescription.podiatristName}</p>
            ${prescription.podiatristLicense ? `<p style="margin: 0; font-size: 12px; color: #666;">Lic. ${prescription.podiatristLicense}</p>` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Receta generada por PodoAdmin</strong></p>
          <p>Fecha de impresión: ${new Date().toLocaleString("es-ES")}</p>
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
      entityType: "PRESCRIPTION",
      entityId: prescription.id,
      details: `Receta impresa - Folio: ${prescription.folio}`,
    });
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
              
              {/* Prescriptions Section */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-[#1a1a1a]">Recetas / Prescripciones</h4>
                  <button
                    onClick={() => setShowPrescriptionForm(true)}
                    className="flex items-center gap-1 text-sm text-[#1a1a1a] hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva receta
                  </button>
                </div>
                
                {sessionPrescriptions.length > 0 ? (
                  <div className="space-y-2">
                    {sessionPrescriptions.map((rx) => (
                      <div key={rx.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-sm text-[#1a1a1a]">Folio: {rx.folio}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(rx.prescriptionDate).toLocaleDateString("es-ES")} - {rx.prescriptionText.substring(0, 50)}...
                          </p>
                        </div>
                        <button
                          onClick={() => handlePrintPrescription(rx)}
                          className="px-3 py-1.5 bg-[#1a1a1a] text-white text-xs rounded-lg hover:bg-[#2a2a2a] transition-colors"
                        >
                          Imprimir
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No hay recetas para esta sesión</p>
                )}
              </div>
              
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
                {isSuperAdmin && (
                  <button
                    onClick={() => handleExport(selectedSession)}
                    className="flex-1 py-2 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    {t.common.export} JSON
                  </button>
                )}
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
      
      {/* Prescription Form Modal */}
      {showPrescriptionForm && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1a1a1a]">Nueva Receta</h3>
                <button
                  onClick={() => {
                    setShowPrescriptionForm(false);
                    setPrescriptionData({ prescriptionText: "", medications: "", nextVisitDate: "", notes: "" });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Paciente: {getPatientName(selectedSession.patientId)}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescripción / Indicaciones *
                </label>
                <textarea
                  value={prescriptionData.prescriptionText}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, prescriptionText: e.target.value }))}
                  rows={4}
                  placeholder="Describa las indicaciones y recomendaciones para el paciente..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamentos / Tratamientos
                </label>
                <textarea
                  value={prescriptionData.medications}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, medications: e.target.value }))}
                  rows={3}
                  placeholder="Liste los medicamentos o tratamientos recomendados..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Próxima Visita
                </label>
                <input
                  type="date"
                  value={prescriptionData.nextVisitDate}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, nextVisitDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  value={prescriptionData.notes}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Notas adicionales..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent resize-none"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowPrescriptionForm(false);
                  setPrescriptionData({ prescriptionText: "", medications: "", nextVisitDate: "", notes: "" });
                }}
                className="flex-1 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePrescription}
                disabled={!prescriptionData.prescriptionText.trim()}
                className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear Receta
              </button>
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

              {/* Follow-up Section */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4">Seguimiento</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                      Próxima cita
                    </label>
                    <input
                      type="date"
                      value={formData.nextAppointmentDate}
                      onChange={(e) => setFormData({ ...formData, nextAppointmentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                      Motivo de la cita
                    </label>
                    <select
                      value={formData.appointmentReason}
                      onChange={(e) => setFormData({ ...formData, appointmentReason: e.target.value as AppointmentReason })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    >
                      <option value="">Sin motivo específico</option>
                      {appointmentReasons.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                    Instrucciones de seguimiento
                  </label>
                  <textarea
                    rows={2}
                    value={formData.followUpNotes}
                    onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    placeholder="Instrucciones para el paciente, medicación, cuidados..."
                  />
                </div>
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

        {/* Upcoming/Overdue Appointments Alert Banner */}
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          
          const upcomingAppointments = sessions.filter(s => {
            if (!s.nextAppointmentDate) return false;
            const nextDate = new Date(s.nextAppointmentDate);
            return nextDate >= today && nextDate <= nextWeek;
          }).map(s => ({
            session: s,
            patient: getPatientById(s.patientId),
            daysUntil: Math.ceil((new Date(s.nextAppointmentDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          }));
          
          const overdueAppointments = sessions.filter(s => {
            if (!s.nextAppointmentDate) return false;
            const nextDate = new Date(s.nextAppointmentDate);
            return nextDate < today;
          }).map(s => ({
            session: s,
            patient: getPatientById(s.patientId),
            daysOverdue: Math.ceil((today.getTime() - new Date(s.nextAppointmentDate!).getTime()) / (1000 * 60 * 60 * 24))
          }));
          
          if (upcomingAppointments.length === 0 && overdueAppointments.length === 0) return null;
          
          return (
            <div className="space-y-3">
              {overdueAppointments.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800 mb-1">
                        Citas atrasadas ({overdueAppointments.length})
                      </h4>
                      <div className="space-y-1.5">
                        {overdueAppointments.slice(0, 3).map(({ session, patient, daysOverdue }) => (
                          <div key={session.id} className="flex items-center justify-between text-sm">
                            <span className="text-red-700">
                              {patient?.firstName} {patient?.lastName} - {daysOverdue} días atrasado
                            </span>
                            <button
                              onClick={() => {
                                setFormData({ ...emptyForm, patientId: session.patientId });
                                setShowForm(true);
                              }}
                              className="text-xs font-medium text-red-600 hover:text-red-800"
                            >
                              Programar cita →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {upcomingAppointments.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800 mb-1">
                        Próximas citas (7 días) - {upcomingAppointments.length}
                      </h4>
                      <div className="space-y-1.5">
                        {upcomingAppointments.slice(0, 3).map(({ session, patient, daysUntil }) => (
                          <div key={session.id} className="flex items-center justify-between text-sm">
                            <span className="text-blue-700">
                              {patient?.firstName} {patient?.lastName} - {daysUntil === 0 ? "Hoy" : daysUntil === 1 ? "Mañana" : `En ${daysUntil} días`}
                            </span>
                            <span className="text-xs text-blue-500">
                              {new Date(session.nextAppointmentDate!).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
                  <div className="flex-1" onClick={() => {
                    setSelectedSession(session);
                    loadSessionPrescriptions(session);
                  }}>
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
                      {/* Follow-up status badge */}
                      {(() => {
                        if (!session.nextAppointmentDate) return null;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const nextDate = new Date(session.nextAppointmentDate);
                        const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        if (daysUntil < 0) {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                              Atrasado
                            </span>
                          );
                        } else if (daysUntil <= 7) {
                          return (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                              Próxima cita
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{formatDate(session.sessionDate)}</p>
                    {session.diagnosis && (
                      <p className="text-sm text-gray-600 line-clamp-2">{session.diagnosis}</p>
                    )}
                    {session.nextAppointmentDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        📅 Próxima cita: {new Date(session.nextAppointmentDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
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
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleExport(session)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t.common.export}
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    )}
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
