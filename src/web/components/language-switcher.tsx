import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/language-context";
import { Language } from "../i18n/translations";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "inline";
  className?: string;
}

const languageCodes: Record<Language, string> = {
  es: "ES",
  en: "EN",
  pt: "PT",
  fr: "FR",
};

/** Ícono de globo: símbolo universal de "idioma", entendible sin depender del texto. */
const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M3 12h18" />
    <path strokeLinecap="round" d="M12 3c2.5 2.7 3.8 6 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-6-3.8-9s1.3-6.3 3.8-9z" />
  </svg>
);

export const LanguageSwitcher = ({ variant = "dropdown", className = "" }: LanguageSwitcherProps) => {
  const { language, setLanguage, languageNames, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera (funciona en touch y desktop)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderOptionsList = (onPick: (lang: Language) => void) =>
    availableLanguages.map((lang) => (
      <button
        key={lang}
        onClick={() => onPick(lang)}
        className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-all min-h-[44px] ${
          language === lang ? "bg-brand-canvas font-medium" : ""
        }`}
      >
        <span className="w-7 shrink-0 text-xs font-semibold text-brand-muted">{languageCodes[lang]}</span>
        <span className="text-brand-ink">{languageNames[lang]}</span>
        {language === lang && (
          <svg className="w-4 h-4 text-brand-ink ml-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    ));

  if (variant === "inline") {
    return (
      <div className={className}>
        {/* Escritorio: fila compacta de códigos en mayúsculas */}
        <div className="hidden md:flex items-center gap-1 justify-center">
          {availableLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-1 text-sm font-semibold rounded transition-all ${
                language === lang
                  ? "bg-brand-ink text-brand-ink-fg"
                  : "text-brand-muted hover:bg-brand-canvas"
              }`}
              title={languageNames[lang]}
            >
              {languageCodes[lang]}
            </button>
          ))}
        </div>

        {/* Móvil: ícono de globo + nombre completo del idioma actual (más claro que 4 siglas sueltas) */}
        <div ref={mobileRef} className="relative md:hidden">
          <button
            onClick={() => setIsMobileOpen((o) => !o)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-300 hover:bg-white/10 hover:text-white active:bg-white/20 rounded-lg transition-all min-h-[48px] active:scale-[0.98]"
            aria-expanded={isMobileOpen}
            aria-haspopup="listbox"
          >
            <GlobeIcon className="w-5 h-5" />
            <span className="font-medium text-sm">{languageNames[language]}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isMobileOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`absolute bottom-full left-0 right-0 mb-1 bg-brand-surface rounded-lg shadow-lg border border-brand-border py-1 transition-all z-50 ${
              isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
            }`}
            role="listbox"
          >
            {renderOptionsList((lang) => {
              setLanguage(lang);
              setIsMobileOpen(false);
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-brand-canvas active:bg-gray-200 dark:active:bg-gray-700 transition-all min-w-[44px] min-h-[44px] items-center justify-center text-brand-ink"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{languageCodes[language]}</span>
        <span className="hidden sm:inline text-brand-muted">{languageNames[language]}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div
        className={`absolute right-0 top-full mt-1 bg-brand-surface rounded-lg shadow-lg border border-brand-border py-1 min-w-[160px] transition-all z-50 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        role="listbox"
      >
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => {
              setLanguage(lang);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-all min-h-[44px] ${
              language === lang ? "bg-brand-canvas font-medium" : ""
            }`}
          >
            <span>{languageCodes[lang]}</span>
            <span className="text-brand-muted">{languageNames[lang]}</span>
            {language === lang && (
              <svg className="w-4 h-4 text-brand-ink ml-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
