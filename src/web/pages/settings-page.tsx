import { useState, useRef, useEffect, useCallback } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { AnimatedThemeToggler } from "../components/ui/animated-theme-toggler";
import { useDarkMode } from "../hooks/use-dark-mode";
import { ProfessionalInfo } from "../types/professional";
import type { Clinic } from "../types/clinic";
import { api } from "../lib/api-client";
import { WhatsAppSettingsSection } from "../components/settings/whatsapp-settings-section";
import { ComplianceSettingsSection } from "../components/settings/compliance-settings-section";
import { ClinicalHistoriesDownloadSection } from "../components/settings/clinical-histories-download-section";
import { SettingsTabBar, type SettingsTabId } from "../components/settings/settings-tab-bar";
import { BillingSettingsSection } from "../components/settings/billing-settings-section";
import { ClinicalLayoutSettingsSection } from "../components/settings/clinical-layout-settings-section";
import { PrintSettingsSection } from "../components/settings/print-settings-section";
import { WorkspaceWatermarkSettingsSection } from "../components/settings/workspace-watermark-settings-section";
import { ColorPaletteSettingsSection } from "../components/settings/color-palette-settings-section";
import { SidebarNavSettingsSection } from "../components/settings/sidebar-nav-settings-section";
import { ProfileAvatarSettingsSection } from "../components/settings/profile-avatar-settings-section";
import { CountrySelect } from "../components/settings/country-select";
import { phonePlaceholderForCountry } from "../lib/whatsapp-web-link";
import { DEFAULT_TENANT_COUNTRY, resolveTenantCountryCode } from "../../lib/phone-country";
import { compressImageForLogo } from "../lib/image-compress";
import {
  formErrorClass,
  formSuccessClass,
  semanticAlertErrorClass,
  semanticAlertInfoClass,
  semanticAlertSuccessClass,
  semanticAlertWarningClass,
  semanticChipErrorClass,
  semanticChipSuccessClass,
  semanticChipWarningClass,
  semanticDestructiveTextClass,
  whatsappPanelInnerClass,
} from "../lib/form-field-classes";
import { DashboardLogoSettingsSection } from "../components/settings/dashboard-logo-settings-section";
import { EditCooldownNotice } from "../components/settings/edit-cooldown-notice";

interface ClinicInfoForm {
  clinicName: string;
  clinicCode: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  licenseNumber: string;
  website: string;
  consentText: string;
  legalName: string;
  rfc: string;
  clues: string;
  establishmentType: string;
  cofeprisRegistration: string;
}

