import { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/main-layout";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { usePermissions } from "../hooks/use-permissions";
import { getUserCredits, getThemeSettings, saveThemeSettings, ThemeSettings } from "../lib/storage";

const SettingsPage = () => {
  const { t, language, setLanguage, languageNames, availableLanguages } = useLanguage();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  
  const credits = getUserCredits(user?.id || "");
  
  const [theme, setTheme] = useState<ThemeSettings>(() => getThemeSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Apply theme to document
    if (theme.mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Apply accent color as CSS variable
    document.documentElement.style.setProperty("--accent-color", theme.accentColor);
  }, [theme]);

  const handleSave = () => {
    saveThemeSettings(theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isValidHex = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);

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

        {/* Theme Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">{t.settings.theme}</h3>
          
          <div className="space-y-6">
            {/* Light/Dark Mode */}
            <div>
              <p className="text-sm text-gray-500 mb-3">Modo de color</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme({ ...theme, mode: "light" })}
                  className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    theme.mode === "light"
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-medium">{t.settings.lightMode}</span>
                </button>
                <button
                  onClick={() => setTheme({ ...theme, mode: "dark" })}
                  className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    theme.mode === "dark"
                      ? "bg-[#1a1a1a] text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="font-medium">{t.settings.darkMode}</span>
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <p className="text-sm text-gray-500 mb-3">{t.settings.accentColor}</p>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer overflow-hidden"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    className="w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg font-mono uppercase ${
                      isValidHex(theme.accentColor)
                        ? "border-gray-200 focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                        : "border-red-300 bg-red-50"
                    } focus:outline-none`}
                    placeholder="#1a1a1a"
                  />
                  <p className="text-xs text-gray-400 mt-1">{t.settings.accentColorHint}</p>
                </div>
              </div>

              {/* Preset Colors */}
              <div className="flex gap-2 mt-4">
                {["#1a1a1a", "#2563eb", "#059669", "#dc2626", "#7c3aed", "#ea580c"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setTheme({ ...theme, accentColor: color })}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                      theme.accentColor === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">{t.settings.preview}</h3>
          
          <div className={`rounded-xl p-6 ${theme.mode === "dark" ? "bg-[#1a1a1a]" : "bg-gray-50"}`}>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: theme.accentColor }}
              >
                PA
              </div>
              <div>
                <h4 className={`font-semibold ${theme.mode === "dark" ? "text-white" : "text-[#1a1a1a]"}`}>
                  PodoAdmin
                </h4>
                <p className={theme.mode === "dark" ? "text-gray-400" : "text-gray-500"}>
                  {t.branding.tagline}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: theme.accentColor }}
              >
                {t.common.save}
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  theme.mode === "dark"
                    ? "bg-white/10 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-green-600 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t.settings.settingsSaved}
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={!isValidHex(theme.accentColor)}
            className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.settings.saveSettings}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
