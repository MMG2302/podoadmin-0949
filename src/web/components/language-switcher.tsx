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
    <div className={`relative group ${className}`}>
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-all"
      >
        <span>{flagEmojis[language]}</span>
        <span className="text-gray-700">{languageNames[language]}</span>
        <svg
          className="w-4 h-4 text-gray-400 transition-transform group-hover:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-all ${
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
