import { useState, useRef, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { ProfessionalInfo, type Clinic } from "../lib/storage";
import { api } from "../lib/api-client";

interface ClinicInfoForm {
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  licenseNumber: string;
  website: string;
  consentText: string;
}

// Nombre de clínica desde datos cargados o fallback
const getClinicNameFrom = (clinic: Clinic | null, clinicId: string): string =>
  clinic?.clinicName ?? (clinicId ? `Clínica ${clinicId}` : "");

// Get logo for a user (considering clinic membership) - exported for PDF/async use (API)
export async function getLogoForUser(userId: string, clinicId?: string): Promise<string | null> {
  if (clinicId) {
    const r = await api.get<{ success?: boolean; logo?: string | null }>(`/clinics/${clinicId}/logo`);
    if (r.success && r.data?.logo) return r.data.logo;
  }
  const r = await api.get<{ success?: boolean; logo?: string | null }>(`/professionals/logo/${userId}`);
  if (r.success && r.data?.logo) return r.data.logo;
  return null;
}

const SettingsPage = () => {
  const { t, language, setLanguage, languageNames, availableLanguages } = useLanguage();
  const { user, getAllUsers } = useAuth();
  
  // Determine logo ownership based on role
  const canUploadLogo = user?.role === "clinic_admin";
  const isPodiatristWithClinic = user?.role === "podiatrist" && user?.clinicId;
  const isPodiatristIndependent = user?.role === "podiatrist" && !user?.clinicId;
  const isAdminRole = user?.role === "super_admin" || user?.role === "admin";
  const isReceptionist = user?.role === "receptionist";
  
  const [userClinic, setUserClinic] = useState<Clinic | null>(null);
  const [saved, setSaved] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cargar clínica desde API
  useEffect(() => {
    if (!user?.clinicId) {
      setUserClinic(null);
      return;
    }
    api.get<{ success: boolean; clinic?: Record<string, unknown> }>(`/clinics/${user.clinicId}`).then((res) => {
      if (res.success && res.data?.clinic) {
        const c = res.data.clinic as Record<string, unknown>;
        setUserClinic({
          clinicId: String(c.clinicId ?? user.clinicId),
          clinicName: String(c.clinicName ?? ""),
          clinicCode: String(c.clinicCode ?? ""),
          ownerId: String(c.ownerId ?? ""),
          phone: (c.phone as string) ?? "",
          email: (c.email as string) ?? "",
          address: (c.address as string) ?? "",
          city: (c.city as string) ?? "",
          postalCode: (c.postalCode as string) ?? "",
          licenseNumber: (c.licenseNumber as string) ?? "",
          website: (c.website as string) ?? "",
          consentText: (c.consentText as string) ?? "",
          consentTextVersion: (c.consentTextVersion as number) ?? 0,
        } as Clinic);
      }
    }).catch(() => setUserClinic(null));
  }, [user?.clinicId]);
  
  // Cargar logo desde API (clínica o profesional)
  useEffect(() => {
    if (user?.clinicId) {
      api.get<{ success?: boolean; logo?: string | null }>(`/clinics/${user.clinicId}/logo`).then((res) => {
        setCurrentLogo(res.success && res.data?.logo ? res.data.logo : null);
      }).catch(() => setCurrentLogo(null));
    } else if (isPodiatristIndependent && user?.id) {
      api.get<{ success?: boolean; logo?: string | null }>(`/professionals/logo/${user.id}`).then((res) => {
        setCurrentLogo(res.success && res.data?.logo ? res.data.logo : null);
      }).catch(() => setCurrentLogo(null));
    } else {
      setCurrentLogo(null);
    }
  }, [user?.clinicId, user?.id, isPodiatristIndependent]);
  
  // Clinic information form state (for clinic admins)
  const [clinicInfoForm, setClinicInfoForm] = useState<ClinicInfoForm>({
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    licenseNumber: "",
    website: "",
    consentText: "",
  });
  const [clinicInfoSaved, setClinicInfoSaved] = useState(false);
  const [clinicConsentSaved, setClinicConsentSaved] = useState(false);
  const [clinicConsentError, setClinicConsentError] = useState<string | null>(null);
  
  // Professional Info state (for independent podiatrists)
  const [professionalInfoForm, setProfessionalInfoForm] = useState<ProfessionalInfo & { consentDocumentUrl?: string }>({
    name: user?.name || "",
    phone: "",
    email: user?.email || "",
    address: "",
    city: "",
    postalCode: "",
    licenseNumber: "",
    professionalLicense: "",
    consentDocumentUrl: "",
  });
  const [professionalInfoSaved, setProfessionalInfoSaved] = useState(false);
  
  // Professional License state (for all podiatrists)
  const [professionalLicense, setProfessionalLicenseState] = useState<string>("");
  const [licenseSaved, setLicenseSaved] = useState(false);
  
  // Professional Credentials state (for clinic subaltern podiatrists)
  const [credentialsCedula, setCredentialsCedula] = useState<string>("");
  const [credentialsRegistro, setCredentialsRegistro] = useState<string>("");
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  
  // Recepcionista (solo podólogo independiente: una sola recepcionista)
  const [receptionistForm, setReceptionistForm] = useState({ name: "", email: "", password: "" });
  const [receptionistError, setReceptionistError] = useState<string | null>(null);
  const [receptionistSuccess, setReceptionistSuccess] = useState(false);
  const [myReceptionists, setMyReceptionists] = useState<{ id: string; name: string; email: string }[]>([]);
  
  // Recepcionista: edición de podólogos asignados (solo si es de clínica)
  const [assignedPodiatristIds, setAssignedPodiatristIds] = useState<string[]>([]);
  const [assignedPodiatristsSaved, setAssignedPodiatristsSaved] = useState(false);

  // Contact PodoAdmin - mensajería bidireccional con soporte
  const [supportConversations, setSupportConversations] = useState<Array<{
    id: string; subject: string; status: string; createdAt: string; updatedAt: string;
    userName?: string | null; userEmail?: string | null;
  }>>([]);
  const [selectedSupportConv, setSelectedSupportConv] = useState<{
    id: string; subject: string; status: string; messages: Array<{
      id: string; senderId: string; body: string; createdAt: string; readAt: string | null; isFromSupport: boolean;
    }>;
  } | null>(null);
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportReply, setSupportReply] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  
  // Initialize clinic info form from existing clinic data
  useEffect(() => {
    if (userClinic) {
      setClinicInfoForm({
        phone: userClinic.phone || "",
        email: userClinic.email || "",
        address: userClinic.address || "",
        city: userClinic.city || "",
        postalCode: userClinic.postalCode || "",
        licenseNumber: userClinic.licenseNumber || "",
        website: userClinic.website || "",
        consentText: userClinic.consentText || "",
      });
    }
  }, [userClinic]);
  
  // Cargar professional info desde API (podólogos independientes)
  useEffect(() => {
    if (isPodiatristIndependent && user?.id) {
      api.get<{ success?: boolean; info?: ProfessionalInfo | null }>(`/professionals/info/${user.id}`).then((res) => {
        if (res.success && res.data?.info) {
          setProfessionalInfoForm(res.data.info);
        } else {
          setProfessionalInfoForm({
            name: user?.name || "",
            phone: "",
            email: user?.email || "",
            address: "",
            city: "",
            postalCode: "",
            licenseNumber: "",
            professionalLicense: "",
            consentText: "",
          });
        }
      });
    }
  }, [isPodiatristIndependent, user?.id, user?.name, user?.email]);
  
  // Cargar professional license desde API
  useEffect(() => {
    if (user?.role === "podiatrist" && user?.id) {
      api.get<{ success?: boolean; license?: string | null }>(`/professionals/license/${user.id}`).then((res) => {
        if (res.success && res.data?.license != null) setProfessionalLicenseState(res.data.license || "");
      });
    }
  }, [user?.role, user?.id]);
  
  // Cargar podólogos asignados para recepcionista desde API
  useEffect(() => {
    if (isReceptionist && user?.id) {
      api.get<{ success?: boolean; assignedPodiatristIds?: string[] }>(`/receptionists/assigned-podiatrists/${user.id}`).then((res) => {
        if (res.success && Array.isArray(res.data?.assignedPodiatristIds)) {
          setAssignedPodiatristIds(res.data.assignedPodiatristIds);
        }
      });
    }
  }, [isReceptionist, user?.id]);

  // Cargar professional credentials desde API (podólogos de clínica)
  useEffect(() => {
    if (isPodiatristWithClinic && user?.id) {
      api.get<{ success?: boolean; credentials?: { cedula?: string; registro?: string } | null }>(`/professionals/credentials/${user.id}`).then((res) => {
        if (res.success && res.data?.credentials) {
          setCredentialsCedula(res.data.credentials.cedula || "");
          setCredentialsRegistro(res.data.credentials.registro || "");
        }
      });
    }
  }, [isPodiatristWithClinic, user?.id]);

  // Cargar "mis recepcionistas" desde API (podólogo independiente)
  useEffect(() => {
    if (isPodiatristIndependent && user?.id) {
      api.get<{ success?: boolean; receptionists?: { id: string; name: string; email: string }[] }>("/receptionists").then((res) => {
        if (res.success && Array.isArray(res.data?.receptionists)) {
          setMyReceptionists(res.data.receptionists);
        }
      });
    }
  }, [isPodiatristIndependent, user?.id]);

  const clinicName = userClinic?.clinicName ?? getClinicNameFrom(userClinic, user?.clinicId ?? "");
  
  const handleClinicInfoChange = (field: keyof ClinicInfoForm, value: string) => {
    setClinicInfoForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveClinicInfo = async () => {
    if (!canUploadLogo || !user?.clinicId) return;
    try {
      const res = await api.patch<{ success?: boolean; clinic?: Clinic }>(`/clinics/${user.clinicId}`, {
        phone: clinicInfoForm.phone,
        email: clinicInfoForm.email,
        address: clinicInfoForm.address,
        city: clinicInfoForm.city,
        postalCode: clinicInfoForm.postalCode,
        licenseNumber: clinicInfoForm.licenseNumber,
        website: clinicInfoForm.website,
        consentText: clinicInfoForm.consentText || null,
      });
      if (res.success && res.data?.clinic) {
        setUserClinic(res.data.clinic as Clinic);
        setClinicInfoSaved(true);
        setTimeout(() => setClinicInfoSaved(false), 2000);
      }
    } catch (err) {
      // Error ya se muestra en consola desde api-client; no marcamos como guardado
    }
  };

  const handleSaveClinicConsent = async () => {
    if (!canUploadLogo || !user?.clinicId) return;
    setClinicConsentError(null);
    try {
      const res = await api.patch<{ success?: boolean; clinic?: Clinic }>(`/clinics/${user.clinicId}`, {
        consentText: (clinicInfoForm.consentText ?? "").trim() || null,
      });
      const clinic = res.data?.clinic ?? (res.data as { clinic?: Clinic } | undefined)?.clinic;
      if (res.success && clinic) {
        setUserClinic(clinic as Clinic);
        setClinicConsentSaved(true);
        setClinicConsentError(null);
        setTimeout(() => setClinicConsentSaved(false), 2000);
      } else {
        setClinicConsentError(res.message ?? res.error ?? "Error al guardar el consentimiento.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de conexión al guardar.";
      setClinicConsentError(message);
    }
  };
  
  // Professional info handlers (for independent podiatrists) - persistencia vía API
  const handleProfessionalInfoChange = (field: keyof ProfessionalInfo, value: string) => {
    setProfessionalInfoForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveProfessionalInfo = async () => {
    if (!isPodiatristIndependent || !user?.id) return;
    try {
      const res = await api.put<{ success?: boolean }>(`/professionals/info/${user.id}`, professionalInfoForm);
      if (res.success) {
        setProfessionalInfoSaved(true);
        setTimeout(() => setProfessionalInfoSaved(false), 2000);
      }
    } catch {
      // No marcar como guardado si la API falla
    }
  };
  
  // Professional license handler (for all podiatrists)
  const handleSaveProfessionalLicense = async () => {
    if (user?.role !== "podiatrist" || !user?.id) return;
    try {
      const res = await api.put<{ success?: boolean }>(`/professionals/license/${user.id}`, { license: professionalLicense });
      if (res.success) {
        setLicenseSaved(true);
        setTimeout(() => setLicenseSaved(false), 2000);
      }
    } catch {
      // Silenciar, no marcar como guardado
    }
  };
  
  // Professional credentials handler (for clinic podiatrists)
  const handleSaveCredentials = async () => {
    if (!isPodiatristWithClinic || !user?.id) return;
    try {
      const res = await api.put<{ success?: boolean }>(`/professionals/credentials/${user.id}`, { cedula: credentialsCedula, registro: credentialsRegistro });
      if (res.success) {
        setCredentialsSaved(true);
        setTimeout(() => setCredentialsSaved(false), 2000);
      }
    } catch {
      // No marcar como guardado en caso de error
    }
  };

  const handleCreateReceptionist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPodiatristIndependent || !user?.id) return;
    setReceptionistError(null);
    const res = await api.post<{ success?: boolean; user?: { id: string; name: string; email: string }; message?: string }>("/receptionists", {
      name: receptionistForm.name,
      email: receptionistForm.email,
      password: receptionistForm.password,
    });
    if (res.success && (res.data as { user?: { id: string; name: string; email: string } })?.user) {
      const u = (res.data as { user: { id: string; name: string; email: string } }).user;
      setMyReceptionists((prev) => [...prev, u]);
      setReceptionistForm({ name: "", email: "", password: "" });
      setReceptionistSuccess(true);
      setTimeout(() => setReceptionistSuccess(false), 3000);
    } else {
      setReceptionistError(res.error ?? (res.data as { error?: string; message?: string })?.error ?? (res.data as { message?: string })?.message ?? "Error al crear recepcionista");
    }
  };

  const handleSaveAssignedPodiatrists = async () => {
    if (!isReceptionist || !user?.id) return;
    try {
      const res = await api.patch<{ success?: boolean }>(`/receptionists/${user.id}/assigned-podiatrists`, { assignedPodiatristIds });
      if (res.success) {
        setAssignedPodiatristsSaved(true);
        setTimeout(() => setAssignedPodiatristsSaved(false), 2000);
      }
    } catch {
      // No marcar como guardado si la API falla
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadLogo) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (solo JPEG/PNG/WebP; sin SVG por seguridad)
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setLogoError("Formato no válido. Use PNG, JPG o WebP (máx. 2MB).");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("El archivo es demasiado grande. Máximo 2MB.");
      return;
    }

    setLogoError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!canUploadLogo || !logoPreview || !user?.clinicId) return;
    try {
      const res = await api.put<{ success?: boolean }>(`/clinics/${user.clinicId}/logo`, { logo: logoPreview });
      if (res.success) {
        setCurrentLogo(logoPreview);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // No marcar como guardado si falla
    }
  };

  const handleRemoveLogo = async () => {
    if (!canUploadLogo || !user?.clinicId) return;
    await api.delete(`/clinics/${user.clinicId}/logo`);
    setCurrentLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Professional logo upload handler for independent podiatrists
  const handleProfessionalLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPodiatristIndependent) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (solo JPEG/PNG/WebP; sin SVG por seguridad)
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setLogoError("Formato no válido. Use PNG, JPG o WebP (máx. 2MB).");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("El archivo es demasiado grande. Máximo 2MB.");
      return;
    }

    setLogoError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfessionalLogo = async () => {
    if (!isPodiatristIndependent || !logoPreview || !user?.id) return;
    await api.put(`/professionals/logo/${user.id}`, { logo: logoPreview });
    setCurrentLogo(logoPreview);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveProfessionalLogo = async () => {
    if (!isPodiatristIndependent || !user?.id) return;
    await api.delete(`/professionals/logo/${user.id}`);
    setCurrentLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Cargar conversaciones de soporte (usuarios que no son admin/super_admin)
  const loadSupportConversations = async () => {
    if (isAdminRole) return;
    const r = await api.get<{ success?: boolean; conversations?: typeof supportConversations }>("/support/conversations");
    if (r.success && Array.isArray(r.data?.conversations)) setSupportConversations(r.data.conversations);
  };
  useEffect(() => { loadSupportConversations(); }, [isAdminRole]);

  const handleCreateSupportConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    const subj = supportSubject.trim();
    const msg = supportMessage.trim();
    if (!subj || !msg) return;
    setSupportSending(true);
    const r = await api.post<{ success?: boolean; conversation?: { id: string } }>("/support/conversations", {
      subject: subj,
      message: msg,
    });
    setSupportSending(false);
    if (r.success) {
      setSupportSubject("");
      setSupportMessage("");
      loadSupportConversations();
      const convId = r.data?.conversation?.id;
      if (convId) {
        const detail = await api.get<{ success?: boolean; conversation?: unknown; messages?: unknown[] }>(`/support/conversations/${convId}`);
        if (detail.success && detail.data?.conversation) {
          setSelectedSupportConv({
            id: convId,
            subject: subj,
            status: "open",
            messages: (detail.data.messages || []).map((m: { id: string; senderId: string; body: string; createdAt: string; readAt: string | null; isFromSupport: boolean }) => ({
              id: m.id, senderId: m.senderId, body: m.body, createdAt: m.createdAt, readAt: m.readAt, isFromSupport: m.isFromSupport,
            })),
          });
        }
      }
    }
  };

  const handleOpenSupportConversation = async (convId: string) => {
    const r = await api.get<{ success?: boolean; conversation?: { id: string; subject: string; status: string }; messages?: Array<{ id: string; senderId: string; body: string; createdAt: string; readAt: string | null; isFromSupport: boolean }> }>(`/support/conversations/${convId}`);
    if (r.success && r.data?.conversation) {
      setSelectedSupportConv({
        id: r.data.conversation.id,
        subject: r.data.conversation.subject,
        status: r.data.conversation.status,
        messages: r.data.messages || [],
      });
      await api.patch(`/support/conversations/${convId}`, { markRead: true });
    }
  };

  const handleSendSupportReply = async () => {
    if (!selectedSupportConv || !supportReply.trim()) return;
    setSupportSending(true);
    const r = await api.post<{ success?: boolean; message?: { id: string; body: string; createdAt: string; isFromSupport: boolean } }>(`/support/conversations/${selectedSupportConv.id}/messages`, { body: supportReply.trim() });
    setSupportSending(false);
    if (r.success && r.data?.message) {
      setSupportReply("");
      setSelectedSupportConv((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, { ...r.data!.message!, readAt: null, senderId: user?.id || "" }],
      } : null);
      loadSupportConversations();
    }
  };

  return (
    <MainLayout title={t.settings.title} >
      <div className="max-w-2xl space-y-8">
        {/* Language Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">{t.settings.language}</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  language === lang
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Perfil de usuario</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-semibold">
                  {(user?.name ?? "").charAt(0).toUpperCase() || "?"}
                </span>
              </div>
              <div>
                <p className="font-medium text-[#1a1a1a]">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={user?.name || ""}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Los datos del perfil no pueden ser modificados desde esta pantalla. Contacte con el administrador si necesita realizar cambios.
              </p>
            </div>
          </div>
        </div>

        {/* Contactar PodoAdmin - mensajería bidireccional con soporte (no admin/super_admin) */}
        {!isAdminRole && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t.support.contactPodoAdmin}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{t.support.contactSubtitle}</p>

            {!selectedSupportConv ? (
              <>
                <form onSubmit={handleCreateSupportConversation} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.support.subject}</label>
                    <input
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder={t.support.subjectPlaceholder}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.support.message}</label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder={t.support.messagePlaceholder}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={supportSending}
                    className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] disabled:opacity-50"
                  >
                    {supportSending ? "..." : t.support.send}
                  </button>
                </form>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-[#1a1a1a] mb-3">{t.support.myConversations}</h4>
                  {supportConversations.length === 0 ? (
                    <p className="text-sm text-gray-500">{t.support.noConversations}</p>
                  ) : (
                    <div className="space-y-2">
                      {supportConversations.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleOpenSupportConversation(c.id)}
                          className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-[#1a1a1a]">{c.subject}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {c.status === "open" ? t.support.open : t.support.closed}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{new Date(c.updatedAt).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <button
                  onClick={() => setSelectedSupportConv(null)}
                  className="text-sm text-gray-500 hover:text-[#1a1a1a] mb-4 flex items-center gap-1"
                >
                  ← {t.common.back}
                </button>
                <h4 className="font-medium text-[#1a1a1a] mb-4">{selectedSupportConv.subject}</h4>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {selectedSupportConv.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg ${m.isFromSupport ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"}`}
                    >
                      <p className="text-xs text-gray-500 mb-1">{m.isFromSupport ? "PodoAdmin" : user?.name} · {new Date(m.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>
                {selectedSupportConv.status === "open" && (
                  <div className="flex gap-2">
                    <textarea
                      value={supportReply}
                      onChange={(e) => setSupportReply(e.target.value)}
                      placeholder={t.support.replyPlaceholder}
                      rows={2}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] resize-none"
                    />
                    <button
                      onClick={handleSendSupportReply}
                      disabled={supportSending || !supportReply.trim()}
                      className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg font-medium hover:bg-[#2a2a2a] disabled:opacity-50 self-end"
                    >
                      {supportSending ? "..." : t.support.reply}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Podólogos asignados - Solo recepcionista: ver y editar quiénes la asignaron */}
        {isReceptionist && user?.id && (() => {
          const ids = assignedPodiatristIds;
          const allUsersList = getAllUsers();
          const clinicPodiatrists = user.clinicId
            ? allUsersList.filter((u) => u.role === "podiatrist" && u.clinicId === user.clinicId)
            : allUsersList.filter((u) => ids.includes(u.id));
          const isFromClinic = !!user.clinicId;
          return (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Podólogos asignados</h3>
              <p className="text-sm text-gray-500 mb-4">
                {isFromClinic
                  ? "Podólogos de tu clínica a los que puedes dar servicio. Marca o desmarca para gestionar citas y pacientes de cada uno."
                  : "Podólogo que te asignó. Puedes crear pacientes y gestionar su calendario."}
              </p>
              {isFromClinic ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {clinicPodiatrists.map((pod) => {
                      const checked = assignedPodiatristIds.includes(pod.id);
                      return (
                        <label
                          key={pod.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setAssignedPodiatristIds((prev) =>
                                prev.includes(pod.id)
                                  ? prev.filter((id) => id !== pod.id)
                                  : [...prev, pod.id]
                              );
                            }}
                            className="rounded border-gray-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                          />
                          <span className="font-medium text-[#1a1a1a]">{pod.name}</span>
                          <span className="text-sm text-gray-500">{pod.email}</span>
                        </label>
                      );
                    })}
                  </div>
                  {clinicPodiatrists.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay podólogos en tu clínica.</p>
                  ) : (
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={handleSaveAssignedPodiatrists}
                        className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                      >
                        Guardar asignación
                      </button>
                      {assignedPodiatristsSaved && (
                        <span className="text-sm text-green-600 font-medium">Guardado</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  {ids.length > 0 ? (
                    allUsersList
                      .filter((u) => ids.includes(u.id))
                      .map((u) => (
                        <p key={u.id} className="font-medium text-[#1a1a1a]">
                          {u.name} <span className="text-gray-500 font-normal">({u.email})</span>
                        </p>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">Sin podólogo asignado.</p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Clinic Logo Upload - Only for Clinic Admin and Podiatrist with clinic */}
        {(canUploadLogo || isPodiatristWithClinic) && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Logo de la clínica</h3>
            
            {isPodiatristWithClinic ? (
              // Podiatrists can only view their clinic's logo (read-only)
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Logo compartido de la clínica</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Este logo pertenece a <strong>{clinicName}</strong>. Todos los doctores de esta clínica lo utilizan. Solo el administrador de la clínica puede modificarlo.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-40 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                    {currentLogo ? (
                      <img 
                        src={currentLogo} 
                        alt="Clinic Logo" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400 mt-1 block">Sin logo</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm">Solo lectura</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : canUploadLogo ? (
              // Clinic Admin can upload their clinic's logo
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Sube el logo de tu clínica. Este logo se mostrará en los documentos PDF de todos los podólogos de tu clínica. Dimensiones recomendadas: 200x80px
                </p>
                
                <div className="space-y-4">
                  {/* Current/Preview Logo */}
                  <div className="flex items-center gap-6">
                    <div className="w-40 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Preview" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : currentLogo ? (
                        <img 
                          src={currentLogo} 
                          alt="Clinic Logo" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-400 mt-1 block">Sin logo</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Subir imagen
                      </label>
                      
                      {logoError && (
                        <p className="text-sm text-red-600 mt-2">{logoError}</p>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-2">
                        PNG, JPG o SVG. Máximo 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {(logoPreview || currentLogo) && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      {logoPreview && (
                        <button
                          onClick={handleSaveLogo}
                          className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                        >
                          Guardar logo
                        </button>
                      )}
                      {logoPreview && (
                        <button
                          onClick={() => {
                            setLogoPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="px-4 py-2 bg-gray-100 text-[#1a1a1a] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                      {currentLogo && !logoPreview && (
                        <button
                          onClick={handleRemoveLogo}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                        >
                          Eliminar logo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Professional Logo Upload - Only for Independent Podiatrists (no clinic) */}
        {isPodiatristIndependent && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Logo Profesional</h3>
            <p className="text-sm text-gray-500 mb-4">
              Sube tu logo profesional personal. Este logo se mostrará en los documentos PDF que generes. Dimensiones recomendadas: 200x80px
            </p>
            
            <div className="space-y-4">
              {/* Current/Preview Logo */}
              <div className="flex items-center gap-6">
                <div className="w-40 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : currentLogo ? (
                    <img 
                      src={currentLogo} 
                      alt="Professional Logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-400 mt-1 block">Sin logo</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleProfessionalLogoUpload}
                    className="hidden"
                    id="professional-logo-upload"
                  />
                  <label
                    htmlFor="professional-logo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-[#1a1a1a] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Subir imagen
                  </label>
                  
                  {logoError && (
                    <p className="text-sm text-red-600 mt-2">{logoError}</p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-2">
                    PNG, JPG o SVG. Máximo 2MB.
                  </p>
                </div>
              </div>

              {/* Actions */}
              {(logoPreview || currentLogo) && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  {logoPreview && (
                    <button
                      onClick={handleSaveProfessionalLogo}
                      className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                    >
                      Guardar logo
                    </button>
                  )}
                  {logoPreview && (
                    <button
                      onClick={() => {
                        setLogoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="px-4 py-2 bg-gray-100 text-[#1a1a1a] rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  {currentLogo && !logoPreview && (
                    <button
                      onClick={handleRemoveProfessionalLogo}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                    >
                      Eliminar logo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Consentimiento informado - Misma lógica que Logo: clinic_admin edita, podólogo clínica solo lectura, independiente edita */}
        {(canUploadLogo || isPodiatristWithClinic || isPodiatristIndependent) && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Consentimiento informado</h3>

            {/* Clínica: admin edita, podólogo con clínica solo lectura */}
            {isPodiatristWithClinic && userClinic && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Texto compartido de la clínica</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Este consentimiento pertenece a <strong>{clinicName}</strong>. Solo el administrador de la clínica puede modificarlo.
                    </p>
                  </div>
                </div>
                {(userClinic.consentTextVersion ?? 0) > 0 && (
                  <p className="text-xs text-gray-500">Versión actual: {userClinic.consentTextVersion}</p>
                )}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-[#1a1a1a] whitespace-pre-wrap">
                    {userClinic.consentText?.trim() || "Sin texto configurado."}
                  </p>
                </div>
              </div>
            )}
            {canUploadLogo && user?.clinicId && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Texto que el paciente leerá y aceptará al crear la ficha. Si lo editas, los pacientes con versión anterior deberán volver a aceptar.
                </p>
                {(userClinic?.consentTextVersion ?? 0) > 0 && (
                  <p className="text-xs text-gray-500 mb-2">Versión actual: {userClinic?.consentTextVersion}</p>
                )}
                <textarea
                  value={clinicInfoForm.consentText ?? ""}
                  onChange={(e) => handleClinicInfoChange("consentText", e.target.value)}
                  placeholder="Redacta aquí los términos y el consentimiento informado que el paciente debe aceptar."
                  rows={6}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all resize-y"
                />
                {clinicConsentError && (
                  <p className="text-sm text-red-600 mt-2">{clinicConsentError}</p>
                )}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSaveClinicConsent}
                    className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                  >
                    Guardar consentimiento
                  </button>
                  {clinicConsentSaved && (
                    <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Guardado
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Podólogo independiente: edita su propio texto */}
            {isPodiatristIndependent && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Texto que el paciente leerá y aceptará al crear la ficha. Si lo editas, los pacientes con versión anterior deberán volver a aceptar.
                </p>
                {(professionalInfoForm.consentTextVersion ?? 0) > 0 && (
                  <p className="text-xs text-gray-500 mb-2">Versión actual: {professionalInfoForm.consentTextVersion}</p>
                )}
                <textarea
                  value={professionalInfoForm.consentText ?? ""}
                  onChange={(e) => handleProfessionalInfoChange("consentText", e.target.value)}
                  placeholder="Redacta aquí los términos y el consentimiento informado que el paciente debe aceptar."
                  rows={6}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all resize-y"
                />
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveProfessionalInfo}
                    className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                  >
                    Guardar consentimiento
                  </button>
                  {professionalInfoSaved && (
                    <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Guardado
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Recepcionista - Solo podólogo independiente: una sola recepcionista ligada directamente */}
        {isPodiatristIndependent && user?.id && (() => {
          const hasReceptionist = myReceptionists.length >= 1;
          return (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Recepcionista</h3>
              <p className="text-sm text-gray-500 mb-4">
                Como podólogo independiente puedes crear una recepcionista vinculada a tu cuenta. Tendrá acceso sin créditos a crear pacientes, crear y editar citas en tu calendario.
              </p>
              {hasReceptionist ? (
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium">Recepcionista asignada</p>
                  <p className="text-sm text-green-600 mt-1">
                    {myReceptionists[0].name} ({myReceptionists[0].email})
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Ya tienes una recepcionista ligada a tu cuenta. Solo puedes tener una.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateReceptionist} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={receptionistForm.name}
                      onChange={(e) => setReceptionistForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={receptionistForm.email}
                      onChange={(e) => setReceptionistForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña inicial</label>
                    <input
                      type="password"
                      value={receptionistForm.password}
                      onChange={(e) => setReceptionistForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                  {receptionistError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{receptionistError}</div>
                  )}
                  {receptionistSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg p-3">
                      Recepcionista creada. Ya puede iniciar sesión con su email y contraseña.
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                  >
                    Crear recepcionista
                  </button>
                </form>
              )}
            </div>
          );
        })()}
        
        {/* Clinic Information - Only for Clinic Admin (editable) or Podiatrists with clinic (read-only) */}
        {(canUploadLogo || isPodiatristWithClinic) && userClinic && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Información de la Clínica</h3>
            
            {canUploadLogo ? (
              // Clinic Admin can edit clinic information
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Completa la información de tu clínica. Estos datos aparecerán en los documentos PDF generados.
                </p>
                
                <div className="grid gap-4">
                  {/* Clinic Name - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                      Nombre de la Clínica
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </label>
                    <input
                      type="text"
                      value={userClinic.clinicName}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={clinicInfoForm.phone}
                        onChange={(e) => handleClinicInfoChange("phone", e.target.value)}
                        placeholder="+34 912 345 678"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={clinicInfoForm.email}
                        onChange={(e) => handleClinicInfoChange("email", e.target.value)}
                        placeholder="info@clinica.es"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      value={clinicInfoForm.address}
                      onChange={(e) => handleClinicInfoChange("address", e.target.value)}
                      placeholder="Calle Gran Vía, 45, 2º Izquierda"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                      <input
                        type="text"
                        value={clinicInfoForm.city}
                        onChange={(e) => handleClinicInfoChange("city", e.target.value)}
                        placeholder="Madrid"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                      <input
                        type="text"
                        value={clinicInfoForm.postalCode}
                        onChange={(e) => handleClinicInfoChange("postalCode", e.target.value)}
                        placeholder="28001"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nº Licencia/Registro</label>
                      <input
                        type="text"
                        value={clinicInfoForm.licenseNumber}
                        onChange={(e) => handleClinicInfoChange("licenseNumber", e.target.value)}
                        placeholder="CS-28/2024-POD-001"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web (opcional)</label>
                      <input
                        type="url"
                        value={clinicInfoForm.website}
                        onChange={(e) => handleClinicInfoChange("website", e.target.value)}
                        placeholder="https://www.clinica.es"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSaveClinicInfo}
                      className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                    >
                      Guardar información
                    </button>
                    {clinicInfoSaved && (
                      <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Podiatrists view clinic info as read-only
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Detalles de tu clínica</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Esta información es gestionada por el administrador de la clínica.
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-3 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-500">Nombre:</span>
                    <span className="font-medium text-[#1a1a1a]">{userClinic.clinicName}</span>
                  </div>
                  {userClinic.phone && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">Teléfono:</span>
                      <span className="font-medium text-[#1a1a1a]">{userClinic.phone}</span>
                    </div>
                  )}
                  {userClinic.email && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">Email:</span>
                      <span className="font-medium text-[#1a1a1a]">{userClinic.email}</span>
                    </div>
                  )}
                  {userClinic.address && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">Dirección:</span>
                      <span className="font-medium text-[#1a1a1a]">
                        {userClinic.address}{userClinic.city && `, ${userClinic.city}`}{userClinic.postalCode && ` ${userClinic.postalCode}`}
                      </span>
                    </div>
                  )}
                  {userClinic.licenseNumber && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">Licencia:</span>
                      <span className="font-medium text-[#1a1a1a]">{userClinic.licenseNumber}</span>
                    </div>
                  )}
                  {userClinic.consentDocumentUrl && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">Consentimiento:</span>
                      <a
                        href={userClinic.consentDocumentUrl.startsWith('http') ? userClinic.consentDocumentUrl : `https://${userClinic.consentDocumentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Ver documento
                      </a>
                    </div>
                  )}
                  {userClinic.website && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">Web:</span>
                      <a 
                        href={
                          userClinic.website.startsWith('http://') || userClinic.website.startsWith('https://')
                            ? userClinic.website
                            : `https://${userClinic.website}`
                        }
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                        onClick={(e) => {
                          // Validar que la URL sea válida antes de abrir
                          const url = userClinic.website.startsWith('http://') || userClinic.website.startsWith('https://')
                            ? userClinic.website
                            : `https://${userClinic.website}`;
                          
                          try {
                            new URL(url);
                          } catch (error) {
                            e.preventDefault();
                            alert('La URL del sitio web no es válida. Por favor, verifica que esté correctamente configurada.');
                          }
                        }}
                      >
                        {userClinic.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Consultorio Information - Only for Independent Podiatrists (no clinic) */}
        {isPodiatristIndependent && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Información del Consultorio</h3>
            <p className="text-sm text-gray-500 mb-4">
              Completa la información de tu consultorio profesional. Estos datos aparecerán en los documentos PDF que generes.
            </p>
            
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Profesional</label>
                  <input
                    type="text"
                    value={professionalInfoForm.name}
                    onChange={(e) => handleProfessionalInfoChange("name", e.target.value)}
                    placeholder="Dr. Juan Pérez García"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={professionalInfoForm.phone}
                      onChange={(e) => handleProfessionalInfoChange("phone", e.target.value)}
                      placeholder="+34 912 345 678"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={professionalInfoForm.email}
                      onChange={(e) => handleProfessionalInfoChange("email", e.target.value)}
                      placeholder="doctor@consultorio.es"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={professionalInfoForm.address}
                    onChange={(e) => handleProfessionalInfoChange("address", e.target.value)}
                    placeholder="Calle Gran Vía, 45, 2º Izquierda"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={professionalInfoForm.city}
                      onChange={(e) => handleProfessionalInfoChange("city", e.target.value)}
                      placeholder="Madrid"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                    <input
                      type="text"
                      value={professionalInfoForm.postalCode}
                      onChange={(e) => handleProfessionalInfoChange("postalCode", e.target.value)}
                      placeholder="28001"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nº Registro Sanitario</label>
                    <input
                      type="text"
                      value={professionalInfoForm.licenseNumber}
                      onChange={(e) => handleProfessionalInfoChange("licenseNumber", e.target.value)}
                      placeholder="CS-28/2024-POD-001"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cédula Profesional</label>
                    <input
                      type="text"
                      value={professionalInfoForm.professionalLicense}
                      onChange={(e) => handleProfessionalInfoChange("professionalLicense", e.target.value)}
                      placeholder="12345678"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Términos y condiciones / Consentimiento informado</label>
                    <textarea
                      value={professionalInfoForm.consentText || ""}
                      onChange={(e) => handleProfessionalInfoChange("consentText", e.target.value)}
                      placeholder="Redacta aquí los términos y condiciones que el paciente debe aceptar. Este texto se mostrará al crear la ficha del paciente. Una vez que acepte, queda acreditado durante la existencia del paciente, salvo que edites este texto (en ese caso deberá volver a aceptar)."
                      rows={6}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all resize-y"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Texto que el paciente leerá y aceptará con un check. Si editas este texto, los pacientes existentes deberán volver a aceptar los nuevos términos.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveProfessionalInfo}
                    className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                  >
                    Guardar información
                  </button>
                  {professionalInfoSaved && (
                    <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Guardado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Professional Credentials - For Podiatrists with Clinic */}
        {isPodiatristWithClinic && userClinic && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Credenciales Profesionales</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ingresa tus credenciales profesionales individuales. La información de la clínica es gestionada por tu administrador.
            </p>
            
            <div className="space-y-6">
              {/* Editable credentials */}
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cédula Profesional</label>
                  <input
                    type="text"
                    value={credentialsCedula}
                    onChange={(e) => setCredentialsCedula(e.target.value)}
                    placeholder="12345678"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Registro</label>
                  <input
                    type="text"
                    value={credentialsRegistro}
                    onChange={(e) => setCredentialsRegistro(e.target.value)}
                    placeholder="REG-2024-001"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSaveCredentials}
                  className="px-6 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-sm font-medium hover:bg-[#2a2a2a] transition-colors"
                >
                  Guardar credenciales
                </button>
                {credentialsSaved && (
                  <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardado
                  </span>
                )}
              </div>
              
              {/* Read-only clinic information */}
              <div className="pt-6 border-t border-gray-100">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 mb-4">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Información de tu clínica</p>
                    <p className="text-sm text-blue-600 mt-1">
                      El resto de tu información es gestionada por el administrador de tu clínica.
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {/* Read-only clinic fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                      Nombre de la Clínica
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </label>
                    <input
                      type="text"
                      value={userClinic.clinicName}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        Teléfono
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={userClinic.phone || "—"}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        Email
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={userClinic.email || "—"}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                      Dirección
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </label>
                    <input
                      type="text"
                      value={userClinic.address || "—"}
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        Ciudad
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={userClinic.city || "—"}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        Código Postal
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={userClinic.postalCode || "—"}
                        disabled
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Info for Super Admin and Admin - no clinic logo */}
        {isAdminRole && (
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-600 font-medium">Logo de clínica</p>
                <p className="text-sm text-gray-500 mt-1">
                  Los logos de clínica son gestionados por los administradores de cada clínica. Como {user?.role === "super_admin" ? "Super Administrador" : "Administrador"}, no necesitas un logo personal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Confirmation */}
        {saved && (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t.settings.settingsSaved}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
