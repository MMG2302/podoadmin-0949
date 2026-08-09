import { Link } from "wouter";
import { useLanguage } from "../../contexts/language-context";
import { useAuth } from "../../contexts/auth-context";
import { landingByLang } from "../../i18n/landing-i18n";
import { LanguageSwitcher } from "../language-switcher";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";
import { cn } from "../../lib/utils";

/**
 * Cabecera, pie y fondo cuadriculado del sitio público.
 *
 * Viven acá y no en `landing-page.tsx` porque la página de preguntas frecuentes (`/faq`)
 * es la misma web y tiene que verse igual: si la cabecera se duplica, el día que se agregue
 * un enlace al nav queda solo en una de las dos.
 */

export function LandingGridPattern() {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <pattern id="landing-grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#landing-grid)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("tracking-tight", className)}>
      Pod<span className="font-bold">oraa</span>
    </span>
  );
}

/**
 * `onLanding` decide a dónde apuntan los anclas del nav: dentro de la landing basta con
 * `#pricing`, pero desde `/faq` hay que volver a la raíz (`/#pricing`) o el ancla no existe.
 */
export function LandingHeader({ onLanding = false }: { onLanding?: boolean }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const l = landingByLang[language] ?? landingByLang.es;
  const anchor = (id: string) => (onLanding ? `#${id}` : `/#${id}`);

  const sections = [
    { id: "solutions", label: l.navSolutions },
    { id: "features", label: l.navFeatures },
    { id: "pricing", label: l.navPricing },
    { id: "audience", label: l.navAudience },
    { id: "steps", label: l.navSteps },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/landing" className="flex items-center gap-2.5 shrink-0">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <Wordmark className="text-lg font-light hidden sm:inline" />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-brand-muted">
          {sections.map((s) => (
            <a key={s.id} href={anchor(s.id)} className="hover:text-brand-ink transition-colors">
              {s.label}
            </a>
          ))}
          <Link
            href="/faq"
            className={cn(
              "transition-colors hover:text-brand-ink",
              !onLanding && "text-brand-ink font-medium"
            )}
          >
            {l.navFaq}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <AnimatedThemeToggler />
          <LanguageSwitcher />
          {user ? (
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover transition-colors min-h-[44px]"
            >
              Mi cuenta
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-brand-ink hover:underline"
              >
                {l.navLogin}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover transition-colors min-h-[44px]"
              >
                {l.navRegister}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function LandingFooter() {
  const { language } = useLanguage();
  const l = landingByLang[language] ?? landingByLang.es;

  return (
    <footer className="border-t border-brand-border bg-brand-surface px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-muted">
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-6 w-6" />
          <Wordmark className="text-base font-light" />
        </div>
        <div className="flex items-center gap-4">
          <Link href="/faq" className="hover:text-brand-ink transition-colors">
            {l.navFaq}
          </Link>
          <Link href="/terms" className="hover:text-brand-ink transition-colors">
            {l.footerTerms}
          </Link>
          <Link href="/privacy" className="hover:text-brand-ink transition-colors">
            {l.footerPrivacy}
          </Link>
          <Link href="/faq#contacto" className="hover:text-brand-ink transition-colors">
            {l.footerContact}
          </Link>
        </div>
        <p className="text-xs sm:text-sm">
          © {new Date().getFullYear()} Podoraa. {l.footerRights}
        </p>
      </div>
    </footer>
  );
}
