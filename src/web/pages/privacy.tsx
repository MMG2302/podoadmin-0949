import { useLanguage } from "../contexts/language-context";
import { AuthPublicToolbar } from "../components/auth/auth-public-toolbar";
import { AuthBrandPanel } from "../components/auth/auth-brand-link";
import { authPage as ap } from "../lib/auth-page-styles";
import { useLocation, Link } from "wouter";

const Privacy = () => {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();

  const getFormattedDate = () => {
    const localeMap: Record<string, string> = {
      es: "es-ES",
      en: "en-US",
      pt: "pt-BR",
      fr: "fr-FR",
    };
    return new Date().toLocaleDateString(localeMap[language] || "es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const p = t.privacy;

  return (
    <div className={ap.shell}>
      <div className="hidden lg:flex lg:w-1/2 bg-brand-ink relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <AuthBrandPanel />
          <p className="text-gray-400 text-lg text-center max-w-md">{t.branding.tagline}</p>
        </div>
      </div>

      <div className={`${ap.formColumnScroll} w-full lg:w-1/2`}>
        <AuthPublicToolbar />
        <div className="flex-1 min-h-0 overflow-y-auto p-8 pb-safe">
          <div className="max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setLocation("/register")}
              className={`${ap.link} mb-4 inline-flex items-center text-sm`}
            >
              ← {p.backToRegister}
            </button>
            <h1 className={ap.heading}>{p.title}</h1>
            <p className={`${ap.muted} text-sm mb-8`}>
              {p.lastUpdated}: {getFormattedDate()}
            </p>

            <div className={`space-y-8 ${ap.bodyText}`}>
              {[p.section1, p.section2, p.section3, p.section4, p.section6, p.section7, p.section8].map((s) => (
                <section key={s.title}>
                  <h2 className="text-lg font-semibold text-brand-ink mb-2">{s.title}</h2>
                  <p className="leading-relaxed">{s.content}</p>
                </section>
              ))}
              <section>
                <h2 className="text-lg font-semibold text-brand-ink mb-2">{p.section5.title}</h2>
                <p className="mb-2">{p.section5.intro}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{p.section5.item1}</li>
                  <li>{p.section5.item2}</li>
                  <li>{p.section5.item3}</li>
                  <li>{p.section5.item4}</li>
                </ul>
              </section>
            </div>

            <p className={`mt-10 text-sm ${ap.muted}`}>
              <Link href="/terms" className={ap.link}>
                {t.auth.termsLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
