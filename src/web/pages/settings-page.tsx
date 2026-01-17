import { useState, useRef, useMemo, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { 
  getUserCredits, 
  getClinicById, 
  updateClinic, 
  getClinicLogo,
  setClinicLogo,
  removeClinicLogo,
  getProfessionalLogo,
  setProfessionalLogo,
  removeProfessionalLogo,
  Clinic 
} from "../lib/storage";

interface ClinicInfoForm {
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  licenseNumber: string;
  website: string;
}

// Get clinic name from storage
const getClinicName = (clinicId: string): string => {
  const clinic = getClinicById(clinicId);
  if (clinic) return clinic.clinicName;
  return `Clínica ${clinicId}`;
};

// Get logo for a user (considering clinic membership) - exported for PDF use
export const getLogoForUser = (userId: string, clinicId?: string): string | null => {
  // If user belongs to a clinic, return clinic logo
  if (clinicId) {
    const logo = getClinicLogo(clinicId);
    if (logo) return logo;
  }
  // For independent users, return professional logo
  const professionalLogo = getProfessionalLogo(userId);
  if (professionalLogo) return professionalLogo;
  return null;
};

const SettingsPage = () => {
  const { t, language, setLanguage, languageNames, availableLanguages } = useLanguage();
  const { user } = useAuth();
  
  const credits = getUserCredits(user?.id || "");
  
  // Determine logo ownership based on role
  const canUploadLogo = user?.role === "clinic_admin";
  const isPodiatristWithClinic = user?.role === "podiatrist" && user?.clinicId;
  const isPodiatristIndependent = user?.role === "podiatrist" && !user?.clinicId;
  const isAdminRole = user?.role === "super_admin" || user?.role === "admin";
  
  // Get the clinic for this user
  const userClinic = useMemo((): Clinic | null => {
    if (user?.clinicId) {
      return getClinicById(user.clinicId) || null;
    }
    return null;
  }, [user]);
  
  const [saved, setSaved] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(() => {
    // Initial load: check clinic logo first, then professional logo
    if (user?.clinicId) {
      return getClinicLogo(user.clinicId) || null;
    }
    if (isPodiatristIndependent && user?.id) {
      return getProfessionalLogo(user.id) || null;
    }
    return null;
  });
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load clinic logo when user.clinicId changes (for podiatrists with clinic)
  useEffect(() => {
    if (user?.clinicId) {
      const logo = getClinicLogo(user.clinicId);
      setCurrentLogo(logo || null);
    } else if (isPodiatristIndependent && user?.id) {
      const logo = getProfessionalLogo(user.id);
      setCurrentLogo(logo || null);
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
  });
  const [clinicInfoSaved, setClinicInfoSaved] = useState(false);
  
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
      });
    }
  }, [userClinic]);

  // Clinic name for display
  const clinicName = userClinic?.clinicName || (user?.clinicId ? getClinicName(user.clinicId) : "");
  
  const handleClinicInfoChange = (field: keyof ClinicInfoForm, value: string) => {
    setClinicInfoForm(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSaveClinicInfo = () => {
    if (!canUploadLogo || !user?.clinicId) return;
    
    updateClinic(user.clinicId, {
      phone: clinicInfoForm.phone,
      email: clinicInfoForm.email,
      address: clinicInfoForm.address,
      city: clinicInfoForm.city,
      postalCode: clinicInfoForm.postalCode,
      licenseNumber: clinicInfoForm.licenseNumber,
      website: clinicInfoForm.website,
    });
    
    setClinicInfoSaved(true);
    setTimeout(() => setClinicInfoSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadLogo) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setLogoError("Formato no válido. Use PNG, JPG o SVG.");
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

  const handleSaveLogo = () => {
    if (!canUploadLogo || !logoPreview || !user?.clinicId) return;
    
    // Save logo to separate storage key (podoadmin_clinic_logos)
    setClinicLogo(user.clinicId, logoPreview);
    setCurrentLogo(logoPreview);
    // Clear preview after successful save
    setLogoPreview(null);
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveLogo = () => {
    if (!canUploadLogo || !user?.clinicId) return;
    
    // Remove logo from separate storage key
    removeClinicLogo(user.clinicId);
    setCurrentLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Professional logo upload handler for independent podiatrists
  const handleProfessionalLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPodiatristIndependent) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setLogoError("Formato no válido. Use PNG, JPG o SVG.");
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

  const handleSaveProfessionalLogo = () => {
    if (!isPodiatristIndependent || !logoPreview || !user?.id) return;
    
    // Save logo to professional logos storage key
    setProfessionalLogo(user.id, logoPreview);
    setCurrentLogo(logoPreview);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveProfessionalLogo = () => {
    if (!isPodiatristIndependent || !user?.id) return;
    
    removeProfessionalLogo(user.id);
    setCurrentLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <MainLayout title={t.settings.title} credits={credits}>
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
                  {user?.name.charAt(0).toUpperCase()}
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
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
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
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
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
                  {userClinic.website && (
                    <div className="flex">
                      <span className="w-32 text-gray-500">Web:</span>
                      <a 
                        href={userClinic.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
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
        
        {/* Info for Independent Podiatrist - no clinic */}
        {isPodiatristIndependent && (
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm text-amber-700 font-medium">Profesional independiente</p>
                <p className="text-sm text-amber-600 mt-1 italic">
                  Actualmente trabajas como profesional independiente sin clínica asignada. Cuando te unas a una clínica, podrás ver el logo de tu clínica aquí y aparecerá en tus documentos PDF.
                </p>
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
