import { useState, useRef } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { getUserCredits } from "../lib/storage";

// Clinic logo storage
const CLINIC_LOGO_KEY = "podoadmin_clinic_logo";

const getClinicLogo = (): string | null => {
  return localStorage.getItem(CLINIC_LOGO_KEY);
};

const saveClinicLogo = (base64: string): void => {
  localStorage.setItem(CLINIC_LOGO_KEY, base64);
};

const removeClinicLogo = (): void => {
  localStorage.removeItem(CLINIC_LOGO_KEY);
};

const SettingsPage = () => {
  const { t, language, setLanguage, languageNames, availableLanguages } = useLanguage();
  const { user } = useAuth();
  
  const credits = getUserCredits(user?.id || "");
  
  const [saved, setSaved] = useState(false);
  const [logo, setLogo] = useState<string | null>(() => getClinicLogo());
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (logoPreview) {
      saveClinicLogo(logoPreview);
      setLogo(logoPreview);
      setLogoPreview(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleRemoveLogo = () => {
    removeClinicLogo();
    setLogo(null);
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

        {/* Clinic Logo Upload */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">Logo de la clínica</h3>
          <p className="text-sm text-gray-500 mb-4">
            Sube el logo de tu clínica para mostrarlo en los documentos PDF. Dimensiones recomendadas: 200x80px
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
                ) : logo ? (
                  <img 
                    src={logo} 
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
            {(logoPreview || logo) && (
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
                {logo && !logoPreview && (
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
        </div>

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
