import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { useRefreshOnFocus } from "../hooks/use-refresh-on-focus";

// Helper to check if user puede crear recetas
// Por defecto: podólogo. Opcionalmente permitimos también clinic_admin para gestión clínica avanzada.
const canCreatePrescriptions = (role: string | undefined): boolean => {
  return role === "podiatrist" || role === "clinic_admin";
};
const canManageClinicalSession = (role: string | undefined): boolean =>
  role === "podiatrist" || role === "clinic_admin" || role === "super_admin";
import type { ClinicalSession, Patient, AppointmentReason } from "../types/clinical";
import {
  normalizeDigitalAlterations,
  normalizeHelomas,
  normalizeLimbAssessment,
  normalizeOnychopathies,
  normalizeSweatDisorders,
} from "../types/podiatry";
import type { Prescription } from "../types/prescription";
import { postAuditLog } from "../lib/audit-client";
import { api } from "../lib/api-client";
import { compressImageForSession } from "../lib/image-compress";
import {
  openPodiatryHistoryPrint,
  type ClinicPrintInfo,
  type ProfessionalPrintInfo,
} from "../lib/podiatry-history-print";
import {
  SessionChecklistPanel,
  SessionPatientSignature,
} from "../components/sessions/session-clinical-extras";
import {
  PodiatryExaminationFields,
  createDefaultPodiatryExamination,
  finalizePodiatryExamination,
  type PodiatryExaminationValue,
} from "../components/sessions/podiatry-examination-fields";
import {
  applySessionTemplateFields,
  sessionFormHasClinicalContent,
  type SessionTemplate,
} from "../lib/session-templates";
import { useClinicalLayout } from "../hooks/use-clinical-layout";
import { SessionCustomSectionsFields } from "../components/sessions/session-custom-sections-fields";
import {
  finalizeCustomSections,
  getPodiatryVisibleBlocks,
  getSectionLabel,
  isSectionActive,
  type CustomSectionsData,
} from "../types/clinical-layout";

interface SessionFormData {
  patientId: string;
  sessionDate: string;
  clinicalNotes: string;
  anamnesis: string;
  physicalExamination: string;
  diagnosis: string;
  treatmentPlan: string;
  podiatryExam: PodiatryExaminationValue;
  customSections: CustomSectionsData;
  images: string[];
  nextAppointmentDate: string;
  followUpNotes: string;
  appointmentReason: AppointmentReason | "";
}

function sessionToPodiatryExam(session: ClinicalSession): PodiatryExaminationValue {
  return {
    footType: session.footType ?? null,
    archType: session.archType ?? null,
    sweatDisorders: normalizeSweatDisorders(session.sweatDisorders),
    limbAssessment: normalizeLimbAssessment(session.limbAssessment),
    helomas: normalizeHelomas(session.helomas),
    digitalAlterations: normalizeDigitalAlterations(session.digitalAlterations),
    onychopathies: normalizeOnychopathies(session.onychopathies),
  };
}

