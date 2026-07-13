import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { useClinicalListPage } from "../hooks/use-clinical-list-page";
import { usePatientPicker, fetchPatientById, fetchPatientPickerSample, invalidatePatientDetailCache, PATIENT_SEARCH_SELECT_THRESHOLD } from "../hooks/use-patient-picker";
import { invalidateClinicalListCache } from "../lib/clinical-list-cache";
import { ClinicalListError, ClinicalListLoading } from "../components/clinical/clinical-list-states";
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from "../components/ui/app-modal";
import { CheckoutHandoffModal } from "../components/checkout/checkout-handoff-modal";
import { PatientSearchSelect } from "../components/patients/patient-search-select";
import {
  formErrorClass,
  formFieldClassSm,
  formFieldResizeClass,
  formHintClass,
  formLabelClass,
  formPanelMutedClass,
  formWarningClass,
  semanticAlertErrorClass,
  semanticAlertWarningClass,
  semanticChipSuccessClass,
  semanticChipWarningClass,
} from "../lib/form-field-classes";
import { normalizePatientVital, patientVitalToFormValue } from "../lib/patient-vitals";

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
import { getBrandCssVar } from "../lib/palette-preferences";
import { api } from "../lib/api-client";
import { postAuditLog } from "../lib/audit-client";
import { compressImageForSession } from "../lib/image-compress";
import {
  computeAgeYears,
  EMPTY_PRESCRIPTION_FORM,
  formatPrescriptionAge,
  formatPrescriptionApiError,
  type PrescriptionFormData,
} from "../lib/prescription-utils";
import { getPrintPreferences } from "../lib/print-preferences-client";
import { openPrescriptionPrint } from "../lib/prescription-print";
import {
  openPodiatryHistoryPrint,
  preparePrintLogo,
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
  countIncludedTemplateSections,
  normalizeTemplateFields,
  resolveSessionFormLayout,
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
  type ClinicalLayoutConfig,
  type CustomSectionsData,
} from "../types/clinical-layout";

interface SessionFormData {
  patientId: string;
  sessionDate: string;
  patientWeightKg: string;
  patientHeightCm: string;
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
  patientWeightKg: "",
  patientHeightCm: "",
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

function vitalsFromPatient(patient: Patient | null | undefined): Pick<SessionFormData, "patientWeightKg" | "patientHeightCm"> {
  return {
    patientWeightKg: patientVitalToFormValue(patient?.weightKg),
    patientHeightCm: patientVitalToFormValue(patient?.heightCm),
  };
}

function vitalsFromSession(session: ClinicalSession): Pick<SessionFormData, "patientWeightKg" | "patientHeightCm"> {
  return {
    patientWeightKg: patientVitalToFormValue(session.patientWeightKg),
    patientHeightCm: patientVitalToFormValue(session.patientHeightCm),
  };
}

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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "completed">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ClinicalSession | null>(null);
  const [sessionTemplates, setSessionTemplates] = useState<SessionTemplate[]>([]);
  const [sessionPrescriptions, setSessionPrescriptions] = useState<Prescription[]>([]);
  const [patientCache, setPatientCache] = useState<Record<string, Patient>>({});
  const [checkoutPrompt, setCheckoutPrompt] = useState<{
    patientId: string;
    patientName: string;
    sessionId: string;
  } | null>(null);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedQ("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQ(trimmed), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sessionFilters = useMemo(
    () => ({
      ...(filterPatientId ? { patient: filterPatientId } : {}),
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(debouncedQ ? { q: debouncedQ } : {}),
    }),
    [filterPatientId, statusFilter, debouncedQ]
  );

  const {
    items: sessions,
    hasMore: sessionsHasMore,
    isLoading: clinicalListLoading,
    isLoadingMore: sessionsLoadingMore,
    error: clinicalListError,
    reload: reloadClinicalLists,
    loadMore: loadMoreSessions,
  } = useClinicalListPage<ClinicalSession>({
    path: "/sessions",
    listKey: "sessions",
    filters: sessionFilters,
  });

  const [patientPickerUseFullList, setPatientPickerUseFullList] = useState(false);
  const [patientPickerMode, setPatientPickerMode] = useState<"loading" | "select" | "search">("loading");
  const [compactPatients, setCompactPatients] = useState<Patient[]>([]);
  const [formSelectedPatient, setFormSelectedPatient] = useState<Patient | null>(null);
  const { patients: pickerPatients, reload: reloadPickerPatients } = usePatientPicker(
    false
  );
  useEffect(() => {
    if (!showForm) {
      setPatientPickerMode("loading");
      setCompactPatients([]);
      setPatientPickerUseFullList(false);
      setFormSelectedPatient(null);
      return;
    }
    let cancelled = false;
    void fetchPatientPickerSample().then(({ patients, hasMore }) => {
      if (cancelled) return;
      const useSearch =
        hasMore || patients.length > PATIENT_SEARCH_SELECT_THRESHOLD;
      setCompactPatients(patients);
      setPatientPickerUseFullList(false);
      setPatientPickerMode(useSearch ? "search" : "select");
    });
    return () => {
      cancelled = true;
    };
  }, [showForm]);

  const sessionFormPatients =
    patientPickerMode === "select" ? compactPatients : compactPatients;