// Nombre de clínica desde datos cargados o fallback
const getClinicNameFrom = (clinic: Clinic | null, clinicId: string, fallbackTpl: string): string =>
  clinic?.clinicName ?? (clinicId ? fallbackTpl.replace("{id}", clinicId) : "");

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
  const { user, getAllUsers, updateUser } = useAuth();
  const isDarkMode = useDarkMode();
  
  // Determine logo ownership based on role
  const canUploadLogo = user?.role === "clinic_admin";
  const isPodiatristWithClinic = user?.role === "podiatrist" && user?.clinicId;
  const isPodiatristIndependent = user?.role === "podiatrist" && !user?.clinicId;
  const isAdminRole = user?.role === "super_admin" || user?.role === "admin";
  const isReceptionist = user?.role === "receptionist";
  const canConfigureWhatsApp =
    user?.role === "podiatrist" || user?.role === "clinic_admin";
  const showClinicalTab =
    user?.role === "podiatrist" || user?.role === "clinic_admin";
  const showClinicTab =
    user?.role === "clinic_admin" ||
    !!isPodiatristWithClinic ||
    !!isPodiatristIndependent;

  const showBillingTab =
    user?.role === "clinic_admin" || user?.role === "podiatrist";

  const parseTabFromUrl = (): SettingsTabId => {
    if (typeof window === "undefined") return "general";
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (
      tab === "general" ||
      tab === "clinical" ||
      tab === "integrations" ||
      tab === "clinic" ||
      tab === "billing"
    ) {
      return tab;
    }
    return "general";
  };

  const [activeTab, setActiveTab] = useState<SettingsTabId>(parseTabFromUrl);

  const handleTabChange = useCallback((tab: SettingsTabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === "general") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    const next = query ? `/settings?${query}` : "/settings";
    window.history.replaceState(null, "", next);
  }, []);

  useEffect(() => {
    if (!showClinicalTab && activeTab === "clinical") {
      setActiveTab("general");
    }
    if (!showBillingTab && activeTab === "billing") {
      setActiveTab("general");
    }
  }, [showClinicalTab, showBillingTab, activeTab]);
  
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
    api.get<{ success: boolean; clinic?: Record<string, unknown>; infoBlockedUntil?: string | null; logoBlockedUntil?: string | null }>(`/clinics/${user.clinicId}`).then((res) => {
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
          countryCode: (c.countryCode as string) ?? DEFAULT_TENANT_COUNTRY,
          licenseNumber: (c.licenseNumber as string) ?? "",
          website: (c.website as string) ?? "",
          consentText: (c.consentText as string) ?? "",
          consentTextVersion: (c.consentTextVersion as number) ?? 0,
        } as Clinic);
        setInfoBlockedUntil(res.data?.infoBlockedUntil ?? null);
        setLogoBlockedUntil(res.data?.logoBlockedUntil ?? null);
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
      api.get<{ success?: boolean; logo?: string | null; logoBlockedUntil?: string | null }>(`/professionals/logo/${user.id}`).then((res) => {
        setCurrentLogo(res.success && res.data?.logo ? res.data.logo : null);
        setLogoBlockedUntil(res.data?.logoBlockedUntil ?? null);
      }).catch(() => {
        setCurrentLogo(null);
        setLogoBlockedUntil(null);
      });
    } else {
      setCurrentLogo(null);
    }
  }, [user?.clinicId, user?.id, isPodiatristIndependent]);
  
  // Clinic information form state (for clinic admins)
  const [clinicInfoForm, setClinicInfoForm] = useState<ClinicInfoForm>({
    clinicName: "",
    clinicCode: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    countryCode: DEFAULT_TENANT_COUNTRY,
    licenseNumber: "",
    website: "",
    consentText: "",
    legalName: "",
    rfc: "",
    clues: "",
    establishmentType: "private_office",
    cofeprisRegistration: "",
  });
  const [clinicInfoSaved, setClinicInfoSaved] = useState(false);
  const [clinicInfoError, setClinicInfoError] = useState<string | null>(null);
  const [clinicConsentSaved, setClinicConsentSaved] = useState(false);
  const [clinicConsentError, setClinicConsentError] = useState<string | null>(null);
  const [infoBlockedUntil, setInfoBlockedUntil] = useState<string | null>(null);
  const [logoBlockedUntil, setLogoBlockedUntil] = useState<string | null>(null);
  const [professionalInfoBlockedUntil, setProfessionalInfoBlockedUntil] = useState<string | null>(null);
  
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
    countryCode: DEFAULT_TENANT_COUNTRY,
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
  const [myReceptionists, setMyReceptionists] = useState<
    { id: string; name: string; email: string; isBlocked?: boolean; isEnabled?: boolean }[]
  >([]);
  const [receptionistActionLoadingId, setReceptionistActionLoadingId] = useState<string | null>(null);
  
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
        clinicName: userClinic.clinicName || "",
        clinicCode: userClinic.clinicCode || "",
        phone: userClinic.phone || "",
        email: userClinic.email || "",
        address: userClinic.address || "",
        city: userClinic.city || "",
        postalCode: userClinic.postalCode || "",
        countryCode: (userClinic as { countryCode?: string }).countryCode || DEFAULT_TENANT_COUNTRY,
        licenseNumber: userClinic.licenseNumber || "",
        website: userClinic.website || "",
        consentText: userClinic.consentText || "",
        legalName: (userClinic as { legalName?: string }).legalName || "",
        rfc: (userClinic as { rfc?: string }).rfc || "",
        clues: (userClinic as { clues?: string }).clues || "",
        establishmentType: (userClinic as { establishmentType?: string }).establishmentType || "private_office",
        cofeprisRegistration: (userClinic as { cofeprisRegistration?: string }).cofeprisRegistration || "",
      });
    }
  }, [userClinic]);
  
  // Cargar professional info desde API (podólogos)
  useEffect(() => {
    if (user?.role === "podiatrist" && user?.id) {
      api.get<{ success?: boolean; info?: ProfessionalInfo & { countryCode?: string } | null; infoBlockedUntil?: string | null }>(`/professionals/info/${user.id}`).then((res) => {
        if (res.success && res.data?.info) {
          setProfessionalInfoForm({
            ...res.data.info,
            countryCode: res.data.info.countryCode || DEFAULT_TENANT_COUNTRY,
          });
        } else if (isPodiatristIndependent) {
          setProfessionalInfoForm({
            name: user?.name || "",
            phone: "",
            email: user?.email || "",
            address: "",
            city: "",
            postalCode: "",
            countryCode: DEFAULT_TENANT_COUNTRY,
            licenseNumber: "",
            professionalLicense: "",
            consentText: "",
          });
        }
        setProfessionalInfoBlockedUntil(res.data?.infoBlockedUntil ?? null);
      });
    }
  }, [user?.role, user?.id, user?.name, user?.email, isPodiatristIndependent]);
  
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
          updateUser({ assignedPodiatristIds: res.data.assignedPodiatristIds });
        }
      });
    }
  }, [isReceptionist, user?.id, updateUser]);

  // Cargar professional credentials desde API (podólogos de clínica)
  useEffect(() => {
    if (isPodiatristWithClinic && user?.id) {
      api.get<{ success?: boolean; credentials?: { cedula?: string; registro?: string } | null; infoBlockedUntil?: string | null }>(`/professionals/credentials/${user.id}`).then((res) => {
        if (res.success && res.data?.credentials) {
          setCredentialsCedula(res.data.credentials.cedula || "");
          setCredentialsRegistro(res.data.credentials.registro || "");
        }
        if (res.data?.infoBlockedUntil) {
          setProfessionalInfoBlockedUntil(res.data.infoBlockedUntil);
        }
      });
    }
  }, [isPodiatristWithClinic, user?.id]);

  const loadMyReceptionists = useCallback(async () => {
    if (!isPodiatristIndependent || !user?.id) return;
    const res = await api.get<{
      success?: boolean;
      receptionists?: { id: string; name: string; email: string; isBlocked?: boolean; isEnabled?: boolean }[];
    }>("/receptionists");
    if (res.success && Array.isArray(res.data?.receptionists)) {
      setMyReceptionists(res.data.receptionists);
    }
  }, [isPodiatristIndependent, user?.id]);

  // Cargar "mis recepcionistas" desde API (podólogo independiente)
  useEffect(() => {
    void loadMyReceptionists();
  }, [loadMyReceptionists]);

  const clinicName = userClinic?.clinicName ?? getClinicNameFrom(userClinic, user?.clinicId ?? "", t.settings.clinic.fallbackName);
  const isInfoBlocked = !!infoBlockedUntil && new Date(infoBlockedUntil) > new Date();
  const isLogoBlocked = !!logoBlockedUntil && new Date(logoBlockedUntil) > new Date();
  const isProfessionalInfoBlocked =
    !!professionalInfoBlockedUntil && new Date(professionalInfoBlockedUntil) > new Date();
  const formatBlockedUntil = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  };
  const logoCooldownPolicy =
    t.settings.cooldown.logoPolicy;
  const logoCooldownBlocked = (date: string) =>
    `${t.settings.logo.errors.cooldown} ${date}`;
  const clinicInfoCooldownPolicy =
    t.settings.cooldown.clinicInfoPolicy;
  const clinicInfoCooldownBlocked = (date: string) =>
    `${t.settings.cooldown.clinicInfoBlocked} ${date}`;
  const professionalInfoCooldownPolicy =
    t.settings.cooldown.professionalInfoPolicy;
  const professionalInfoCooldownBlocked = (date: string) =>
    `${t.settings.cooldown.professionalInfoBlocked} ${date}`;
  const profileCooldownPolicy =
    t.settings.cooldown.profilePolicy;
  const clinicReadOnlyPolicy =
    t.settings.cooldown.clinicReadOnlyPolicy;
  const proInfoInputClass = isProfessionalInfoBlocked
    ? "w-full px-4 py-2.5 bg-brand-canvas text-brand-muted border border-brand-border rounded-lg cursor-not-allowed"
    : "w-full px-4 py-2.5 bg-brand-surface text-brand-ink border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-ink focus:border-transparent transition-all";
  
  const handleClinicInfoChange = (field: keyof ClinicInfoForm, value: string) => {
    setClinicInfoForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveClinicInfo = async () => {
    if (!canUploadLogo || !user?.clinicId || isInfoBlocked) return;
    setClinicInfoError(null);
    const clinicName = (clinicInfoForm.clinicName || "").trim();
    const clinicCode = (clinicInfoForm.clinicCode || "").trim();
    if (!clinicName || !clinicCode) {
      setClinicInfoError(t.settings.clinic.errors.nameCodeRequired);
      return;
    }
    try {
      const res = await api.patch<{ success?: boolean; clinic?: Clinic; infoBlockedUntil?: string }>(`/clinics/${user.clinicId}`, {
        clinicName,
        clinicCode,
        phone: clinicInfoForm.phone,
        email: clinicInfoForm.email,
        address: clinicInfoForm.address,
        city: clinicInfoForm.city,
        postalCode: clinicInfoForm.postalCode,
        countryCode: resolveTenantCountryCode(clinicInfoForm.countryCode),
        licenseNumber: clinicInfoForm.licenseNumber,
        website: clinicInfoForm.website,
        consentText: clinicInfoForm.consentText || null,
        legalName: clinicInfoForm.legalName || null,
        rfc: clinicInfoForm.rfc || null,
        clues: clinicInfoForm.clues || null,
        establishmentType: clinicInfoForm.establishmentType || "private_office",
        cofeprisRegistration: clinicInfoForm.cofeprisRegistration || null,
      });
      if (res.success && res.data?.clinic) {
        setUserClinic(res.data.clinic as Clinic);
        setInfoBlockedUntil(res.data?.infoBlockedUntil ?? null);
        setClinicInfoSaved(true);
        setTimeout(() => setClinicInfoSaved(false), 2000);
      } else if (res.error === "cooldown" && res.data?.infoBlockedUntil) {
        setInfoBlockedUntil(res.data.infoBlockedUntil);
        setClinicInfoError(res.message ?? t.settings.cooldown.clinicInfoBlocked);
      }
    } catch (err) {
      // Error ya se muestra en consola desde api-client; no marcamos como guardado
    }
  };

  const handleSaveClinicConsent = async () => {
    if (!canUploadLogo || !user?.clinicId || isInfoBlocked) return;
    setClinicConsentError(null);
    try {
      const res = await api.patch<{ success?: boolean; clinic?: Clinic; infoBlockedUntil?: string }>(`/clinics/${user.clinicId}`, {
        consentText: (clinicInfoForm.consentText ?? "").trim() || null,
      });
      const clinic = res.data?.clinic ?? (res.data as { clinic?: Clinic } | undefined)?.clinic;
      if (res.success && clinic) {
        setUserClinic(clinic as Clinic);
        setInfoBlockedUntil((res.data as { infoBlockedUntil?: string })?.infoBlockedUntil ?? null);
        setClinicConsentSaved(true);
        setClinicConsentError(null);
        setTimeout(() => setClinicConsentSaved(false), 2000);
      } else if (res.error === "cooldown" && (res.data as { infoBlockedUntil?: string })?.infoBlockedUntil) {
        setInfoBlockedUntil((res.data as { infoBlockedUntil: string }).infoBlockedUntil);
        setClinicConsentError(res.message ?? t.settings.cooldown.genericBlocked);
      } else {
        setClinicConsentError(res.message ?? res.error ?? t.settings.consent.saveError);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t.settings.errors.connectionSave;
      setClinicConsentError(message);
    }
  };
  
  // Professional info handlers (for independent podiatrists) - persistencia vía API
  const handleProfessionalInfoChange = (field: keyof ProfessionalInfo, value: string) => {
    setProfessionalInfoForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveProfessionalInfo = async () => {
    if (user?.role !== "podiatrist" || !user?.id) return;
    if (!isPodiatristIndependent && !isPodiatristWithClinic) return;
    if (isProfessionalInfoBlocked) return;
    try {
      const payload = {
        ...professionalInfoForm,
        name: professionalInfoForm.name || user.name || "",
        email: professionalInfoForm.email || user.email || "",
      };
      const res = await api.put<{ success?: boolean; infoBlockedUntil?: string }>(`/professionals/info/${user.id}`, payload);
      if (res.success) {
        setProfessionalInfoBlockedUntil(res.data?.infoBlockedUntil ?? null);
        setProfessionalInfoSaved(true);
        setTimeout(() => setProfessionalInfoSaved(false), 2000);
      } else if (res.error === "cooldown" && res.data?.infoBlockedUntil) {
        setProfessionalInfoBlockedUntil(res.data.infoBlockedUntil);
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
    if (isProfessionalInfoBlocked) return;
    try {
      const res = await api.put<{ success?: boolean; infoBlockedUntil?: string }>(`/professionals/credentials/${user.id}`, { cedula: credentialsCedula, registro: credentialsRegistro });
      if (res.success) {
        setProfessionalInfoBlockedUntil(res.data?.infoBlockedUntil ?? null);
        setCredentialsSaved(true);
        setTimeout(() => setCredentialsSaved(false), 2000);
      } else if (res.error === "cooldown" && res.data?.infoBlockedUntil) {
        setProfessionalInfoBlockedUntil(res.data.infoBlockedUntil);
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
      setMyReceptionists([{ ...u, isBlocked: false, isEnabled: true }]);
      setReceptionistForm({ name: "", email: "", password: "" });
      setReceptionistSuccess(true);
      setTimeout(() => setReceptionistSuccess(false), 3000);
    } else {
      setReceptionistError(res.error ?? (res.data as { error?: string; message?: string })?.error ?? (res.data as { message?: string })?.message ?? t.settings.receptionist.createError);
    }
  };

  const handleSaveAssignedPodiatrists = async () => {
    if (!isReceptionist || !user?.id) return;
    try {
      const res = await api.patch<{ success?: boolean; assignedPodiatristIds?: string[] }>(
        `/receptionists/${user.id}/assigned-podiatrists`,
        { assignedPodiatristIds }
      );
      if (res.success) {
        const ids = res.data?.assignedPodiatristIds ?? assignedPodiatristIds;
        updateUser({ assignedPodiatristIds: ids });
        setAssignedPodiatristsSaved(true);
        setTimeout(() => setAssignedPodiatristsSaved(false), 2000);
      }
    } catch {
      // No marcar como guardado si la API falla
    }
  };

  const handleToggleMyReceptionistBlock = async (rec: { id: string; isBlocked?: boolean }) => {
    try {
      setReceptionistActionLoadingId(rec.id);
      const endpoint = rec.isBlocked ? `/users/${rec.id}/unblock` : `/users/${rec.id}/block`;
      await api.post(endpoint);
      await loadMyReceptionists();
    } catch (err) {
      console.error("Error cambiando bloqueo de recepcionista:", err);
    } finally {
      setReceptionistActionLoadingId(null);
    }
  };

  const handleToggleMyReceptionistEnabled = async (rec: { id: string; isEnabled?: boolean }) => {
    try {
      setReceptionistActionLoadingId(rec.id);
      const endpoint = rec.isEnabled === false ? `/users/${rec.id}/enable` : `/users/${rec.id}/disable`;
      await api.post(endpoint);
      await loadMyReceptionists();
    } catch (err) {
      console.error("Error cambiando estado de recepcionista:", err);
    } finally {
      setReceptionistActionLoadingId(null);
    }
  };

  const handleDeleteMyReceptionist = async (rec: { id: string; name: string; email: string }) => {
    if (!window.confirm(t.settings.receptionist.confirmDelete)) return;
    try {
      setReceptionistActionLoadingId(rec.id);
      await api.delete(`/users/${rec.id}`);
      setMyReceptionists([]);
    } catch (err) {
      console.error("Error eliminando recepcionista:", err);
    } finally {
      setReceptionistActionLoadingId(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadLogo || isLogoBlocked) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setLogoError(t.settings.logo.errors.invalidFormat);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError(t.settings.logo.errors.tooLarge);
      return;
    }

    setLogoError(null);
    try {
      const base64 = await compressImageForLogo(file);
      setLogoPreview(base64);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : t.settings.logo.errors.processFailed);
    }
  };

  const handleSaveLogo = async () => {
    if (!canUploadLogo || !logoPreview || !user?.clinicId || isLogoBlocked) return;
    try {
      const res = await api.put<{ success?: boolean; logo?: string | null; logoBlockedUntil?: string; message?: string }>(`/clinics/${user.clinicId}/logo`, { logo: logoPreview });
      if (res.success) {
        const savedLogo =
          res.data?.logo ??
          (await api.get<{ success?: boolean; logo?: string | null }>(`/clinics/${user.clinicId}/logo`)).data?.logo ??
          logoPreview;
        setCurrentLogo(savedLogo);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setLogoBlockedUntil(res.data?.logoBlockedUntil ?? null);
        setLogoError(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        window.dispatchEvent(new CustomEvent("clinic-logo:updated"));
      } else if (res.error === "cooldown" && res.data?.logoBlockedUntil) {
        setLogoBlockedUntil(res.data.logoBlockedUntil);
        setLogoError(res.message ?? t.settings.logo.errors.cooldown);
      } else {
        // Antes se ignoraba en silencio: el usuario creía haber guardado y al recargar no persistía.
        setLogoError(res.message ?? res.error ?? t.settings.logo.errors.saveFailed);
      }
    } catch {
      setLogoError(t.settings.logo.errors.saveFailed);
    }
  };

  const handleRemoveLogo = async () => {
    if (!canUploadLogo || !user?.clinicId || isLogoBlocked) return;
    const res = await api.delete<{ success?: boolean; logoBlockedUntil?: string; message?: string }>(`/clinics/${user.clinicId}/logo`);
    if (res.success) {
      setCurrentLogo(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLogoBlockedUntil(res.data?.logoBlockedUntil ?? null);
      setLogoError(null);
      window.dispatchEvent(new CustomEvent("clinic-logo:updated"));
    } else if (res.error === "cooldown" && res.data?.logoBlockedUntil) {
      setLogoBlockedUntil(res.data.logoBlockedUntil);
      setLogoError(res.message ?? t.settings.logo.errors.cooldown);
    } else {
      setLogoError(res.message ?? res.error ?? t.settings.logo.errors.saveFailed);
    }
  };

  // Professional logo upload handler for independent podiatrists
  const handleProfessionalLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPodiatristIndependent || isLogoBlocked) return;

    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setLogoError(t.settings.logo.errors.invalidFormat);
      input.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoError(t.settings.logo.errors.tooLarge);
      input.value = "";
      return;
    }

    setLogoError(null);
    try {
      const base64 = await compressImageForLogo(file);
      setLogoPreview(base64);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : t.settings.logo.errors.processFailed);
    } finally {
      input.value = "";
    }
  };

  const handleSaveProfessionalLogo = async () => {
    if (!isPodiatristIndependent || !logoPreview || !user?.id || isLogoBlocked) return;
    const res = await api.put<{ success?: boolean; logo?: string | null; logoBlockedUntil?: string; message?: string }>(
      `/professionals/logo/${user.id}`,
      { logo: logoPreview }
    );
    if (res.success) {
      const savedLogo =
        res.data?.logo ??
        (await api.get<{ success?: boolean; logo?: string | null }>(`/professionals/logo/${user.id}`)).data?.logo ??
        logoPreview;
      setCurrentLogo(savedLogo);
      setLogoPreview(null);
      setLogoBlockedUntil(res.data?.logoBlockedUntil ?? null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      window.dispatchEvent(new CustomEvent("clinic-logo:updated"));
    } else if (res.error === "cooldown" && res.data?.logoBlockedUntil) {
      setLogoBlockedUntil(res.data.logoBlockedUntil);
      setLogoError(res.message ?? t.settings.logo.errors.cooldown);
    } else {
      setLogoError(res.message ?? t.settings.logo.errors.saveFailed);
    }
  };

  const handleRemoveProfessionalLogo = async () => {
    if (!isPodiatristIndependent || !user?.id || isLogoBlocked) return;
    const res = await api.delete<{ success?: boolean; logoBlockedUntil?: string; message?: string }>(
      `/professionals/logo/${user.id}`
    );
    if (res.success) {
      setCurrentLogo(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLogoBlockedUntil(res.data?.logoBlockedUntil ?? null);
      window.dispatchEvent(new CustomEvent("clinic-logo:updated"));
    } else if (res.error === "cooldown" && res.data?.logoBlockedUntil) {
      setLogoBlockedUntil(res.data.logoBlockedUntil);
      setLogoError(res.message ?? t.settings.logo.errors.cooldown);
    }
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
      <div className={`${activeTab === "clinical" ? "max-w-5xl" : "max-w-2xl"} space-y-8`}>
        <SettingsTabBar
          active={activeTab}
          onChange={handleTabChange}
          tabs={[
            { id: "general", label: t.settings.tabs.profile },
            { id: "clinical", label: t.settings.tabs.clinicalHistory, visible: showClinicalTab },
            { id: "integrations", label: t.settings.tabs.integrations, visible: canConfigureWhatsApp },
            { id: "clinic", label: t.settings.tabs.clinic, visible: showClinicTab },
            { id: "billing", label: t.settings.tabs.billing, visible: showBillingTab },
          ]}
        />

        {activeTab === "billing" && showBillingTab && <BillingSettingsSection />}

        {activeTab === "clinical" && showClinicalTab && (
          <div className="space-y-8">
            <ClinicalLayoutSettingsSection />
            <PrintSettingsSection />
          </div>
        )}

        {activeTab === "integrations" && canConfigureWhatsApp && <WhatsAppSettingsSection />}

        {activeTab === "general" && (
        <>
        {/* Theme - todos los usuarios */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
          <h3 className="text-lg font-semibold text-brand-ink mb-4">{t.settings.theme}</h3>
          <div className="flex items-center gap-4">
            <AnimatedThemeToggler />
            <span className="text-sm text-brand-muted">
              {isDarkMode ? t.settings.lightMode : t.settings.darkMode}
            </span>
          </div>
        </div>

        <ColorPaletteSettingsSection />

        <SidebarNavSettingsSection />

        <WorkspaceWatermarkSettingsSection />

        {/* Language Settings */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
          <h3 className="text-lg font-semibold text-brand-ink mb-4">{t.settings.language}</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  language === lang
                    ? "bg-brand-ink text-brand-ink-fg"
                    : "bg-brand-canvas text-brand-muted hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
          <h3 className="text-lg font-semibold text-brand-ink mb-4">{t.settings.profile.title}</h3>

          <EditCooldownNotice policyText={profileCooldownPolicy} className="!mb-4" />
          
          <div className="space-y-4">
            <ProfileAvatarSettingsSection />

            <div className="pt-4 border-t border-brand-border">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.settings.profile.name}</label>
                  <input
                    type="text"
                    value={user?.name || ""}
                    disabled
                    className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t.settings.profile.email}</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-xs text-brand-muted mt-3">
                {t.settings.profile.readOnlyHint}
              </p>
            </div>
          </div>
        </div>

        {/* Contactar PodoAdmin - mensajería bidireccional con soporte (no admin/super_admin) */}
        {!isAdminRole && (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-lg font-semibold text-brand-ink mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"
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
                      className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={supportSending}
                    className="px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover disabled:opacity-50"
                  >
                    {supportSending ? t.settings.common.ellipsis : t.support.send}
                  </button>
                </form>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-medium text-brand-ink mb-3">{t.support.myConversations}</h4>
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
                            <span className="font-medium text-brand-ink">{c.subject}</span>
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
                  className="text-sm text-gray-500 hover:text-brand-ink dark:hover:text-white mb-4 flex items-center gap-1"
                >
                  ← {t.common.back}
                </button>
                <h4 className="font-medium text-brand-ink mb-4">{selectedSupportConv.subject}</h4>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto form-modal-scroll">
                  {selectedSupportConv.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg ${m.isFromSupport ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"}`}
                    >
                      <p className="text-xs text-gray-500 mb-1">{m.isFromSupport ? t.settings.supportSenderLabel : user?.name} · {new Date(m.createdAt).toLocaleString()}</p>
                      <p className="text-sm text-brand-ink whitespace-pre-wrap">{m.body}</p>
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
                      className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink resize-none"
                    />
                    <button
                      onClick={handleSendSupportReply}
                      disabled={supportSending || !supportReply.trim()}
                      className="px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg font-medium hover:bg-brand-ink-hover disabled:opacity-50 self-end"
                    >
                      {supportSending ? t.settings.common.ellipsis : t.support.reply}
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
            <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
              <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.settings.assignedPodiatrists.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {isFromClinic
                  ? t.settings.assignedPodiatrists.clinicHint
                  : t.settings.assignedPodiatrists.independentHint}
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
                            className="rounded border-gray-300 text-brand-ink focus:ring-brand-ink"
                          />
                          <span className="font-medium text-brand-ink">{pod.name}</span>
                          <span className="text-sm text-gray-500">{pod.email}</span>
                        </label>
                      );
                    })}
                  </div>
                  {clinicPodiatrists.length === 0 ? (
                    <p className="text-sm text-gray-500">{t.settings.assignedPodiatrists.emptyClinic}</p>
                  ) : (
                    <div className="flex items-center gap-4 pt-2">
                      <button
                        onClick={handleSaveAssignedPodiatrists}
                        className="px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors"
                      >
                        {t.settings.assignedPodiatrists.save}
                      </button>
                      {assignedPodiatristsSaved && (
                        <span className={`${formSuccessClass} font-medium`}>{t.settings.common.saved}</span>
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
                        <p key={u.id} className="font-medium text-brand-ink">
                          {u.name} <span className="text-gray-500 font-normal">({u.email})</span>
                        </p>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">{t.settings.assignedPodiatrists.empty}</p>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Info for Super Admin and Admin - no clinic logo */}
        {isAdminRole && (
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-600 font-medium">{t.settings.adminLogo.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t.settings.adminLogo.body.replace("{role}", user?.role === "super_admin" ? t.roles.superAdmin : t.roles.admin)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Confirmation */}
        {saved && (
          <div className={`flex items-center gap-2 ${formSuccessClass} font-medium`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t.settings.settingsSaved}
          </div>
        )}
        </>
        )}

        {activeTab === "clinic" && showClinicTab && (
        <>
        {/* Clinic Logo Upload - Only for Clinic Admin and Podiatrist with clinic */}
        {(canUploadLogo || isPodiatristWithClinic) && (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.settings.clinicLogo.title}</h3>

            {isPodiatristWithClinic ? (
              <div className="space-y-4">
                <div className={`${semanticAlertInfoClass} !p-4 flex items-start gap-3`}>
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">{t.settings.clinicLogo.sharedTitle}</p>
                    <p className="mt-1">
                      {t.settings.clinicLogo.sharedBody}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-40 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                    {currentLogo ? (
                      <img 
                        src={currentLogo} 
                        alt={t.settings.clinicLogo.alt} 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400 mt-1 block">{t.settings.logo.empty}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm">{t.settings.common.readOnly}</span>
                    </div>
                  </div>
                </div>
                <DashboardLogoSettingsSection logoUrl={currentLogo} readOnly />
              </div>
            ) : canUploadLogo ? (
              // Clinic Admin can upload their clinic's logo
              <>
                <EditCooldownNotice
                  policyText={logoCooldownPolicy}
                  blockedUntil={logoBlockedUntil}
                  blockedText={
                    isLogoBlocked ? logoCooldownBlocked(formatBlockedUntil(logoBlockedUntil!)) : undefined
                  }
                />
                <p className="text-sm text-gray-500 mb-4">
                  {t.settings.clinicLogo.uploadHint}
                </p>
                
                <div className="space-y-4">
                  {/* Current/Preview Logo */}
                  <div className="flex items-center gap-6">
                    <div className="w-40 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt={t.settings.logo.previewAlt} 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : currentLogo ? (
                        <img 
                          src={currentLogo} 
                          alt={t.settings.clinicLogo.alt} 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-400 mt-1 block">{t.settings.logo.empty}</span>
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
                        disabled={isLogoBlocked}
                      />
                      <label
                        htmlFor={isLogoBlocked ? undefined : "logo-upload"}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isLogoBlocked ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-brand-canvas text-brand-ink hover:bg-gray-200 cursor-pointer"}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        {t.settings.logo.upload}
                      </label>
                      
                      {logoError && (
                        <p className={`${formErrorClass} mt-2`}>{logoError}</p>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-2">
                        {t.settings.logo.formatHint}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {(logoPreview || currentLogo) && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      {logoPreview && (
                        <button
                          onClick={handleSaveLogo}
                          disabled={isLogoBlocked}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLogoBlocked ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover"}`}
                        >
                          {t.settings.logo.save}
                        </button>
                      )}
                      {logoPreview && (
                        <button
                          onClick={() => {
                            setLogoPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="px-4 py-2 bg-brand-canvas text-brand-ink rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          {t.common.cancel}
                        </button>
                      )}
                      {currentLogo && !logoPreview && (
                        <button
                          onClick={handleRemoveLogo}
                          disabled={isLogoBlocked}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLogoBlocked ? "text-gray-400 cursor-not-allowed" : semanticDestructiveTextClass}`}
                        >
                          {t.settings.logo.remove}
                        </button>
                      )}
                    </div>
                  )}
                  <DashboardLogoSettingsSection logoUrl={currentLogo || logoPreview} />
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Professional Logo Upload - Only for Independent Podiatrists (no clinic) */}
        {isPodiatristIndependent && (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.settings.professionalLogo.title}</h3>
            <EditCooldownNotice
              policyText={logoCooldownPolicy}
              blockedUntil={logoBlockedUntil}
              blockedText={
                isLogoBlocked ? logoCooldownBlocked(formatBlockedUntil(logoBlockedUntil!)) : undefined
              }
            />
            <p className="text-sm text-gray-500 mb-4">
              {t.settings.professionalLogo.uploadHint}
            </p>
            
            <div className="space-y-4">
              {/* Current/Preview Logo */}
              <div className="flex items-center gap-6">
                <div className="w-40 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt={t.settings.logo.previewAlt} 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : currentLogo ? (
                    <img 
                      src={currentLogo} 
                      alt={t.settings.professionalLogo.alt} 
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-400 mt-1 block">{t.settings.logo.empty}</span>
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
                    disabled={isLogoBlocked}
                  />
                  <label
                    htmlFor={isLogoBlocked ? undefined : "professional-logo-upload"}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isLogoBlocked ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-brand-canvas text-brand-ink hover:bg-gray-200 cursor-pointer"}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {t.settings.logo.upload}
                  </label>
                  
                  {logoError && (
                    <p className={`${formErrorClass} mt-2`}>{logoError}</p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-2">
                    {t.settings.logo.formatHint}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {(logoPreview || currentLogo) && (
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  {logoPreview && (
                    <button
                      onClick={handleSaveProfessionalLogo}
                      disabled={isLogoBlocked}
                      className="px-4 py-2 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.settings.logo.save}
                    </button>
                  )}
                  {logoPreview && (
                    <button
                      onClick={() => {
                        setLogoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="px-4 py-2 bg-brand-canvas text-brand-ink rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      {t.common.cancel}
                    </button>
                  )}
                  {currentLogo && !logoPreview && (
                    <button
                      onClick={handleRemoveProfessionalLogo}
                      disabled={isLogoBlocked}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isLogoBlocked ? "text-gray-400 cursor-not-allowed" : semanticDestructiveTextClass}`}
                    >
                      {t.settings.logo.remove}
                    </button>
                  )}
                </div>
              )}
              <DashboardLogoSettingsSection logoUrl={currentLogo || logoPreview} />
            </div>
          </div>
        )}

        {/* Consentimiento informado - Misma lógica que Logo: clinic_admin edita, podólogo clínica solo lectura, independiente edita */}
        {(canUploadLogo || isPodiatristWithClinic || isPodiatristIndependent) && (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.settings.consent.title}</h3>

            {/* Clínica: admin edita, podólogo con clínica solo lectura */}
            {isPodiatristWithClinic && userClinic && (
              <div className="space-y-4">
                <EditCooldownNotice policyText={clinicReadOnlyPolicy} className="!mb-0" />
                <div className={`${semanticAlertInfoClass} !p-4 flex items-start gap-3`}>
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">{t.settings.consent.sharedTitle}</p>
                    <p className="mt-1">
                      {t.settings.consent.sharedBody}
                    </p>
                  </div>
                </div>
                {(userClinic.consentTextVersion ?? 0) > 0 && (
                  <p className="text-xs text-gray-500">{t.settings.consent.currentVersion.replace("{version}", String(userClinic.consentTextVersion))}</p>
                )}
                <div className="rounded-lg border border-brand-border bg-brand-canvas p-4 text-brand-ink">
                  <p className="text-sm text-brand-ink whitespace-pre-wrap">
                    {userClinic.consentText?.trim() || t.settings.consent.empty}
                  </p>
                </div>
              </div>
            )}
            {canUploadLogo && user?.clinicId && (
              <>
                <EditCooldownNotice
                  policyText={clinicInfoCooldownPolicy}
                  blockedUntil={infoBlockedUntil}
                  blockedText={
                    isInfoBlocked ? clinicInfoCooldownBlocked(formatBlockedUntil(infoBlockedUntil!)) : undefined
                  }
                />
                <p className="text-sm text-gray-500 mb-4">
                  {t.settings.consent.editHint}
                </p>
                {(userClinic?.consentTextVersion ?? 0) > 0 && (
                  <p className="text-xs text-gray-500 mb-2">{t.settings.consent.currentVersion.replace("{version}", String(userClinic?.consentTextVersion ?? ""))}</p>
                )}
                <textarea
                  value={clinicInfoForm.consentText ?? ""}
                  onChange={(e) => handleClinicInfoChange("consentText", e.target.value)}
                  placeholder={t.settings.consent.placeholder}
                  rows={6}
                  disabled={isInfoBlocked}
                  className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all resize-y ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                />
                {clinicConsentError && (
                  <p className={`${formErrorClass} mt-2`}>{clinicConsentError}</p>
                )}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSaveClinicConsent}
                    disabled={isInfoBlocked}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isInfoBlocked ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover"}`}
                  >
                    {t.settings.consent.save}
                  </button>
                  {clinicConsentSaved && (
                    <span className={`flex items-center gap-2 ${formSuccessClass} font-medium`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.settings.common.saved}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Podólogo independiente: edita su propio texto */}
            {isPodiatristIndependent && (
              <>
                <EditCooldownNotice
                  policyText={professionalInfoCooldownPolicy}
                  blockedUntil={professionalInfoBlockedUntil}
                  blockedText={
                    isProfessionalInfoBlocked
                      ? professionalInfoCooldownBlocked(formatBlockedUntil(professionalInfoBlockedUntil!))
                      : undefined
                  }
                />
                <p className="text-sm text-gray-500 mb-4">
                  {t.settings.consent.editHint}
                </p>
                {(professionalInfoForm.consentTextVersion ?? 0) > 0 && (
                  <p className="text-xs text-gray-500 mb-2">{t.settings.consent.currentVersion.replace("{version}", String(professionalInfoForm.consentTextVersion))}</p>
                )}
                <textarea
                  value={professionalInfoForm.consentText ?? ""}
                  onChange={(e) => handleProfessionalInfoChange("consentText", e.target.value)}
                  placeholder={t.settings.consent.placeholder}
                  rows={6}
                  disabled={isProfessionalInfoBlocked}
                  className={`w-full px-4 py-2.5 border border-brand-border rounded-lg transition-all resize-y ${isProfessionalInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                />
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveProfessionalInfo}
                    disabled={isProfessionalInfoBlocked}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isProfessionalInfoBlocked ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover"}`}
                  >
                    {t.settings.consent.save}
                  </button>
                  {professionalInfoSaved && (
                    <span className={`flex items-center gap-2 ${formSuccessClass} font-medium`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.settings.common.saved}
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
          const rec = myReceptionists[0];
          return (
            <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
              <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.settings.receptionist.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {t.settings.receptionist.description}
              </p>
              {hasReceptionist && rec ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <p className="font-medium text-brand-ink">{rec.name}</p>
                    <p className="text-sm text-gray-600">{rec.email}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {rec.isBlocked ? (
                        <span className={semanticChipErrorClass}>{t.settings.receptionist.status.blocked}</span>
                      ) : rec.isEnabled === false ? (
                        <span className={semanticChipWarningClass}>{t.settings.receptionist.status.disabled}</span>
                      ) : (
                        <span className={semanticChipSuccessClass}>{t.settings.receptionist.status.active}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleMyReceptionistBlock(rec)}
                      disabled={receptionistActionLoadingId === rec.id}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {rec.isBlocked ? t.settings.receptionist.unblock : t.settings.receptionist.block}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMyReceptionistEnabled(rec)}
                      disabled={receptionistActionLoadingId === rec.id}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {rec.isEnabled === false ? t.settings.receptionist.enable : t.settings.receptionist.disable}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMyReceptionist(rec)}
                      disabled={receptionistActionLoadingId === rec.id}
                      className={`px-3 py-1.5 text-xs rounded-lg border border-semantic-error/30 ${semanticDestructiveTextClass} disabled:opacity-50`}
                    >
                      {t.settings.receptionist.delete}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{t.settings.receptionist.oneOnlyHint}</p>
                </div>
              ) : (
                <form onSubmit={handleCreateReceptionist} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.receptionist.fields.name}</label>
                    <input
                      type="text"
                      value={receptionistForm.name}
                      onChange={(e) => setReceptionistForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.receptionist.fields.email}</label>
                    <input
                      type="email"
                      value={receptionistForm.email}
                      onChange={(e) => setReceptionistForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.receptionist.fields.initialPassword}</label>
                    <input
                      type="password"
                      value={receptionistForm.password}
                      onChange={(e) => setReceptionistForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-brand-border rounded-lg bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"
                      required
                      minLength={6}
                    />
                  </div>
                  {receptionistError && (
                    <div className={`${semanticAlertErrorClass} !p-3`}>{receptionistError}</div>
                  )}
                  {receptionistSuccess && (
                    <div className={`${semanticAlertSuccessClass} !p-3`}>
                      {t.settings.receptionist.createdSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-brand-ink text-brand-ink-fg rounded-lg text-sm font-medium hover:bg-brand-ink-hover transition-colors"
                  >
                    {t.settings.receptionist.create}
                  </button>
                </form>
              )}
            </div>
          );
        })()}
        
        {/* Clinic Information - Only for Clinic Admin (editable) or Podiatrists with clinic (read-only) */}
        {(canUploadLogo || isPodiatristWithClinic) && userClinic && (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.settings.clinicInfo.title}</h3>
            
            {canUploadLogo ? (
              // Clinic Admin can edit clinic information
              <div className="space-y-4">
                <EditCooldownNotice
                  policyText={clinicInfoCooldownPolicy}
                  blockedUntil={infoBlockedUntil}
                  blockedText={
                    isInfoBlocked ? clinicInfoCooldownBlocked(formatBlockedUntil(infoBlockedUntil!)) : undefined
                  }
                  className="!mb-0"
                />
                <p className="text-sm text-gray-500">
                  {t.settings.clinicInfo.subtitle}
                </p>
                {(clinicInfoForm.clinicName === "Clínica pendiente de configuración" || !clinicInfoForm.phone && !clinicInfoForm.email && !clinicInfoForm.address) && (
                  <div className={`${semanticAlertInfoClass} !p-3`}>
                    {t.settings.clinicInfo.setupBanner}
                  </div>
                )}
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.clinicName}</label>
                    <input
                      type="text"
                      value={clinicInfoForm.clinicName}
                      onChange={(e) => handleClinicInfoChange("clinicName", e.target.value)}
                      placeholder={t.settings.clinicInfo.clinicNamePlaceholder}
                      disabled={isInfoBlocked}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.clinicCode}</label>
                    <input
                      type="text"
                      value={clinicInfoForm.clinicCode}
                      onChange={(e) => handleClinicInfoChange("clinicCode", e.target.value.toUpperCase())}
                      placeholder={t.settings.clinicInfo.clinicCodePlaceholder}
                      maxLength={8}
                      disabled={isInfoBlocked}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t.settings.clinicInfo.clinicCodeHint}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.country}</label>
                    <CountrySelect
                      value={clinicInfoForm.countryCode}
                      onChange={(code) => handleClinicInfoChange("countryCode", code)}
                      disabled={isInfoBlocked}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t.settings.clinicInfo.countryHint}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.phone}</label>
                      <input
                        type="tel"
                        value={clinicInfoForm.phone}
                        onChange={(e) => handleClinicInfoChange("phone", e.target.value)}
                        placeholder={phonePlaceholderForCountry(resolveTenantCountryCode(clinicInfoForm.countryCode))}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.receptionist.fields.email}</label>
                      <input
                        type="email"
                        value={clinicInfoForm.email}
                        onChange={(e) => handleClinicInfoChange("email", e.target.value)}
                        placeholder={t.settings.clinicInfo.emailPlaceholder}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.address}</label>
                    <input
                      type="text"
                      value={clinicInfoForm.address}
                      onChange={(e) => handleClinicInfoChange("address", e.target.value)}
                      placeholder={t.settings.clinicInfo.addressPlaceholder}
                      disabled={isInfoBlocked}
                      className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.city}</label>
                      <input
                        type="text"
                        value={clinicInfoForm.city}
                        onChange={(e) => handleClinicInfoChange("city", e.target.value)}
                        placeholder={t.settings.clinicInfo.cityPlaceholder}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.postalCode}</label>
                      <input
                        type="text"
                        value={clinicInfoForm.postalCode}
                        onChange={(e) => handleClinicInfoChange("postalCode", e.target.value)}
                        placeholder={t.settings.clinicInfo.postalCodePlaceholder}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.licenseNumber}</label>
                      <input
                        type="text"
                        value={clinicInfoForm.licenseNumber}
                        onChange={(e) => handleClinicInfoChange("licenseNumber", e.target.value)}
                        placeholder={t.settings.clinicInfo.licensePlaceholder}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.website}</label>
                      <input
                        type="url"
                        value={clinicInfoForm.website}
                        onChange={(e) => handleClinicInfoChange("website", e.target.value)}
                        placeholder={t.settings.clinicInfo.websitePlaceholder}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg transition-all ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink focus:ring-2 focus:ring-brand-ink focus:border-transparent"}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.legalName}</label>
                      <input
                        type="text"
                        value={clinicInfoForm.legalName}
                        onChange={(e) => handleClinicInfoChange("legalName", e.target.value)}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.rfc}</label>
                      <input
                        type="text"
                        value={clinicInfoForm.rfc}
                        onChange={(e) => handleClinicInfoChange("rfc", e.target.value.toUpperCase())}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.clues}</label>
                      <input
                        type="text"
                        value={clinicInfoForm.clues}
                        onChange={(e) => handleClinicInfoChange("clues", e.target.value)}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.cofepris}</label>
                      <input
                        type="text"
                        value={clinicInfoForm.cofeprisRegistration}
                        onChange={(e) => handleClinicInfoChange("cofeprisRegistration", e.target.value)}
                        disabled={isInfoBlocked}
                        className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg ${isInfoBlocked ? "bg-brand-canvas text-brand-muted cursor-not-allowed" : "bg-brand-surface text-brand-ink"}`}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    {clinicInfoError && (
                      <p className={formErrorClass}>{clinicInfoError}</p>
                    )}
                    <div className="flex items-center gap-4">
                    <button
                      onClick={handleSaveClinicInfo}
                      disabled={isInfoBlocked}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${isInfoBlocked ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover"}`}
                    >
                      {t.settings.common.saveInfo}
                    </button>
                    {clinicInfoSaved && (
                      <span className={`flex items-center gap-2 ${formSuccessClass} font-medium`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t.settings.common.saved}
                      </span>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Podiatrists view clinic info as read-only
              <div className="space-y-4">
                <EditCooldownNotice policyText={clinicReadOnlyPolicy} className="!mb-0" />
                <div className={`${semanticAlertInfoClass} !p-4 flex items-start gap-3`}>
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">{t.settings.clinicInfo.readOnlyTitle}</p>
                    <p className="mt-1">
                      {t.settings.clinicInfo.readOnlyBody}
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-3 text-sm">
                  <div className="flex">
                    <span className="w-32 text-gray-500">{t.settings.clinicInfo.labels.name}</span>
                    <span className="font-medium text-brand-ink">{userClinic.clinicName}</span>
                  </div>
                  {userClinic.phone && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">{t.settings.clinicInfo.labels.phone}</span>
                      <span className="font-medium text-brand-ink">{userClinic.phone}</span>
                    </div>
                  )}
                  {userClinic.email && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">{t.settings.clinicInfo.labels.email}</span>
                      <span className="font-medium text-brand-ink">{userClinic.email}</span>
                    </div>
                  )}
                  {userClinic.address && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">{t.settings.clinicInfo.labels.address}</span>
                      <span className="font-medium text-brand-ink">
                        {userClinic.address}{userClinic.city && `, ${userClinic.city}`}{userClinic.postalCode && ` ${userClinic.postalCode}`}
                      </span>
                    </div>
                  )}
                  {userClinic.licenseNumber && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">{t.settings.clinicInfo.labels.license}</span>
                      <span className="font-medium text-brand-ink">{userClinic.licenseNumber}</span>
                    </div>
                  )}
                  {userClinic.consentDocumentUrl && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">{t.settings.clinicInfo.labels.consent}</span>
                      <a
                        href={userClinic.consentDocumentUrl.startsWith('http') ? userClinic.consentDocumentUrl : `https://${userClinic.consentDocumentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {t.settings.clinicInfo.viewDocument}
                      </a>
                    </div>
                  )}
                  {userClinic.website && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">{t.settings.clinicInfo.labels.web}</span>
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
                            alert(t.settings.clinic.errors.invalidWebsite);
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
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.settings.practice.title}</h3>
            <EditCooldownNotice
              policyText={professionalInfoCooldownPolicy}
              blockedUntil={professionalInfoBlockedUntil}
              blockedText={
                isProfessionalInfoBlocked
                  ? professionalInfoCooldownBlocked(formatBlockedUntil(professionalInfoBlockedUntil!))
                  : undefined
              }
            />
            <p className="text-sm text-gray-500 mb-4">
              {t.settings.practice.subtitle}
            </p>
            
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.practice.professionalName}</label>
                  <input
                    type="text"
                    value={professionalInfoForm.name}
                    onChange={(e) => handleProfessionalInfoChange("name", e.target.value)}
                    placeholder={t.settings.practice.namePlaceholder}
                    disabled={isProfessionalInfoBlocked}
                    className={proInfoInputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.country}</label>
                  <CountrySelect
                    value={professionalInfoForm.countryCode || DEFAULT_TENANT_COUNTRY}
                    onChange={(code) => handleProfessionalInfoChange("countryCode", code)}
                    disabled={isProfessionalInfoBlocked}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t.settings.practice.countryHint}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.phone}</label>
                    <input
                      type="tel"
                      value={professionalInfoForm.phone}
                      onChange={(e) => handleProfessionalInfoChange("phone", e.target.value)}
                      placeholder={phonePlaceholderForCountry(
                        resolveTenantCountryCode(professionalInfoForm.countryCode)
                      )}
                      className={proInfoInputClass}
                      disabled={isProfessionalInfoBlocked}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.receptionist.fields.email}</label>
                    <input
                      type="email"
                      value={professionalInfoForm.email}
                      onChange={(e) => handleProfessionalInfoChange("email", e.target.value)}
                      placeholder={t.settings.practice.emailPlaceholder}
                      className={proInfoInputClass}
                      disabled={isProfessionalInfoBlocked}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.address}</label>
                  <input
                    type="text"
                    value={professionalInfoForm.address}
                    onChange={(e) => handleProfessionalInfoChange("address", e.target.value)}
                    placeholder={t.settings.clinicInfo.addressPlaceholder}
                    disabled={isProfessionalInfoBlocked}
                    className={proInfoInputClass}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.city}</label>
                    <input
                      type="text"
                      value={professionalInfoForm.city}
                      onChange={(e) => handleProfessionalInfoChange("city", e.target.value)}
                      placeholder={t.settings.clinicInfo.cityPlaceholder}
                      disabled={isProfessionalInfoBlocked}
                      className={proInfoInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.clinicInfo.postalCode}</label>
                    <input
                      type="text"
                      value={professionalInfoForm.postalCode}
                      onChange={(e) => handleProfessionalInfoChange("postalCode", e.target.value)}
                      placeholder={t.settings.clinicInfo.postalCodePlaceholder}
                      disabled={isProfessionalInfoBlocked}
                      className={proInfoInputClass}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.practice.sanitaryRegistry}</label>
                    <input
                      type="text"
                      value={professionalInfoForm.licenseNumber}
                      onChange={(e) => handleProfessionalInfoChange("licenseNumber", e.target.value)}
                      placeholder={t.settings.clinicInfo.licensePlaceholder}
                      disabled={isProfessionalInfoBlocked}
                      className={proInfoInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.practice.cedula}</label>
                    <input
                      type="text"
                      value={professionalInfoForm.professionalLicense}
                      onChange={(e) => handleProfessionalInfoChange("professionalLicense", e.target.value)}
                      placeholder={t.settings.practice.cedulaPlaceholder}
                      disabled={isProfessionalInfoBlocked}
                      className={proInfoInputClass}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveProfessionalInfo}
                    disabled={isProfessionalInfoBlocked}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${isProfessionalInfoBlocked ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover"}`}
                  >
                    {t.settings.common.saveInfo}
                  </button>
                  {professionalInfoSaved && (
                    <span className={`flex items-center gap-2 ${formSuccessClass} font-medium`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t.settings.common.saved}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Professional Credentials - For Podiatrists with Clinic */}
        {isPodiatristWithClinic && userClinic && (
          <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
            <h3 className="text-lg font-semibold text-brand-ink mb-2">{t.settings.credentials.title}</h3>
            <EditCooldownNotice
              policyText={professionalInfoCooldownPolicy}
              blockedUntil={professionalInfoBlockedUntil}
              blockedText={
                isProfessionalInfoBlocked
                  ? professionalInfoCooldownBlocked(formatBlockedUntil(professionalInfoBlockedUntil!))
                  : undefined
              }
            />
            <p className="text-sm text-gray-500 mb-4">
              {t.settings.credentials.subtitle}
            </p>
            
            <div className="space-y-6">
              <div className={`${whatsappPanelInnerClass} space-y-4`}>
                <div>
                  <h4 className="text-sm font-semibold text-brand-ink">{t.settings.credentials.contactPhoneTitle}</h4>
                  <p className="text-xs text-brand-muted mt-1">
                    {t.settings.credentials.contactPhoneHint}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.credentials.country}</label>
                  <CountrySelect
                    value={professionalInfoForm.countryCode || DEFAULT_TENANT_COUNTRY}
                    onChange={(code) => handleProfessionalInfoChange("countryCode", code)}
                    disabled={isProfessionalInfoBlocked}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.credentials.mobile}</label>
                  <input
                    type="tel"
                    value={professionalInfoForm.phone}
                    onChange={(e) => handleProfessionalInfoChange("phone", e.target.value)}
                    placeholder={phonePlaceholderForCountry(
                      resolveTenantCountryCode(professionalInfoForm.countryCode)
                    )}
                    disabled={isProfessionalInfoBlocked}
                    className={proInfoInputClass}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleSaveProfessionalInfo}
                    disabled={isProfessionalInfoBlocked}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isProfessionalInfoBlocked ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover"}`}
                  >
                    {t.settings.credentials.savePhone}
                  </button>
                  {professionalInfoSaved && (
                    <span className={`${formSuccessClass} font-medium`}>{t.settings.common.saved}</span>
                  )}
                </div>
              </div>

              {/* Editable credentials */}
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.practice.cedula}</label>
                  <input
                    type="text"
                    value={credentialsCedula}
                    onChange={(e) => setCredentialsCedula(e.target.value)}
                    placeholder={t.settings.practice.cedulaPlaceholder}
                    disabled={isProfessionalInfoBlocked}
                    className={proInfoInputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.credentials.registryNumber}</label>
                  <input
                    type="text"
                    value={credentialsRegistro}
                    onChange={(e) => setCredentialsRegistro(e.target.value)}
                    placeholder={t.settings.credentials.registryPlaceholder}
                    disabled={isProfessionalInfoBlocked}
                    className={proInfoInputClass}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSaveCredentials}
                  disabled={isProfessionalInfoBlocked}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${isProfessionalInfoBlocked ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover"}`}
                >
                  {t.settings.credentials.save}
                </button>
                {credentialsSaved && (
                  <span className={`flex items-center gap-2 ${formSuccessClass} font-medium`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t.settings.common.saved}
                  </span>
                )}
              </div>
              
              {/* Read-only clinic information */}
              <div className="pt-6 border-t border-gray-100">
                <div className={`${semanticAlertInfoClass} !p-4 flex items-start gap-3 mb-4`}>
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">{t.settings.credentials.clinicInfoTitle}</p>
                    <p className="mt-1">
                      {t.settings.credentials.clinicInfoBody}
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {/* Read-only clinic fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                      {t.settings.credentials.clinicName}
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </label>
                    <input
                      type="text"
                      value={userClinic.clinicName}
                      disabled
                      className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        {t.settings.credentials.country}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={(userClinic as { countryCode?: string }).countryCode || DEFAULT_TENANT_COUNTRY}
                        disabled
                        className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        {t.common.phone}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={userClinic.phone || t.settings.common.emDash}
                        disabled
                        className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        {t.common.email}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={userClinic.email || t.settings.common.emDash}
                        disabled
                        className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                      {t.common.address}
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </label>
                    <input
                      type="text"
                      value={userClinic.address || t.settings.common.emDash}
                      disabled
                      className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        {t.settings.clinicInfo.city}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={userClinic.city || t.settings.common.emDash}
                        disabled
                        className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                        {t.settings.clinicInfo.postalCode}
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        value={userClinic.postalCode || t.settings.common.emDash}
                        disabled
                        className="w-full px-4 py-2.5 bg-brand-canvas border border-brand-border rounded-lg text-brand-muted cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {user?.role === "podiatrist" && <ClinicalHistoriesDownloadSection />}

        <ComplianceSettingsSection />
        </>
        )}
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
