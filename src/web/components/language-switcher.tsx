import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/language-context";
import { Language } from "../i18n/translations";

interface LanguageSwitcherProps {
  variant?: "dropdown" | "inline";
  className?: string;
}

const flagEmojis: Record<Language, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  pt: "🇧🇷",
  fr: "🇫🇷",
};

export const LanguageSwitcher = ({ variant = "dropdown", className = "" }: LanguageSwitcherProps) => {
  const { language, setLanguage, languageNames, availableLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera (funciona en touch y desktop)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-2 py-1 text-sm rounded transition-all ${
              language === lang
                ? "bg-[#1a1a1a] text-white"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            title={languageNames[lang]}
          >
            {flagEmojis[lang]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all min-w-[44px] min-h-[44px] items-center justify-center"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{flagEmojis[language]}</span>
        <span className="hidden sm:inline text-gray-700">{languageNames[language]}</span>
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
        className={`absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[160px] transition-all z-50 ${
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
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 active:bg-gray-100 transition-all min-h-[44px] ${
              language === lang ? "bg-gray-50 font-medium" : ""
            }`}
          >
            <span>{flagEmojis[lang]}</span>
            <span className="text-gray-700">{languageNames[lang]}</span>
            {language === lang && (
              <svg className="w-4 h-4 text-[#1a1a1a] ml-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
