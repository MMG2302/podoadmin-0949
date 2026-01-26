import { useLanguage } from "../contexts/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { useLocation } from "wouter";

const Terms = () => {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  // Formatear fecha dinámica según el idioma
  const getFormattedDate = () => {
    const now = new Date();
    const localeMap: Record<string, string> = {
      es: 'es-ES',
      en: 'en-US',
      pt: 'pt-BR',
      fr: 'fr-FR',
    };
    return now.toLocaleDateString(localeMap[language] || 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] relative h-screen sticky top-0">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="mb-8">
            <img src="/favicon.svg" alt="Logo" className="w-40 h-40" />
          </div>
          
          <h1 className="text-white text-5xl font-light tracking-tight mb-4">
            Podo<span className="font-bold">Admin</span>
          </h1>
          <p className="text-gray-400 text-lg text-center max-w-md leading-relaxed">
            {t.branding.tagline}
          </p>
        </div>
      </div>

      {/* Right Panel - Terms Content */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Language switcher in header */}
        <div className="flex justify-end p-4 flex-shrink-0">
          <LanguageSwitcher />
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => setLocation("/register")}
                className="text-[#1a1a1a] hover:underline mb-4 inline-flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t.terms.backToRegister}
              </button>
              <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-2">
                {t.terms.title}
              </h1>
              <p className="text-gray-500 text-sm">
                {t.terms.lastUpdated}: {getFormattedDate()}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section1.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section1.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section2.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section2.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section3.title}</h2>
                <p className="leading-relaxed mb-2">
                  {t.terms.section3.intro}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t.terms.section3.item1}</li>
                  <li>{t.terms.section3.item2}</li>
                  <li>{t.terms.section3.item3}</li>
                  <li>{t.terms.section3.item4}</li>
                  <li>{t.terms.section3.item5}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section4.title}</h2>
                <p className="leading-relaxed mb-2">
                  {t.terms.section4.intro}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>{t.terms.section4.item1}</li>
                  <li>{t.terms.section4.item2}</li>
                  <li>{t.terms.section4.item3}</li>
                  <li>{t.terms.section4.item4}</li>
                  <li>{t.terms.section4.item5}</li>
                  <li>{t.terms.section4.item6}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section5.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section5.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section6.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section6.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section7.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section7.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section8.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section8.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section9.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section9.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section10.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section10.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section11.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section11.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section12.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section12.content}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-3">{t.terms.section13.title}</h2>
                <p className="leading-relaxed">
                  {t.terms.section13.content}
                </p>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex gap-4">
                <button
                  onClick={() => setLocation("/register")}
                  className="flex-1 py-3 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
                >
                  {t.terms.acceptAndContinue}
                </button>
                <button
                  onClick={() => setLocation("/register")}
                  className="flex-1 py-3 bg-gray-100 text-[#1a1a1a] font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t.terms.back}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