const emptyForm: SessionFormData = {
  patientId: "",
  sessionDate: new Date().toISOString().split("T")[0],
  clinicalNotes: "",
  anamnesis: "",
  physicalExamination: "",
  diagnosis: "",
  treatmentPlan: "",
  podiatryExam: createDefaultPodiatryExamination(),
  customSections: {},
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
  const { isSuperAdmin, isPodiatrist, isClinicAdmin } = usePermissions();
  const { layout: clinicalLayout } = useClinicalLayout();
  const podiatryVisibleBlocks = useMemo(
    () => getPodiatryVisibleBlocks(clinicalLayout, "session"),
    [clinicalLayout]
  );
  const showClinicalSection = (id: Parameters<typeof isSectionActive>[1]) =>
    isSectionActive(clinicalLayout, id, "session");
  const [location, setLocation] = useLocation();

  // Leer siempre la query y el path reales del navegador (wouter no incluye la query en location)
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const filterPatientId = searchParams.get("patient");
  let sessionIdFromUrl: string | null = searchParams.get("id");

  // Soportar también la ruta /sessions/:id (ej. /sessions/123)
  if (!sessionIdFromUrl) {
    const path =
      typeof window !== "undefined" ? window.location.pathname : location;
    const match = path.match(/^\/sessions\/([^/?#]+)/);
    if (match) {
      sessionIdFromUrl = match[1];
    }
  }
  
  const [sessions, setSessions] = useState<ClinicalSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "completed">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ClinicalSession | null>(null);
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [sessionPrescriptions, setSessionPrescriptions] = useState<Prescription[]>([]);

  const loadPatients = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; patients: Patient[] }>("/patients");
      if (response.success && response.data?.success) {
        setPatients(response.data.patients ?? []);
      }
    } catch (error) {
      console.error("Error cargando pacientes:", error);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; sessions: ClinicalSession[] }>("/sessions");
      if (response.success && response.data?.success) {
        setSessions(response.data.sessions);
      } else {
        console.error("Error cargando sesiones:", response.error || response.data?.message);
      }
    } catch (error) {
      console.error("Error cargando sesiones:", error);
    }
  }, []);

  const loadSessionTemplates = useCallback(async () => {
    try {
      const response = await api.get<{ success?: boolean; templates?: SessionTemplate[] }>(
        "/clinical/templates"
      );
      if (response.success && response.data?.templates) {
        setSessionTemplates(response.data.templates);
      } else {
        setSessionTemplates([]);
      }
    } catch {
      setSessionTemplates([]);
    }
  }, []);

  const loadSessionPrescriptions = useCallback(async (session: ClinicalSession) => {
    const res = await api.get<{ success?: boolean; prescriptions?: Prescription[] }>(
      `/prescriptions/session/${session.id}`
    );
    if (res.success && Array.isArray(res.data?.prescriptions)) {
      setSessionPrescriptions(res.data.prescriptions);
    } else {
      setSessionPrescriptions([]);
    }
  }, []);

  const openSessionDetail = useCallback(
    async (session: ClinicalSession) => {
      const res = await api.get<{ success: boolean; session: ClinicalSession }>(
        `/sessions/${session.id}`
      );
      const full =
        res.success && res.data?.session ? res.data.session : session;
      setSelectedSession(full);
      setSessions((prev) => prev.map((s) => (s.id === full.id ? full : s)));
      void loadSessionPrescriptions(full);
    },
    [loadSessionPrescriptions]
  );

  const refreshData = useCallback(() => {
    void loadPatients();
    void loadSessions();
  }, [loadPatients, loadSessions]);

  // Cargar pacientes al montar y cuando se abre el formulario (para tener datos frescos)
  useEffect(() => {
    loadPatients();
  }, [user?.id, loadPatients]);

  useEffect(() => {
    if (showForm) {
      loadPatients();
      loadSessionTemplates();
    }
  }, [showForm, loadPatients, loadSessionTemplates]);

  useRefreshOnFocus(refreshData);

  const getPatientById = (id: string) => patients.find((p) => p.id === id);

  const isPatientCompleteForSessions = (p: Patient | undefined) => {
    if (!p) return false;
    const fn = (p as any).firstName ?? (p as any).first_name ?? "";
    const ln = (p as any).lastName ?? (p as any).last_name ?? "";
    const dob = (p as any).dateOfBirth ?? (p as any).date_of_birth ?? "";
    const g = (p as any).gender ?? "";
    const idn = (p as any).idNumber ?? (p as any).id_number ?? "";
    return !!String(fn).trim() && !!String(ln).trim() && !!String(dob).trim() &&
      !!String(g).trim() && !!String(idn).trim();
  };

  const [formData, setFormData] = useState<SessionFormData>(
    filterPatientId ? { ...emptyForm, patientId: filterPatientId } : emptyForm
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedSession, setSelectedSession] = useState<ClinicalSession | null>(null);
  const [graceError, setGraceError] = useState<string | null>(null);

  const closeSessionForm = () => {
    setShowForm(false);
    setEditingSession(null);
    setFormData(emptyForm);
    setSelectedTemplateId("");
  };

  const applySelectedTemplate = () => {
    if (!selectedTemplateId) return;
    const template = sessionTemplates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    const currentClinical = {
      anamnesis: formData.anamnesis,
      physicalExamination: formData.physicalExamination,
      diagnosis: formData.diagnosis,
      treatmentPlan: formData.treatmentPlan,
    };

    if (
      sessionFormHasClinicalContent(currentClinical) &&
      !window.confirm(
        "¿Cargar esta plantilla? Se reemplazarán anamnesis, exploración, diagnóstico y plan de tratamiento."
      )
    ) {
      return;
    }

    const applied = applySessionTemplateFields(template.fields, currentClinical);
    setFormData((prev) => ({ ...prev, ...applied }));
  };

  const handleRescheduleNextAppointment = (session: ClinicalSession) => {
    // Open the session edit form so user can edit the next appointment date
    setEditingSession(session);
    setSelectedTemplateId("");
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
      podiatryExam: sessionToPodiatryExam(session),
    });
    setShowForm(true);
    setTimeout(() => {
      const form = document.querySelector('[data-session-form]');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  
  // Cargar sesiones desde la API (el backend aplica reglas de visibilidad por rol)
  useEffect(() => {
    loadSessions();
  }, [isPodiatrist, user?.id, loadSessions]);

  // Auto-open session if id is in URL
  useEffect(() => {
    if (sessionIdFromUrl) {
      const session = sessions.find((s) => s.id === sessionIdFromUrl);
      if (session) {
        void openSessionDetail(session);
      }
    } else {
      setSelectedSession(null);
    }
  }, [sessionIdFromUrl, sessions, openSessionDetail]);

  useEffect(() => {
    if (isClinicAdmin) {
      setLocation("/");
    }
  }, [isClinicAdmin, setLocation]);

  // Detect print attempts from session form
  useEffect(() => {
    const handleBeforePrint = () => {
      // Only intercept if the form is open
      if (!showForm) return;
      
      // Log violation
      api.post("/audit-logs", {
        action: "PRINT_VIOLATION_FORM",
        resourceType: "session",
        resourceId: editingSession?.id || "new_session",
        details: {
          sessionId: editingSession?.id || "new_session",
          patientId: formData.patientId || null,
          podiatristId: user?.id,
          podiatristName: user?.name,
          timestamp: new Date().toISOString(),
          message: "Intento de impresión desde formulario de sesión - Incumplimiento con el servicio otorgado",
          violationType: "print_from_form",
        },
      });
      
      // Create print window with podiatrist name only
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Podólogo - ${user?.name || "Usuario"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              background: white;
              padding: 40px;
            }
            .podiatrist-name {
              font-size: 72px;
              font-weight: bold;
              color: #1a1a1a;
              text-align: center;
              letter-spacing: 2px;
            }
            @media print {
              body { 
                padding: 0;
                margin: 0;
              }
              .podiatrist-name {
                font-size: 96px;
              }
              @page {
                margin: 0;
                size: A4;
              }
            }
          </style>
        </head>
        <body>
          <div class="podiatrist-name">
            ${user?.name || "Usuario"}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.print();
    };

    if (showForm) {
      window.addEventListener("beforeprint", handleBeforePrint);
    }

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [showForm, editingSession, formData.patientId, user?.id, user?.name]);
  
  // Prescription state
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState({
    prescriptionText: "",
    medications: "",
    nextVisitDate: "",
    notes: "",
  });

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

  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const input = e.target;

    setImageUploadError(null);
    const currentCount = formData.images.length;
    if (currentCount >= 2) return;
    const toAdd = Math.min(2 - currentCount, files.length);
    const slice = Array.from(files).slice(0, toAdd);
    const processed: string[] = [];

    const toDataUrl = (file: File): Promise<string> =>
      compressImageForSession(file).catch(() =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
          reader.readAsDataURL(file);
        })
      );

    for (const file of slice) {
      if (!file.type.startsWith("image/")) {
        setImageUploadError("Solo se permiten imágenes (JPEG, PNG, WebP).");
        continue;
      }
      try {
        const dataUrl = await toDataUrl(file);
        processed.push(dataUrl);
      } catch (err) {
        setImageUploadError(err instanceof Error ? err.message : "Error al procesar la imagen.");
      }
    }

    if (processed.length > 0) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...processed] }));
    }
    input.value = "";
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean) => {
    e.preventDefault();
  setGraceError(null);
    
    if (!formData.patientId) {
      alert("Seleccione un paciente.");
      return;
    }

    const finalizedExam = finalizePodiatryExamination(formData.podiatryExam);
    const finalizedCustomSections = finalizeCustomSections(formData.customSections, clinicalLayout);

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
      nextAppointmentDate: formData.nextAppointmentDate || null,
      followUpNotes: formData.followUpNotes || null,
      appointmentReason: formData.appointmentReason || null,
      ...finalizedExam,
      customSections: finalizedCustomSections,
    };

    try {
      if (editingSession) {
        const response = await api.put<{ success: boolean; session: ClinicalSession }>(
          `/sessions/${editingSession.id}`,
          {
            ...sessionData,
            completedAt: asDraft ? null : new Date().toISOString(),
          }
        );

        if (response.success && response.data?.success) {
          const updated = response.data.session;
          setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

          const patient = getPatientById(editingSession.patientId);
          void postAuditLog({
            action: asDraft ? "UPDATE_DRAFT" : "COMPLETE",
            resourceType: "session",
            resourceId: editingSession.id,
            details: {
              sessionId: editingSession.id,
              patientId: editingSession.patientId,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
              status: asDraft ? "draft" : "completed",
            },
          });
        } else {
          alert(response.error || response.data?.message || "No se pudo actualizar la sesión.");
          return;
        }
      } else {
        const response = await api.post<{ success: boolean; session: ClinicalSession }>(
          "/sessions",
          sessionData
        );

        if (response.success && response.data?.success) {
          const newSession = response.data.session;
          setSessions((prev) => [newSession, ...prev]);

          const patient = getPatientById(newSession.patientId);
          void postAuditLog({
            action: "CREATE",
            resourceType: "session",
            resourceId: newSession.id,
            details: {
              sessionId: newSession.id,
              patientId: newSession.patientId,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
              status: asDraft ? "draft" : "completed",
            },
          });
        } else {
          const errData = response.data as any;
          const errorCode = response.error || errData?.error;

          if (errorCode === "usuario_en_periodo_gracia") {
            setGraceError(
              errData?.message ||
                "Tu cuenta está en período de gracia por exceso de pago. Durante 30 días puedes ver tus datos, pero no crear nuevas sesiones clínicas."
            );
            return;
          }

          alert(response.error || response.data?.message || "No se pudo crear la sesión.");
          return;
        }
      }

      closeSessionForm();
    } catch (error) {
      console.error("Error guardando sesión:", error);
      alert("Ha ocurrido un error al guardar la sesión.");
    }
  };

  const handleEdit = async (session: ClinicalSession) => {
    if (session.status === "completed") return;

    const res = await api.get<{ success: boolean; session: ClinicalSession }>(
      `/sessions/${session.id}`
    );
    const s = res.success && res.data?.session ? res.data.session : session;

    setEditingSession(s);
    setSelectedTemplateId("");
    setFormData({
      patientId: s.patientId,
      sessionDate: s.sessionDate,
      clinicalNotes: s.clinicalNotes,
      anamnesis: s.anamnesis,
      physicalExamination: s.physicalExamination,
      diagnosis: s.diagnosis,
      treatmentPlan: s.treatmentPlan,
      images: s.images ?? [],
      nextAppointmentDate: s.nextAppointmentDate || "",
      followUpNotes: s.followUpNotes || "",
      appointmentReason: s.appointmentReason || "",
      podiatryExam: sessionToPodiatryExam(s),
      customSections: s.customSections ?? {},
    });
    setShowForm(true);
  };

  const handleDelete = async (session: ClinicalSession) => {
    if (session.status === "completed") return;
    
    if (!confirm("¿Eliminar esta sesión?")) {
      return;
    }

    try {
      const response = await api.delete<{ success: boolean; message?: string }>(
        `/sessions/${session.id}`
      );

      if (response.success && response.data?.success) {
        const patient = getPatientById(session.patientId);
        setSessions((prev) => prev.filter((s) => s.id !== session.id));
        
        void postAuditLog({
          action: "DELETE",
          resourceType: "session",
          resourceId: session.id,
          details: {
            sessionId: session.id,
            patientId: session.patientId,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
          },
        });
      } else {
        alert(response.error || response.data?.message || "No se pudo eliminar la sesión.");
      }
    } catch (error) {
      console.error("Error eliminando sesión:", error);
      alert("Ha ocurrido un error al eliminar la sesión.");
    }
  };

  const handleExport = async (session: ClinicalSession) => {
    if (!isPodiatrist) {
      alert("Solo los podólogos pueden exportar historias clínicas.");
      return;
    }
    const res = await api.get<{ success?: boolean; export?: unknown }>(
      `/compliance/patients/${session.patientId}/portable-export`
    );
    if (!res.success || !res.data?.export) {
      alert(res.error || "No se pudo exportar la historia clínica");
      return;
    }
    const blob = new Blob([JSON.stringify(res.data.export, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historia_clinica_${session.patientId}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const patient = getPatientById(session.patientId);
    void postAuditLog({
      action: "EXPORT",
      resourceType: "session",
      resourceId: session.id,
      details: {
        sessionId: session.id,
        patientId: session.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
        exportType: "json",
      },
    });
  };

  const loadLogoForCurrentUser = async (): Promise<string | undefined> => {
    if (user?.clinicId) {
      const res = await api.get<{ success?: boolean; logo?: string | null }>(
        `/clinics/${user.clinicId}/logo`
      );
      if (res.success && res.data?.logo) return res.data.logo;
    }
    if (user?.id) {
      const res = await api.get<{ success?: boolean; logo?: string | null }>(
        `/professionals/logo/${user.id}`
      );
      if (res.success && res.data?.logo) return res.data.logo;
    }
    return undefined;
  };

  const handlePrint = async (session: ClinicalSession) => {
    const patient = getPatientById(session.patientId);
    if (!patient) return;

    void api.post("/compliance/record-access", { patientId: patient.id, action: "print" });
    
    const clinicLogo = await loadLogoForCurrentUser();
    let clinic: ClinicPrintInfo | null = null;
    if (user?.clinicId) {
      const cr = await api.get<{ success?: boolean; clinic?: ClinicPrintInfo }>(`/clinics/${user.clinicId}`);
      if (cr.success && cr.data?.clinic) clinic = cr.data.clinic;
    }
    let profInfo: ProfessionalPrintInfo | null = null;
    let podiatristLicense: string | null = null;
    if (user?.id) {
      const pr = await api.get<{ success?: boolean; professional?: ProfessionalPrintInfo; license?: string }>(`/professionals/${user.id}`);
      if (pr.success) {
        profInfo = pr.data?.professional ?? (pr.data as ProfessionalPrintInfo);
        podiatristLicense = pr.data?.license || profInfo?.professionalLicense || profInfo?.license || null;
      }
    }
    const patientSessions = sessions
      .filter((s) => s.patientId === patient.id)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    const latestSession = patientSessions[0] ?? session;

    const opened = openPodiatryHistoryPrint({
      patient,
      sessions: patientSessions,
      latestSession,
      clinicLogo,
      clinic,
      professional: profInfo,
      podiatristName: user?.name,
      podiatristLicense,
      layout: clinicalLayout,
    });
    if (!opened) return;
    
    void postAuditLog({
      action: "PRINT",
      resourceType: "session",
      resourceId: session.id,
      details: {
        sessionId: session.id,
        patientId: session.patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        printType: "podiatry_history_full",
        sessionsIncluded: patientSessions.length,
      },
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

  const handleCreatePrescription = async () => {
    if (!selectedSession || !user) return;
    if (!canCreatePrescriptions(user.role)) return;

    const patient = getPatientById(selectedSession.patientId);
    if (!patient) return;

    let license: string | null = null;
    const profRes = await api.get<{ license?: string; professionalLicense?: string }>(
      `/professionals/${user.id}`
    );
    if (profRes.success && profRes.data) {
      license = profRes.data.license || profRes.data.professionalLicense || null;
    }

    const res = await api.post<{ success?: boolean; prescription?: Prescription }>("/prescriptions", {
      sessionId: selectedSession.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientDob: patient.dateOfBirth,
      patientDni: patient.idNumber,
      podiatristName: user.name,
      podiatristLicense: license,
      prescriptionText: prescriptionData.prescriptionText,
      medications: prescriptionData.medications,
      nextVisitDate: prescriptionData.nextVisitDate || null,
      notes: prescriptionData.notes,
    });

    if (!res.success || !res.data?.prescription) {
      alert(res.error || "No se pudo crear la receta");
      return;
    }

    setSessionPrescriptions((prev) => [...prev, res.data!.prescription!]);
    setPrescriptionData({ prescriptionText: "", medications: "", nextVisitDate: "", notes: "" });
    setShowPrescriptionForm(false);

    void postAuditLog({
      action: "CREATE",
      resourceType: "prescription",
      resourceId: res.data.prescription.id,
      details: {
        prescriptionId: res.data.prescription.id,
        sessionId: selectedSession.id,
        patientId: patient.id,
      },
    });
  };
  
  // Print prescription
  const handlePrintPrescription = async (prescription: Prescription) => {
    // Get clinic/professional info
    const clinicLogo = await loadLogoForCurrentUser();
    type ClinicRow = {
      clinicName?: string;
      legalName?: string;
      rfc?: string;
      clues?: string;
      cofeprisRegistration?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      licenseNumber?: string;
    };
    type ProfRow = { name?: string; phone?: string; email?: string; address?: string; city?: string; postalCode?: string; licenseNumber?: string; professionalLicense?: string };
    let clinic: ClinicRow | null = null;
    if (user?.clinicId) {
      const cr = await api.get<{ success?: boolean; clinic?: ClinicRow }>(`/clinics/${user.clinicId}`);
      if (cr.success && cr.data?.clinic) clinic = cr.data.clinic;
    }
    let profInfo: ProfRow | null = null;
    if (user?.id && !clinic) {
      const pr = await api.get<{ success?: boolean; professional?: ProfRow }>(`/professionals/${user.id}`);
      if (pr.success && pr.data?.professional) profInfo = pr.data.professional;
    }
    let credentials: { cedula?: string; registro?: string } | null = null;
    if (user?.id && user?.clinicId) {
      const cred = await api.get<{ success?: boolean; credentials?: { cedula?: string; registro?: string } }>(
        `/professionals/${user.id}/credentials`
      );
      if (cred.success && cred.data?.credentials) credentials = cred.data.credentials;
    }
    const clinicName = clinic?.clinicName || profInfo?.name || user?.name || "";
    const clinicPhone = clinic?.phone || profInfo?.phone || "";
    const clinicEmail = clinic?.email || profInfo?.email || "";
    const clinicAddress = clinic?.address 
      ? `${clinic.address}${clinic.city ? `, ${clinic.city}` : ""}${clinic.postalCode ? ` ${clinic.postalCode}` : ""}`
      : profInfo?.address 
        ? `${profInfo.address}${profInfo.city ? `, ${profInfo.city}` : ""}${profInfo.postalCode ? ` ${profInfo.postalCode}` : ""}`
        : "";
    const clinicLicenseNumber = clinic?.licenseNumber || profInfo?.licenseNumber || "";
    
    // Get individual professional credentials
    // For clinic podiatrists: use cedula from credentials, for independent: use from profInfo
    const podiatristCedula = credentials?.cedula || profInfo?.professionalLicense || prescription.podiatristLicense || "";
    const podiatristRegistro = credentials?.registro || "";
    
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
              ${podiatristCedula ? `<p class="license">Cédula: ${podiatristCedula}</p>` : ''}
              ${podiatristRegistro ? `<p style="margin: 0; color: #555; font-size: 12px;">Registro: ${podiatristRegistro}</p>` : ''}
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
            ${podiatristCedula ? `<p style="margin: 0; font-size: 12px; color: #666;">Cédula: ${podiatristCedula}</p>` : ''}
            ${podiatristRegistro ? `<p style="margin: 0; font-size: 12px; color: #666;">Registro: ${podiatristRegistro}</p>` : ''}
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
    
    void postAuditLog({
      action: "PRINT",
      resourceType: "prescription",
      resourceId: prescription.id,
      details: {
        prescriptionId: prescription.id,
        prescriptionFolio: prescription.folio,
        patientId: prescription.patientId,
        patientName: prescription.patientName,
        printType: "prescription",
      },
    });
  };

  if (isClinicAdmin) {
    return (
      <MainLayout title={t.sessions?.title || "Sesiones Clínicas"}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-gray-500 text-lg">No tienes acceso a esta sección</p>
            <p className="text-gray-400 text-sm mt-2">Los administradores de clínica no pueden acceder a sesiones clínicas.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t.sessions.title}>
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
              
              {showClinicalSection("anamnesis") && selectedSession.anamnesis && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">
                    {getSectionLabel(clinicalLayout, "anamnesis")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.anamnesis}</p>
                </div>
              )}

              {Object.values(podiatryVisibleBlocks).some(Boolean) && (
              <div>
                <h4 className="font-medium text-[#1a1a1a] mb-3">Exploración podológica</h4>
                <PodiatryExaminationFields
                  value={sessionToPodiatryExam(selectedSession)}
                  onChange={() => {}}
                  readOnly
                  visibleBlocks={podiatryVisibleBlocks}
                />
              </div>
              )}

              {showClinicalSection("physical_examination") && selectedSession.physicalExamination && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">
                    {getSectionLabel(clinicalLayout, "physical_examination")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.physicalExamination}</p>
                </div>
              )}
              
              {showClinicalSection("diagnosis") && selectedSession.diagnosis && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">
                    {getSectionLabel(clinicalLayout, "diagnosis")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.diagnosis}</p>
                </div>
              )}
              
              {showClinicalSection("treatment_plan") && selectedSession.treatmentPlan && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">
                    {getSectionLabel(clinicalLayout, "treatment_plan")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.treatmentPlan}</p>
                </div>
              )}
              
              {showClinicalSection("clinical_notes") && selectedSession.clinicalNotes && (
                <div>
                  <h4 className="font-medium text-[#1a1a1a] mb-2">
                    {getSectionLabel(clinicalLayout, "clinical_notes")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.clinicalNotes}</p>
                </div>
              )}

              <SessionCustomSectionsFields
                layoutSections={clinicalLayout.sections}
                value={selectedSession.customSections ?? {}}
                onChange={() => {}}
                readOnly
              />
              
              {showClinicalSection("session_images") && (
              <div>
                <h4 className="font-medium text-[#1a1a1a] mb-2">{t.sessions.images}</h4>
                {(selectedSession.images ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No hay fotos en esta sesión. Súbelas al crear o editar el borrador.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {selectedSession.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Imagen ${idx + 1}`}
                        className="max-w-xs max-h-48 rounded-lg border border-gray-200 object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
              )}

              {canManageClinicalSession(user?.role) && showClinicalSection("session_checklist") && (
                <SessionChecklistPanel sessionId={selectedSession.id} />
              )}
              {canManageClinicalSession(user?.role) && showClinicalSection("session_signature") && (
                  <SessionPatientSignature
                    sessionId={selectedSession.id}
                    patientId={selectedSession.patientId}
                    consentVersion={1}
                  />
              )}
              
              {/* Prescriptions Section - Only visible for podiatrists */}
              {canCreatePrescriptions(user?.role) && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-[#1a1a1a]">Recetas / Prescripciones</h4>
                    <button
                      onClick={() => setShowPrescriptionForm(true)}
                      className="flex items-center gap-1 text-sm text-[#1a1a1a] hover:underline font-medium"
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
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="font-medium text-sm text-[#1a1a1a]">Folio: {rx.folio}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(rx.prescriptionDate).toLocaleDateString("es-ES")}
                            </p>
                            {rx.medications && (
                              <p className="text-xs text-gray-600 mt-1 truncate">
                                Medicamentos: {rx.medications.substring(0, 80)}{rx.medications.length > 80 ? '...' : ''}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handlePrintPrescription(rx)}
                            className="px-3 py-1.5 bg-[#1a1a1a] text-white text-xs rounded-lg hover:bg-[#2a2a2a] transition-colors shrink-0"
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
      
      {/* Prescription Form Modal - Only accessible for podiatrists */}
      {showPrescriptionForm && selectedSession && canCreatePrescriptions(user?.role) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto form-modal-scroll">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto form-modal-scroll">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto form-modal-scroll">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto form-modal-scroll" data-session-form>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#1a1a1a]">
                {editingSession ? t.sessions.editSession : t.sessions.newSession}
              </h3>
              <button
                onClick={closeSessionForm}
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
                    {patients
                      .filter((p) => isPatientCompleteForSessions(p) || (editingSession && p.id === editingSession.patientId))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}{!isPatientCompleteForSessions(p) ? " (datos incompletos)" : ""}
                        </option>
                      ))}
                  </select>
                  {formData.patientId && (() => {
                    const p = patients.find((x) => x.id === formData.patientId);
                    return p && !isPatientCompleteForSessions(p);
                  })() && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                      <p className="text-sm text-amber-800">
                        Faltan datos obligatorios del paciente (nombre, apellido, fecha nacimiento, género, DNI). Para menores use el DNI del padre/tutor. <strong>Edite la ficha del paciente</strong> para poder guardar la sesión.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(`/patients?id=${formData.patientId}`, "_blank")}
                          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                        >
                          Editar paciente →
                        </button>
                        <button
                          type="button"
                          onClick={loadPatients}
                          className="px-4 py-2 bg-white border border-amber-300 text-amber-800 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors"
                        >
                          Actualizar datos (si ya editó el paciente)
                        </button>
                      </div>
                    </div>
                  )}
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

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                      Plantilla de sesión
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] bg-white"
                    >
                      <option value="">Sin plantilla</option>
                      {sessionTemplates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                          {tpl.isShared ? " (compartida)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={applySelectedTemplate}
                    disabled={!selectedTemplateId}
                    className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm disabled:opacity-40"
                  >
                    Cargar plantilla
                  </button>
                </div>
                {sessionTemplates.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No hay plantillas. Créalas en{" "}
                    <a href="/clinical-tools" className="underline text-[#1a1a1a]">
                      Herramientas clínicas
                    </a>
                    .
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Rellena anamnesis, exploración, diagnóstico y plan con el contenido guardado en la plantilla.
                  </p>
                )}
              </div>

              {Object.values(podiatryVisibleBlocks).some(Boolean) && (
              <PodiatryExaminationFields
                value={formData.podiatryExam}
                onChange={(podiatryExam) => setFormData((prev) => ({ ...prev, podiatryExam }))}
                visibleBlocks={podiatryVisibleBlocks}
              />
              )}

              {showClinicalSection("anamnesis") && (
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {getSectionLabel(clinicalLayout, "anamnesis")}
                </label>
                <textarea
                  rows={3}
                  value={formData.anamnesis}
                  onChange={(e) => setFormData({ ...formData, anamnesis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Motivo de consulta, antecedentes..."
                />
              </div>
              )}

              {showClinicalSection("physical_examination") && (
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {getSectionLabel(clinicalLayout, "physical_examination")}
                </label>
                <textarea
                  rows={3}
                  value={formData.physicalExamination}
                  onChange={(e) => setFormData({ ...formData, physicalExamination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Hallazgos de la exploración..."
                />
              </div>
              )}

              {showClinicalSection("diagnosis") && (
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {getSectionLabel(clinicalLayout, "diagnosis")}
                </label>
                <textarea
                  rows={2}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Diagnóstico podológico..."
                />
              </div>
              )}

              {showClinicalSection("treatment_plan") && (
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {getSectionLabel(clinicalLayout, "treatment_plan")}
                </label>
                <textarea
                  rows={3}
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Plan de tratamiento..."
                />
              </div>
              )}

              {showClinicalSection("clinical_notes") && (
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
                  {getSectionLabel(clinicalLayout, "clinical_notes")}
                </label>
                <textarea
                  rows={2}
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="Notas adicionales..."
                />
              </div>
              )}

              <SessionCustomSectionsFields
                layoutSections={clinicalLayout.sections}
                value={formData.customSections}
                onChange={(customSections) => setFormData((prev) => ({ ...prev, customSections }))}
              />

              {showClinicalSection("session_images") && (
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
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                  aria-label={t.sessions.uploadImages}
                />
                {formData.images.length < 2 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{t.sessions.uploadImages}</span>
                  </button>
                )}
                {imageUploadError && (
                  <p className="text-xs text-red-600 mt-2">{imageUploadError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">{t.sessions.maxImages}</p>
              </div>
              )}

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
              {(() => {
                const selectedPatient = patients.find((x) => x.id === formData.patientId);
                const patientComplete = selectedPatient ? isPatientCompleteForSessions(selectedPatient) : false;
                const canSave = !!formData.patientId && patientComplete;
                const disableReason = !formData.patientId
                  ? "Seleccione un paciente"
                  : !patientComplete
                    ? "Complete los datos obligatorios del paciente (nombre, apellido, fecha nacimiento, género, DNI)"
                    : undefined;
                const showSaveBlockedHint = formData.patientId && !patientComplete;
                return (
                  <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                    {showSaveBlockedHint && (
                      <p className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                        Para guardar borrador o completar la sesión, primero complete los datos del paciente y haga clic en &quot;Actualizar datos&quot; arriba.
                      </p>
                    )}
                    {graceError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex gap-3">
                        <svg
                          className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
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
                          <p className="text-sm font-semibold text-red-800">
                            No puedes crear nuevas sesiones en este momento
                          </p>
                          <p className="mt-1 text-sm text-red-700">
                            {graceError}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeSessionForm}
                        className="flex-1 py-3 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={!canSave}
                        title={disableReason}
                        className="flex-1 py-3 bg-gray-100 text-[#1a1a1a] rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.sessions.saveDraft}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        disabled={!canSave}
                        title={disableReason}
                        className="flex-1 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.sessions.complete}
                      </button>
                    </div>
                  </div>
                );
              })()}
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-500">
                                {new Date(session.nextAppointmentDate!).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRescheduleNextAppointment(session)}
                                className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
                                title="Reprogramar próxima cita"
                              >
                                Reprogramar
                              </button>
                            </div>
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
                  <div className="flex-1" onClick={() => void openSessionDetail(session)}>
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
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    {session.status === "draft" && (
                      <>
                        <button
                          onClick={() => handleEdit(session)}
                          className="p-2.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title={t.common.edit}
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(session)}
                          className="p-2.5 sm:p-2 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
                        className="p-2.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title={t.common.export}
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handlePrint(session)}
                      className="p-2.5 sm:p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
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
