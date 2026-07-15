import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { Language, Translations, translations, languageNames } from "../i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  languageNames: Record<Language, string>;
  availableLanguages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "podoadmin_language";
const DEFAULT_LANGUAGE: Language = "es";
const AVAILABLE_LANGUAGES: Language[] = ["es", "en", "pt", "fr"];

/** Rellena huecos del idioma activo con español para evitar crashes por claves i18n incompletas. */
function deepMergeMissing<T>(base: T, overlay: T): T {
  if (overlay == null) return base;
  if (base == null) return overlay;
  if (typeof overlay !== "object" || Array.isArray(overlay)) return overlay;
  if (typeof base !== "object" || Array.isArray(base)) return overlay;

  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(overlay as Record<string, unknown>)) {
    const fallback = (base as Record<string, unknown>)[key];
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      out[key] = deepMergeMissing(fallback, value);
    } else if (value === undefined) {
      out[key] = fallback;
    } else {
      out[key] = value;
    }
  }
  // keys only in base
  for (const [key, value] of Object.entries(base as Record<string, unknown>)) {
    if (!(key in out)) out[key] = value;
  }
  return out as T;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && AVAILABLE_LANGUAGES.includes(stored as Language)) {
        return stored as Language;
      }
    }
    return DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    if (AVAILABLE_LANGUAGES.includes(lang)) {
      setLanguageState(lang);
    }
  };

  const t = useMemo((): Translations => {
    const active = translations[language] ?? translations.es;
    if (language === "es") return active;
    return deepMergeMissing(translations.es, active);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languageNames,
        availableLanguages: AVAILABLE_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