  const loadSessionTemplates = useCallback(async () => {
    try {
      const response = await api.get<{ success?: boolean; templates?: SessionTemplate[] }>(
        "/clinical/templates"
      );
      if (response.success && response.data?.templates) {
        setSessionTemplates(
          response.data.templates.map((t) => ({
            ...t,
            fields: normalizeTemplateFields(t.fields),
          }))
        );
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

  const getPatientById = useCallback(
    (id: string): Patient | undefined => {
      if (formSelectedPatient?.id === id) return formSelectedPatient;
      const fromFormList = sessionFormPatients.find((p) => p.id === id);
      if (fromFormList) return fromFormList;
      const fromPicker = pickerPatients.find((p) => p.id === id);
      if (fromPicker) return fromPicker;
      return patientCache[id];
    },
    [formSelectedPatient, sessionFormPatients, pickerPatients, patientCache]
  );

  const ensurePatientLoaded = useCallback(
    async (id: string) => {
      if (getPatientById(id)) return;
      const p = await fetchPatientById(id);
      if (p) setPatientCache((prev) => ({ ...prev, [id]: p }));
    },
    [getPatientById]
  );

  const getPatientName = useCallback(
    (patientId: string) => {
      const fromSession = sessions.find((s) => s.patientId === patientId)?.patientName;
      if (fromSession) return fromSession;
      const patient = getPatientById(patientId);
      return patient ? `${patient.firstName} ${patient.lastName}` : "Paciente desconocido";
    },
    [sessions, getPatientById]
  );

  const openSessionDetail = useCallback(
    async (session: ClinicalSession) => {
      const res = await api.get<{ success: boolean; session: ClinicalSession }>(
        `/sessions/${session.id}`
      );
      const full =
        res.success && res.data?.session ? res.data.session : session;
      setSelectedSession(full);
      void loadSessionPrescriptions(full);
      void ensurePatientLoaded(full.patientId);
    },
    [loadSessionPrescriptions, ensurePatientLoaded]
  );

  useEffect(() => {
    if (showForm) {
      loadSessionTemplates();
    }
  }, [showForm, loadSessionTemplates]);

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
  const [appliedTemplateLayout, setAppliedTemplateLayout] = useState<ClinicalLayoutConfig | null>(null);
  const [selectedSession, setSelectedSession] = useState<ClinicalSession | null>(null);
  const [graceError, setGraceError] = useState<string | null>(null);

  const sessionFormLayout = useMemo(
    () =>
      appliedTemplateLayout
        ? resolveSessionFormLayout(clinicalLayout, appliedTemplateLayout)
        : clinicalLayout,
    [clinicalLayout, appliedTemplateLayout]
  );
  const sessionFormPodiatryBlocks = useMemo(
    () => getPodiatryVisibleBlocks(sessionFormLayout, "session"),
    [sessionFormLayout]
  );
  const showSessionFormSection = (id: Parameters<typeof isSectionActive>[1]) =>
    isSectionActive(sessionFormLayout, id, "session");

  const closeSessionForm = () => {
    setShowForm(false);
    setEditingSession(null);
    setFormData(emptyForm);
    setSelectedTemplateId("");
    setAppliedTemplateLayout(null);
    setFormSelectedPatient(null);
  };

  const applyTemplateById = useCallback(
    (templateId: string): boolean => {
      if (!templateId) {
        setAppliedTemplateLayout(null);
        return true;
      }

      const template = sessionTemplates.find((t) => t.id === templateId);
      if (!template) return false;

      const currentClinical = {
        anamnesis: formData.anamnesis,
        physicalExamination: formData.physicalExamination,
        diagnosis: formData.diagnosis,
        treatmentPlan: formData.treatmentPlan,
        clinicalNotes: formData.clinicalNotes,
        appointmentReason: formData.appointmentReason,
        podiatryExam: formData.podiatryExam,
        customSections: formData.customSections,
      };

      if (
        sessionFormHasClinicalContent(currentClinical) &&
        !window.confirm(
          "¿Aplicar esta plantilla? Se reemplazarán los campos clínicos actuales (texto, exploración podológica y secciones personalizadas)."
        )
      ) {
        return false;
      }

      const normalizedTemplate = normalizeTemplateFields(template.fields);
      const applied = applySessionTemplateFields(normalizedTemplate, currentClinical);
      if (normalizedTemplate.sectionLayout?.sections?.length) {
        setAppliedTemplateLayout(normalizedTemplate.sectionLayout);
      } else {
        setAppliedTemplateLayout(null);
      }
      setFormData((prev) => ({
        ...prev,
        anamnesis: applied.anamnesis ?? prev.anamnesis,
        physicalExamination: applied.physicalExamination ?? prev.physicalExamination,
        diagnosis: applied.diagnosis ?? prev.diagnosis,
        treatmentPlan: applied.treatmentPlan ?? prev.treatmentPlan,
        clinicalNotes: applied.clinicalNotes ?? prev.clinicalNotes,
        appointmentReason: (applied.appointmentReason || prev.appointmentReason) as AppointmentReason | "",
        podiatryExam: applied.podiatryExam ?? prev.podiatryExam,
        customSections: applied.customSections ?? prev.customSections,
      }));
      return true;
    },
    [sessionTemplates, formData]
  );

  const handleTemplateSelect = (templateId: string) => {
    if (!templateId) {
      setSelectedTemplateId("");
      setAppliedTemplateLayout(null);
      return;
    }
    if (applyTemplateById(templateId)) {
      setSelectedTemplateId(templateId);
    }
  };

  const handleRescheduleNextAppointment = (session: ClinicalSession) => {
    // Open the session edit form so user can edit the next appointment date
    setEditingSession(session);
    setSelectedTemplateId("");
    setAppliedTemplateLayout(null);
    setFormData({
      patientId: session.patientId,
      sessionDate: session.sessionDate,
      ...vitalsFromSession(session),
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
      customSections: session.customSections ?? {},
    });
    setShowForm(true);
    setTimeout(() => {
      const form = document.querySelector('[data-session-form]');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  
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
    if (isClinicAdmin) setLocation("/clinic");
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
      
      const brandInk = getBrandCssVar("--brand-ink", "#1a1a1a");
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
              color: ${brandInk};
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
  const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  const [prescriptionFormError, setPrescriptionFormError] = useState<string | null>(null);
  const [prescriptionFormContext, setPrescriptionFormContext] = useState<{
    patientName: string;
    patientDni: string;
    patientAgeYears: number | null;
    podiatristName: string;
  } | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionFormData>(EMPTY_PRESCRIPTION_FORM);

  useEffect(() => {
    if (!showPrescriptionForm || !selectedSession || !user) return;
    setPrescriptionFormError(null);

    void (async () => {
      await ensurePatientLoaded(selectedSession.patientId);
      let patient = getPatientById(selectedSession.patientId);
      if (!patient) {
        const fetched = await fetchPatientById(selectedSession.patientId);
        if (fetched) {
          setPatientCache((prev) => ({ ...prev, [fetched.id]: fetched }));
          patient = fetched;
        }
      }

      let cedula = "";
      const licenseRes = await api.get<{ success?: boolean; license?: string }>(
        `/professionals/license/${user.id}`
      );
      if (licenseRes.success && licenseRes.data?.license) {
        cedula = licenseRes.data.license;
      }

      const infoRes = await api.get<{
        success?: boolean;
        info?: { professionalLicense?: string };
      }>(`/professionals/info/${user.id}`);
      if (infoRes.success && infoRes.data?.info?.professionalLicense) {
        cedula = infoRes.data.info.professionalLicense;
      }

      if (user.clinicId) {
        const credRes = await api.get<{
          success?: boolean;
          credentials?: { cedula?: string };
        }>(`/professionals/credentials/${user.id}`);
        if (credRes.success && credRes.data?.credentials?.cedula) {
          cedula = credRes.data.credentials.cedula;
        }
      }

      const patientName = patient
        ? `${patient.firstName} ${patient.lastName}`.trim()
        : getPatientName(selectedSession.patientId);
      const patientDni = patient?.idNumber?.trim() || patient?.curp?.trim() || "—";
      const patientAgeYears = computeAgeYears(patient?.dateOfBirth);

      setPrescriptionFormContext({
        patientName,
        patientDni,
        patientAgeYears,
        podiatristName: user.name || "",
      });

      setPrescriptionData((prev) => ({
        ...prev,
        podiatristCedula: prev.podiatristCedula.trim() || cedula,
        patientWeightKg:
          prev.patientWeightKg.trim() ||
          patientVitalToFormValue(selectedSession.patientWeightKg) ||
          patientVitalToFormValue(patient?.weightKg),
        patientHeightCm:
          prev.patientHeightCm.trim() ||
          patientVitalToFormValue(selectedSession.patientHeightCm) ||
          patientVitalToFormValue(patient?.heightCm),
      }));
    })();
  }, [showPrescriptionForm, selectedSession, user, ensurePatientLoaded, getPatientById, getPatientName]);

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
      compressImageForSession(file).catch((err) => {
        if (err instanceof Error && err.message.includes("demasiado pesada")) {
          throw err;
        }
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
          reader.readAsDataURL(file);
        });
      });

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

  const sessionSaveErrorMessage = (response: { error?: string; message?: string; data?: { message?: string } }) =>
    response.message || response.data?.message || response.error || "No se pudo guardar la sesión.";

  const handleSubmit = async (e: React.FormEvent, asDraft: boolean) => {
    e.preventDefault();
  setGraceError(null);
    
    if (!formData.patientId) {
      alert("Seleccione un paciente.");
      return;
    }

    const finalizedExam = finalizePodiatryExamination(formData.podiatryExam);
    const finalizedCustomSections = finalizeCustomSections(formData.customSections, sessionFormLayout);

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
      patientWeightKg: normalizePatientVital(formData.patientWeightKg),
      patientHeightCm: normalizePatientVital(formData.patientHeightCm),
      ...finalizedExam,
      customSections: finalizedCustomSections,
    };

    try {
      let completedSessionId: string | null = null;
      let auditPayload: Parameters<typeof postAuditLog>[0] | null = null;

      if (editingSession) {
        const response = await api.put<{ success: boolean; session: ClinicalSession }>(
          `/sessions/${editingSession.id}`,
          {
            ...sessionData,
            completedAt: asDraft ? null : new Date().toISOString(),
          }
        );

        if (response.success && response.data?.success) {
          completedSessionId = editingSession.id;
          invalidateClinicalListCache();
          void reloadClinicalLists();

          const patient = getPatientById(editingSession.patientId);
          auditPayload = {
            action: asDraft ? "UPDATE_DRAFT" : "COMPLETE",
            resourceType: "session",
            resourceId: editingSession.id,
            details: {
              sessionId: editingSession.id,
              patientId: editingSession.patientId,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
              status: asDraft ? "draft" : "completed",
            },
          };
        } else {
          alert(sessionSaveErrorMessage(response));
          return;
        }
      } else {
        const response = await api.post<{ success: boolean; session: ClinicalSession }>(
          "/sessions",
          sessionData
        );

        if (response.success && response.data?.success) {
          const newSession = response.data.session;
          completedSessionId = newSession.id;
          invalidateClinicalListCache();
          void reloadClinicalLists();

          const patient = getPatientById(newSession.patientId);
          auditPayload = {
            action: "CREATE",
            resourceType: "session",
            resourceId: newSession.id,
            details: {
              sessionId: newSession.id,
              patientId: newSession.patientId,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
              status: asDraft ? "draft" : "completed",
            },
          };
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

          alert(sessionSaveErrorMessage(response));
          return;
        }
      }

      const savedPatientId = formData.patientId;
      if (savedPatientId) invalidatePatientDetailCache(savedPatientId);
      closeSessionForm();

      if (!asDraft && isPodiatrist && completedSessionId && savedPatientId) {
        const patient = getPatientById(savedPatientId);
        setCheckoutPrompt({
          patientId: savedPatientId,
          patientName: patient
            ? `${patient.firstName} ${patient.lastName}`.trim()
            : getPatientName(savedPatientId),
          sessionId: completedSessionId,
        });
      }

      if (auditPayload) {
        void postAuditLog(auditPayload);
      }
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
    setAppliedTemplateLayout(null);
    setFormData({
      patientId: s.patientId,
      sessionDate: s.sessionDate,
      ...vitalsFromSession(s),
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
    void fetchPatientById(s.patientId).then((p) => setFormSelectedPatient(p));
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
        invalidateClinicalListCache();
        void reloadClinicalLists();
        
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
    await ensurePatientLoaded(session.patientId);
    let patient = getPatientById(session.patientId);
    if (!patient) {
      const fetched = await fetchPatientById(session.patientId);
      if (fetched) {
        setPatientCache((prev) => ({ ...prev, [fetched.id]: fetched }));
        patient = fetched;
      }
    }
    if (!patient) return;

    void api.post("/compliance/record-access", { patientId: patient.id, action: "print" });
    
    const clinicLogo = await preparePrintLogo(await loadLogoForCurrentUser());
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
    const historyRes = await api.get<{ success?: boolean; sessions?: ClinicalSession[] }>(
      `/sessions?patient=${encodeURIComponent(patient.id)}&limit=200`
    );
    const patientSessions = (historyRes.success && historyRes.data?.sessions
      ? historyRes.data.sessions
      : [session]
    ).sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    const latestSession = patientSessions[0] ?? session;

    const printPreferences = await getPrintPreferences();

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
      preferences: printPreferences,
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

  const handleCreatePrescription = async () => {
    if (!selectedSession || !user) return;
    if (!canCreatePrescriptions(user.role)) return;

    const prescriptionText =
      prescriptionData.prescriptionText.trim() || prescriptionData.medications.trim();
    if (!prescriptionText) {
      setPrescriptionFormError(
        "Escribe las indicaciones en «Prescripción / Indicaciones» o en «Medicamentos / Tratamientos»."
      );
      return;
    }

    const medications = prescriptionData.prescriptionText.trim()
      ? prescriptionData.medications.trim()
      : "";

    setPrescriptionFormError(null);
    setPrescriptionSaving(true);

    await ensurePatientLoaded(selectedSession.patientId);
    let patient = getPatientById(selectedSession.patientId);
    if (!patient) {
      const fetched = await fetchPatientById(selectedSession.patientId);
      if (fetched) {
        setPatientCache((prev) => ({ ...prev, [fetched.id]: fetched }));
        patient = fetched;
      }
    }
    if (!patient) {
      setPrescriptionSaving(false);
      setPrescriptionFormError(
        "No se pudieron cargar los datos del paciente. Cierra el formulario, abre la sesión de nuevo e inténtalo otra vez."
      );
      return;
    }

    let license: string | null = null;
    const licenseRes = await api.get<{ success?: boolean; license?: string }>(
      `/professionals/license/${user.id}`
    );
    if (licenseRes.success && licenseRes.data?.license) {
      license = licenseRes.data.license;
    }
    const infoRes = await api.get<{
      success?: boolean;
      info?: { professionalLicense?: string };
    }>(`/professionals/info/${user.id}`);
    if (infoRes.success && infoRes.data?.info?.professionalLicense) {
      license = infoRes.data.info.professionalLicense;
    }

    const patientAgeYears =
      computeAgeYears(patient.dateOfBirth) ?? prescriptionFormContext?.patientAgeYears ?? null;
    const patientWeightKg = prescriptionData.patientWeightKg.trim() || null;
    const patientHeightCm = prescriptionData.patientHeightCm.trim() || null;
    const podiatristCedula = prescriptionData.podiatristCedula.trim() || license;

    const res = await api.post<{
      success?: boolean;
      prescription?: Prescription;
      message?: string;
      issues?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
    }>(
      "/prescriptions",
      {
        sessionId: selectedSession.id,
        patientName: `${patient.firstName} ${patient.lastName}`.trim(),
        patientDob: patient.dateOfBirth?.trim() || "—",
        patientDni: patient.idNumber?.trim() || patient.curp?.trim() || "—",
        patientAgeYears,
        patientWeightKg,
        patientHeightCm,
        podiatristName: user.name?.trim() || prescriptionFormContext?.podiatristName || "Profesional",
        podiatristLicense: license,
        podiatristCedula,
        prescriptionText,
        medications,
        nextVisitDate: prescriptionData.nextVisitDate || null,
        notes: prescriptionData.notes,
      }
    );

    setPrescriptionSaving(false);

    if (!res.success || !res.data?.prescription) {
      setPrescriptionFormError(
        formatPrescriptionApiError(res.error, res.message, res.data?.issues)
      );
      return;
    }

    setSessionPrescriptions((prev) => [...prev, res.data!.prescription!]);
    setPrescriptionData(EMPTY_PRESCRIPTION_FORM);
    setPrescriptionFormContext(null);
    setPrescriptionFormError(null);
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
    const clinicLogo = await preparePrintLogo(await loadLogoForCurrentUser());
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
      const pr = await api.get<{ success?: boolean; info?: ProfRow }>(`/professionals/info/${user.id}`);
      if (pr.success && pr.data?.info) profInfo = pr.data.info;
    }
    let credentials: { cedula?: string; registro?: string } | null = null;
    if (user?.id && user?.clinicId) {
      const cred = await api.get<{ success?: boolean; credentials?: { cedula?: string; registro?: string } }>(
        `/professionals/credentials/${user.id}`
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
    const podiatristCedula =
      prescription.podiatristCedula ||
      credentials?.cedula ||
      profInfo?.professionalLicense ||
      prescription.podiatristLicense ||
      "";
    const podiatristRegistro = credentials?.registro || "";
    const prefs = await getPrintPreferences();

    const opened = openPrescriptionPrint({
      prescription,
      prefs,
      context: {
        clinicName,
        clinicPhone,
        clinicEmail,
        clinicAddress,
        clinicLicenseNumber,
        clinicLogo: clinicLogo || undefined,
        podiatristCedula,
        podiatristRegistro,
      },
    });
    if (!opened) return;

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

  if (isClinicAdmin) return null;

  return (
    <MainLayout title={t.sessions.title}>
      {/* Session Detail Modal */}
      {selectedSession && (
        <AppModal open onClose={() => setSelectedSession(null)} maxWidth="3xl">
            <AppModalHeader>
              <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-brand-ink truncate">
                  {t.sessions.sessionDetails}
                </h3>
                <p className="text-sm text-gray-500 truncate">{getPatientName(selectedSession.patientId)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`whitespace-nowrap ${
                  selectedSession.status === "completed"
                    ? semanticChipSuccessClass
                    : semanticChipWarningClass
                }`}>
                  {selectedSession.status === "completed" ? t.sessions.completed : t.sessions.draft}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="p-2 hover:bg-brand-canvas rounded-lg transition-colors"
                  aria-label="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              </div>
            </AppModalHeader>
            
            <AppModalBody className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t.sessions.sessionDate}</p>
                <p className="font-medium">{formatDate(selectedSession.sessionDate)}</p>
              </div>
              
              {showClinicalSection("anamnesis") && selectedSession.anamnesis && (
                <div>
                  <h4 className="font-medium text-brand-ink mb-2">
                    {getSectionLabel(clinicalLayout, "anamnesis")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.anamnesis}</p>
                </div>
              )}

              {Object.values(podiatryVisibleBlocks).some(Boolean) && (
              <div>
                <h4 className="font-medium text-brand-ink mb-3">Exploración podológica</h4>
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
                  <h4 className="font-medium text-brand-ink mb-2">
                    {getSectionLabel(clinicalLayout, "physical_examination")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.physicalExamination}</p>
                </div>
              )}
              
              {showClinicalSection("diagnosis") && selectedSession.diagnosis && (
                <div>
                  <h4 className="font-medium text-brand-ink mb-2">
                    {getSectionLabel(clinicalLayout, "diagnosis")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.diagnosis}</p>
                </div>
              )}
              
              {showClinicalSection("treatment_plan") && selectedSession.treatmentPlan && (
                <div>
                  <h4 className="font-medium text-brand-ink mb-2">
                    {getSectionLabel(clinicalLayout, "treatment_plan")}
                  </h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedSession.treatmentPlan}</p>
                </div>
              )}
              
              {showClinicalSection("clinical_notes") && selectedSession.clinicalNotes && (
                <div>
                  <h4 className="font-medium text-brand-ink mb-2">
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
                <h4 className="font-medium text-brand-ink mb-2">{t.sessions.images}</h4>
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                    <h4 className="font-medium text-brand-ink">Recetas / Prescripciones</h4>
                    <button
                      onClick={() => {
                        setPrescriptionData(EMPTY_PRESCRIPTION_FORM);
                        setPrescriptionFormContext(null);
                        setPrescriptionFormError(null);
                        setShowPrescriptionForm(true);
                      }}
                      className="self-start sm:self-auto flex items-center gap-1 text-sm text-brand-ink hover:underline font-medium"
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
                        <div
                          key={rx.id}
                          className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-brand-ink">Folio: {rx.folio}</p>
                            <p className={`text-xs ${formHintClass}`}>
                              {new Date(rx.prescriptionDate).toLocaleDateString("es-ES")}
                            </p>
                            {rx.medications && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2 sm:truncate">
                                Medicamentos: {rx.medications}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePrintPrescription(rx)}
                            className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-brand-ink text-brand-ink-fg text-xs rounded-lg hover:bg-brand-ink-hover transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            {t.common.print}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No hay recetas para esta sesión</p>
                  )}
                </div>
              )}

            </AppModalBody>

            <AppModalFooter>
              <div className="flex flex-col sm:flex-row gap-3">
                {selectedSession.status === "draft" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSession(null);
                      handleEdit(selectedSession);
                    }}
                    className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    {t.common.edit}
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleExport(selectedSession)}
                    className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    {t.common.export} JSON
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handlePrint(selectedSession)}
                  className="flex-1 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium text-sm"
                >
                  {t.common.print}
                </button>
              </div>
            </AppModalFooter>
        </AppModal>
      )}
      
      {/* Prescription Form Modal - Only accessible for podiatrists */}
      {showPrescriptionForm && selectedSession && canCreatePrescriptions(user?.role) && (
        <AppModal
          open
          onClose={() => {
            setShowPrescriptionForm(false);
            setPrescriptionFormError(null);
            setPrescriptionFormContext(null);
            setPrescriptionData(EMPTY_PRESCRIPTION_FORM);
          }}
          maxWidth="xl"
          zIndex={60}
        >
            <AppModalHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-brand-ink">Nueva Receta</h3>
                  <p className="text-sm text-gray-500 truncate mt-1">
                    Paciente: {getPatientName(selectedSession.patientId)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrescriptionForm(false);
                    setPrescriptionFormError(null);
                    setPrescriptionFormContext(null);
                    setPrescriptionData(EMPTY_PRESCRIPTION_FORM);
                  }}
                  className="p-2 hover:bg-brand-canvas rounded-lg transition-colors flex-shrink-0"
                  aria-label="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </AppModalHeader>
            
            <AppModalBody className="space-y-5">
              <section className="rounded-lg border border-brand-border bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-brand-ink">Datos del paciente</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-0.5">Nombre</span>
                    <p className="text-brand-ink">
                      {prescriptionFormContext?.patientName ?? getPatientName(selectedSession.patientId)}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-0.5">DNI / CURP</span>
                    <p className="text-brand-ink">
                      {prescriptionFormContext?.patientDni ?? "—"}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-0.5">Edad</span>
                    <p className="text-brand-ink">
                      {formatPrescriptionAge(prescriptionFormContext?.patientAgeYears)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-brand-muted mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={prescriptionData.patientWeightKg}
                      onChange={(e) =>
                        setPrescriptionData((prev) => ({ ...prev, patientWeightKg: e.target.value }))
                      }
                      placeholder="Ej. 72.5"
                      className="w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted mb-1">
                      Estatura (cm)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={prescriptionData.patientHeightCm}
                      onChange={(e) =>
                        setPrescriptionData((prev) => ({ ...prev, patientHeightCm: e.target.value }))
                      }
                      placeholder="Ej. 165"
                      className="w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-brand-border bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-brand-ink">Datos del profesional</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 mb-0.5">Profesional</span>
                    <p className="text-brand-ink">
                      {prescriptionFormContext?.podiatristName || user?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-muted mb-1">
                      Cédula profesional
                    </label>
                    <input
                      type="text"
                      value={prescriptionData.podiatristCedula}
                      onChange={(e) =>
                        setPrescriptionData((prev) => ({ ...prev, podiatristCedula: e.target.value }))
                      }
                      placeholder="Número de cédula"
                      className="w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent"
                    />
                  </div>
                </div>
              </section>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prescripción / Indicaciones *
                </label>
                <textarea
                  value={prescriptionData.prescriptionText}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, prescriptionText: e.target.value }))}
                  rows={4}
                  placeholder="Describa las indicaciones y recomendaciones para el paciente..."
                  className="w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent resize-none"
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
                  className="w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent resize-none"
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
                  className="w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent"
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
                  className="w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent resize-none"
                />
              </div>

              {prescriptionFormError && (
                <p className={formErrorClass} role="alert">
                  {prescriptionFormError}
                </p>
              )}
            </AppModalBody>
            
            <AppModalFooter>
              <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPrescriptionForm(false);
                  setPrescriptionFormError(null);
                  setPrescriptionFormContext(null);
                  setPrescriptionData(EMPTY_PRESCRIPTION_FORM);
                }}
                className="flex-1 py-2.5 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleCreatePrescription()}
                disabled={
                  prescriptionSaving ||
                  (!prescriptionData.prescriptionText.trim() && !prescriptionData.medications.trim())
                }
                className="flex-1 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {prescriptionSaving ? "Creando…" : "Crear Receta"}
              </button>
              </div>
              {!prescriptionData.prescriptionText.trim() && !prescriptionData.medications.trim() && (
                <p className="text-xs text-gray-500 mt-2">
                  Completa al menos «Prescripción / Indicaciones» o «Medicamentos / Tratamientos».
                </p>
              )}
            </AppModalFooter>
        </AppModal>
      )}

      {/* Session Form Modal */}
      {showForm && (
        <AppModal open onClose={closeSessionForm} maxWidth="3xl" panelId="session-form-panel">
            <AppModalHeader>
              <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg sm:text-xl font-semibold text-brand-ink min-w-0 truncate">
                {editingSession ? t.sessions.editSession : t.sessions.newSession}
              </h3>
              <button
                type="button"
                onClick={closeSessionForm}
                className="p-2 hover:bg-brand-canvas rounded-lg transition-colors flex-shrink-0"
                aria-label={t.common.close}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              </div>
            </AppModalHeader>

            <AppModalBody>
            <form className="space-y-6" data-session-form>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`${formLabelClass} mb-1`}>
                    {t.sessions.selectPatient} *
                  </label>
                  {patientPickerMode === "loading" ? (
                    <p className={`text-sm ${formHintClass} py-2`}>Cargando pacientes…</p>
                  ) : patientPickerMode === "search" ? (
                    <PatientSearchSelect
                      value={formData.patientId}
                      onChange={(patientId) => {
                        setFormData((prev) => ({ ...prev, patientId }));
                        if (!editingSession) {
                          void fetchPatientById(patientId).then((p) => {
                            setFormSelectedPatient(p);
                            if (p) {
                              setFormData((prev) =>
                                prev.patientId === patientId ? { ...prev, ...vitalsFromPatient(p) } : prev
                              );
                            }
                          });
                        }
                      }}
                      onPatientChange={(patient) => {
                        setFormSelectedPatient(patient);
                        if (!editingSession && patient) {
                          setFormData((prev) =>
                            prev.patientId === patient.id ? { ...prev, ...vitalsFromPatient(patient) } : prev
                          );
                        }
                      }}
                      disabled={!!editingSession}
                      required
                      placeholder={t.patients.searchPatients}
                      isPatientEligible={isPatientCompleteForSessions}
                    />
                  ) : (
                    <select
                      required
                      value={formData.patientId}
                      onChange={(e) => {
                        const patientId = e.target.value;
                        setFormData((prev) => ({ ...prev, patientId }));
                        const p = sessionFormPatients.find((x) => x.id === patientId) ?? null;
                        setFormSelectedPatient(p);
                        if (!editingSession) {
                          if (p?.weightKg != null || p?.heightCm != null) {
                            setFormData((prev) =>
                              prev.patientId === patientId ? { ...prev, ...vitalsFromPatient(p) } : prev
                            );
                          } else if (patientId) {
                            void fetchPatientById(patientId).then((fetched) => {
                              if (fetched) {
                                setFormSelectedPatient(fetched);
                                setFormData((prev) =>
                                  prev.patientId === patientId ? { ...prev, ...vitalsFromPatient(fetched) } : prev
                                );
                              }
                            });
                          }
                        }
                      }}
                      className={formFieldClassSm}
                      disabled={!!editingSession}
                    >
                      <option value="">Seleccionar...</option>
                      {sessionFormPatients
                        .filter(
                          (p) =>
                            isPatientCompleteForSessions(p) ||
                            (editingSession && p.id === editingSession.patientId)
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                            {!isPatientCompleteForSessions(p) ? " (datos incompletos)" : ""}
                          </option>
                        ))}
                    </select>
                  )}
                  {formData.patientId && (() => {
                    const p =
                      formSelectedPatient ??
                      sessionFormPatients.find((x) => x.id === formData.patientId);
                    return p && !isPatientCompleteForSessions(p);
                  })() && (
                    <div className={`mt-2 ${semanticAlertWarningClass} space-y-2`}>
                      <p className="text-sm">
                        Faltan datos obligatorios del paciente (nombre, apellido, fecha nacimiento, género, DNI). Para menores use el DNI del padre/tutor. <strong>Edite la ficha del paciente</strong> para poder guardar la sesión.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(`/patients?id=${formData.patientId}`, "_blank")}
                          className="px-4 py-2 bg-brand-ink text-brand-ink-fg text-sm font-medium rounded-lg hover:bg-brand-ink-hover transition-colors"
                        >
                          Editar paciente →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.patientId) invalidatePatientDetailCache(formData.patientId);
                            void reloadPickerPatients();
                            void fetchPatientById(formData.patientId).then((p) => setFormSelectedPatient(p));
                          }}
                          className="px-4 py-2 bg-brand-surface border border-semantic-warning text-semantic-warning text-sm font-medium rounded-lg hover:bg-semantic-warning-bg transition-colors"
                        >
                          Actualizar datos (si ya editó el paciente)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className={`${formLabelClass} mb-1`}>
                    {t.sessions.sessionDate} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.sessionDate}
                    onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                    className={formFieldClassSm}
                  />
                </div>
              </div>

              <div className={`${formPanelMutedClass} space-y-3`}>
                <p className={`${formLabelClass}`}>Signos vitales (opcional)</p>
                <p className={`text-sm ${formHintClass}`}>
                  Se guarda en esta sesión y actualiza el expediente del paciente.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`${formLabelClass} mb-1`}>Peso (kg)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.patientWeightKg}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, patientWeightKg: e.target.value }))
                      }
                      placeholder="Ej. 72.5"
                      className={formFieldClassSm}
                    />
                  </div>
                  <div>
                    <label className={`${formLabelClass} mb-1`}>Estatura (cm)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.patientHeightCm}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, patientHeightCm: e.target.value }))
                      }
                      placeholder="Ej. 165"
                      className={formFieldClassSm}
                    />
                  </div>
                </div>
              </div>

              <div className={`${formPanelMutedClass} space-y-3`}>
                <div>
                  <label className={`${formLabelClass} mb-1`}>
                    Plantilla de sesión
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-white"
                  >
                    <option value="">Sin plantilla</option>
                    {sessionTemplates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                        {tpl.isShared ? " (consultorio)" : " (personal)"}
                      </option>
                    ))}
                  </select>
                </div>
                {sessionTemplates.length === 0 ? (
                  <p className={`text-xs ${formHintClass}`}>
                    No hay plantillas. Créalas en{" "}
                    <a href="/clinical-tools" className="underline text-brand-ink">
                      Herramientas clínicas
                    </a>
                    .
                  </p>
                ) : (
                  <p className={`text-xs ${formHintClass}`}>
                    Al elegir una plantilla se aplican automáticamente el contenido y las secciones visibles
                    (p. ej. sin helomas en procedimientos quirúrgicos).
                  </p>
                )}
                {appliedTemplateLayout ? (
                  <p className={`text-xs ${formHintClass}`}>
                    Vista filtrada por plantilla: {countIncludedTemplateSections(appliedTemplateLayout)}{" "}
                    secciones visibles. Elige «Sin plantilla» para ver el formulario completo.
                  </p>
                ) : selectedTemplateId ? (
                  <p className={`text-xs ${formWarningClass}`}>
                    Esta plantilla no tiene secciones definidas. Edítala en Herramientas clínicas, marca qué
                    incluir y guarda de nuevo.
                  </p>
                ) : null}
              </div>

              {Object.values(sessionFormPodiatryBlocks).some(Boolean) && (
              <PodiatryExaminationFields
                value={formData.podiatryExam}
                onChange={(podiatryExam) => setFormData((prev) => ({ ...prev, podiatryExam }))}
                visibleBlocks={sessionFormPodiatryBlocks}
              />
              )}

              {showSessionFormSection("anamnesis") && (
              <div>
                <label className={`${formLabelClass} mb-1`}>
                  {getSectionLabel(sessionFormLayout, "anamnesis")}
                </label>
                <textarea
                  rows={3}
                  value={formData.anamnesis}
                  onChange={(e) => setFormData({ ...formData, anamnesis: e.target.value })}
                  className={formFieldResizeClass}
                  placeholder="Motivo de consulta, antecedentes..."
                />
              </div>
              )}

              {showSessionFormSection("physical_examination") && (
              <div>
                <label className={`${formLabelClass} mb-1`}>
                  {getSectionLabel(sessionFormLayout, "physical_examination")}
                </label>
                <textarea
                  rows={3}
                  value={formData.physicalExamination}
                  onChange={(e) => setFormData({ ...formData, physicalExamination: e.target.value })}
                  className={formFieldResizeClass}
                  placeholder="Hallazgos de la exploración..."
                />
              </div>
              )}

              {showSessionFormSection("diagnosis") && (
              <div>
                <label className={`${formLabelClass} mb-1`}>
                  {getSectionLabel(sessionFormLayout, "diagnosis")}
                </label>
                <textarea
                  rows={2}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className={formFieldResizeClass}
                  placeholder="Diagnóstico podológico..."
                />
              </div>
              )}

              {showSessionFormSection("treatment_plan") && (
              <div>
                <label className={`${formLabelClass} mb-1`}>
                  {getSectionLabel(sessionFormLayout, "treatment_plan")}
                </label>
                <textarea
                  rows={3}
                  value={formData.treatmentPlan}
                  onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                  className={formFieldResizeClass}
                  placeholder="Plan de tratamiento..."
                />
              </div>
              )}

              {showSessionFormSection("clinical_notes") && (
              <div>
                <label className={`${formLabelClass} mb-1`}>
                  {getSectionLabel(sessionFormLayout, "clinical_notes")}
                </label>
                <textarea
                  rows={2}
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  className={formFieldResizeClass}
                  placeholder="Notas adicionales..."
                />
              </div>
              )}

              <SessionCustomSectionsFields
                layoutSections={sessionFormLayout.sections}
                value={formData.customSections}
                onChange={(customSections) => setFormData((prev) => ({ ...prev, customSections }))}
              />

              {showSessionFormSection("session_images") && (
              <div>
                <label className={`${formLabelClass} mb-2`}>
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
                  <p className={`text-xs ${formErrorClass} mt-2`}>{imageUploadError}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">{t.sessions.maxImages}</p>
              </div>
              )}

              {/* Follow-up Section */}
              <div className="border-t border-brand-border pt-6">
                <h4 className="text-sm font-semibold text-brand-ink mb-4">Seguimiento</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`${formLabelClass} mb-1`}>
                      Próxima cita
                    </label>
                    <input
                      type="date"
                      value={formData.nextAppointmentDate}
                      onChange={(e) => setFormData({ ...formData, nextAppointmentDate: e.target.value })}
                      className={formFieldClassSm}
                    />
                  </div>
                  <div>
                    <label className={`${formLabelClass} mb-1`}>
                      Motivo de la cita
                    </label>
                    <select
                      value={formData.appointmentReason}
                      onChange={(e) => setFormData({ ...formData, appointmentReason: e.target.value as AppointmentReason })}
                      className={formFieldClassSm}
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
                  <label className={`${formLabelClass} mb-1`}>
                    Instrucciones de seguimiento
                  </label>
                  <textarea
                    rows={2}
                    value={formData.followUpNotes}
                    onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                    className={formFieldClassSm}
                    placeholder="Instrucciones para el paciente, medicación, cuidados..."
                  />
                </div>
              </div>

              {/* Actions */}
              {(() => {
                const selectedPatient =
                  formSelectedPatient ??
                  sessionFormPatients.find((x) => x.id === formData.patientId);
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
                      <p className={`text-sm ${semanticAlertWarningClass}`}>
                        Para guardar borrador o completar la sesión, primero complete los datos del paciente y haga clic en &quot;Actualizar datos&quot; arriba.
                      </p>
                    )}
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
                            No puedes crear nuevas sesiones en este momento
                          </p>
                          <p className="mt-1 text-sm">
                            {graceError}
                          </p>
                        </div>
                      </div>
                    )}
                    {isPodiatrist && canSave && (
                      <p className="text-xs text-brand-muted text-center leading-snug px-1">
                        {t.sessions.checkoutCompleteHint}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeSessionForm}
                        className="flex-1 py-3 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        disabled={!canSave}
                        title={disableReason}
                        className="flex-1 py-3 bg-brand-canvas text-brand-ink rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.sessions.saveDraft}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        disabled={!canSave}
                        title={disableReason}
                        className="flex-1 py-3 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.sessions.complete}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </form>
            </AppModalBody>
        </AppModal>
      )}

      {checkoutPrompt && (
        <CheckoutHandoffModal
          open
          zIndex={60}
          patientId={checkoutPrompt.patientId}
          patientName={checkoutPrompt.patientName}
          sessionId={checkoutPrompt.sessionId}
          onClose={() => setCheckoutPrompt(null)}
        />
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
                className="w-full pl-10 pr-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "draft" | "completed")}
              className="px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
            >
              <option value="all">Todas</option>
              <option value="draft">{t.sessions.draft}</option>
              <option value="completed">{t.sessions.completed}</option>
            </select>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium flex items-center gap-2"
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
        {clinicalListError && (
          <ClinicalListError message={clinicalListError} onRetry={() => void reloadClinicalLists()} />
        )}
        {clinicalListLoading && sessions.length === 0 ? (
          <ClinicalListLoading label="Cargando sesiones…" />
        ) : sessions.length === 0 ? (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-12 text-center">
            <div className="w-16 h-16 bg-brand-canvas rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.sessions.noSessions}</h3>
            <p className="text-brand-muted mb-6">Crea tu primera sesión clínica</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg hover:bg-brand-ink-hover transition-colors font-medium"
            >
              {t.sessions.newSession}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-brand-surface rounded-xl border border-brand-border p-5 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => void openSessionDetail(session)}>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-medium text-brand-ink truncate max-w-full">
                        {getPatientName(session.patientId)}
                      </h4>
                      <span className={
                        session.status === "completed"
                          ? semanticChipSuccessClass
                          : semanticChipWarningClass
                      }>
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
                    <p className="text-sm text-brand-muted mb-2">{formatDate(session.sessionDate)}</p>
                    {session.diagnosis && (
                      <p className="text-sm text-brand-muted line-clamp-2">{session.diagnosis}</p>
                    )}
                    {session.nextAppointmentDate && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        📅 Próxima cita: {new Date(session.nextAppointmentDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
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
            {sessionsHasMore && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => loadMoreSessions()}
                  disabled={sessionsLoadingMore}
                  className="px-6 py-2.5 border border-brand-border rounded-lg text-sm font-medium text-brand-ink hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {sessionsLoadingMore ? "Cargando…" : "Cargar más sesiones"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SessionsPage;
