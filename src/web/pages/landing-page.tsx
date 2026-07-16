import { Link } from "wouter";
import { useState } from "react";
import {
  Calendar,
  Users,
  FileText,
  Wallet,
  MessageCircle,
  Settings,
  Stethoscope,
  Building2,
  Headphones,
  ArrowRight,
  Check,
  CalendarX,
  UserMinus,
  Clock,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { landingByLang, type LandingPlan, type LandingSolution } from "../i18n/landing-i18n";
import { LanguageSwitcher } from "../components/language-switcher";
import { AnimatedThemeToggler } from "../components/ui/animated-theme-toggler";
import { cn } from "../lib/utils";

const gridPattern = (
  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <defs>
      <pattern id="landing-grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#landing-grid)" />
  </svg>
);

function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("tracking-tight", className)}>
      Podo<span className="font-bold">Admin</span>
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  details,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  details: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border bg-brand-surface p-6 text-left transition-all duration-300",
        "border-brand-border hover:-translate-y-1 hover:border-brand-ink hover:shadow-lg dark:hover:border-gray-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink",
        open && "border-brand-ink shadow-lg dark:border-gray-600"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-canvas text-brand-muted transition-colors",
            "group-hover:bg-brand-ink group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-gray-900",
            open && "bg-brand-ink text-white dark:bg-white dark:text-gray-900"
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-brand-muted transition-transform duration-300 md:hidden",
            open && "rotate-180"
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <h3 className="font-semibold text-brand-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">{description}</p>

      {/* Móvil: tap para abrir. Desktop: también con hover. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          "[@media(hover:hover)]:group-hover:grid-rows-[1fr]"
        )}
      >
        <div className="overflow-hidden">
          <ul className="mt-4 space-y-2 border-t border-brand-border pt-4">
            {details.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-brand-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-ink" strokeWidth={2} />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  );
}

function SolutionCard({
  icon: Icon,
  solution,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  solution: LandingSolution;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-brand-border bg-brand-surface p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-ink text-white dark:bg-white dark:text-gray-900">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-semibold text-brand-ink">{solution.problem}</h3>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted">{solution.solution}</p>
      </div>
    </div>
  );
}

function PricingCard({ plan, highlighted }: { plan: LandingPlan; highlighted?: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-8",
        highlighted
          ? "border-transparent bg-brand-ink text-white dark:border-gray-700 dark:bg-gray-900"
          : "border-brand-border bg-brand-surface text-brand-ink"
      )}
    >
      {plan.badge ? (
        <span
          className={cn(
            "absolute -top-3 left-8 rounded-full px-3 py-1 text-xs font-medium",
            highlighted ? "bg-white text-brand-ink" : "bg-brand-ink text-white"
          )}
        >
          {plan.badge}
        </span>
      ) : null}

      <h3 className={cn("text-lg font-semibold", highlighted ? "text-white" : "text-brand-ink")}>
        {plan.name}
      </h3>
      <p className={cn("mt-1 text-sm", highlighted ? "text-gray-400" : "text-brand-muted")}>
        {plan.tagline}
      </p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className={cn("text-4xl font-light tracking-tight", highlighted ? "text-white" : "text-brand-ink")}>
          {plan.price}
        </span>
        <span className={cn("text-sm", highlighted ? "text-gray-400" : "text-brand-muted")}>
          {plan.period}
        </span>
      </div>

      <ul className="mt-8 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check
              className={cn("mt-0.5 h-4 w-4 shrink-0", highlighted ? "text-white" : "text-brand-ink")}
              strokeWidth={2}
            />
            <span className={highlighted ? "text-gray-200" : "text-brand-muted"}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        className={cn(
          "mt-8 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-medium transition-colors min-h-[44px]",
          highlighted
            ? "bg-white text-brand-ink hover:bg-gray-100"
            : "bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover"
        )}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function AudienceCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-canvas p-6 dark:bg-gray-900/50">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-ink text-white dark:bg-white dark:text-gray-900">
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-brand-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">{description}</p>
    </div>
  );
}

const LandingPage = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const l = landingByLang[language] ?? landingByLang.es;

  const features = [
    { icon: Calendar, title: l.featureCalendarTitle, description: l.featureCalendarDesc, details: l.featureCalendarDetails },
    { icon: Users, title: l.featurePatientsTitle, description: l.featurePatientsDesc, details: l.featurePatientsDetails },
    { icon: FileText, title: l.featureSessionsTitle, description: l.featureSessionsDesc, details: l.featureSessionsDetails },
    { icon: Wallet, title: l.featureCheckoutTitle, description: l.featureCheckoutDesc, details: l.featureCheckoutDetails },
    { icon: MessageCircle, title: l.featureWhatsappTitle, description: l.featureWhatsappDesc, details: l.featureWhatsappDetails },
    { icon: Settings, title: l.featureSettingsTitle, description: l.featureSettingsDesc, details: l.featureSettingsDetails },
  ];

  const solutions = [
    { icon: CalendarX, solution: l.solutionAbsences },
    { icon: UserMinus, solution: l.solutionRetention },
    { icon: Clock, solution: l.solutionTime },
    { icon: TrendingUp, solution: l.solutionDecisions },
  ];

  const audiences = [
    { icon: Stethoscope, title: l.audiencePodiatristTitle, description: l.audiencePodiatristDesc },
    { icon: Building2, title: l.audienceClinicTitle, description: l.audienceClinicDesc },
    { icon: Headphones, title: l.audienceReceptionTitle, description: l.audienceReceptionDesc },
  ];

  return (
    <div className="h-full max-h-dvh overflow-y-auto overflow-scrolling-touch overscroll-y-contain bg-brand-canvas text-brand-ink">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/landing" className="flex items-center gap-2.5 shrink-0">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <Wordmark className="text-lg font-light hidden sm:inline" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-brand-muted">
            <a href="#solutions" className="hover:text-brand-ink transition-colors">
              {l.navSolutions}
            </a>
            <a href="#features" className="hover:text-brand-ink transition-colors">
              {l.navFeatures}
            </a>
            <a href="#pricing" className="hover:text-brand-ink transition-colors">
              {l.navPricing}
            </a>
            <a href="#audience" className="hover:text-brand-ink transition-colors">
              {l.navAudience}
            </a>
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
          <div className="flex flex-col justify-center px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-brand-ink leading-[1.1]">
              {l.heroTitle}{" "}
              <span className="font-semibold block sm:inline">{l.heroTitleBold}</span>
            </h1>
            <p className="mt-6 max-w-lg text-base sm:text-lg text-brand-muted leading-relaxed">
              {l.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium rounded-lg bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover transition-colors min-h-[44px]"
              >
                {l.heroCtaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-medium rounded-lg border border-brand-border bg-brand-surface text-brand-ink hover:bg-brand-canvas transition-colors min-h-[44px]"
              >
                {l.heroCtaSecondary}
              </Link>
            </div>
          </div>

          <div className="relative bg-[#1a1a1a] text-white px-4 py-16 sm:px-6 sm:py-24 lg:py-32 flex flex-col items-center justify-center">
            <div className="absolute inset-0 opacity-[0.04] text-white">{gridPattern}</div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <img src="/favicon.svg" alt="" className="w-28 h-28 sm:w-36 sm:h-36 mb-8" />
              <Wordmark className="text-4xl sm:text-5xl font-light text-white mb-4" />
              <div className="mt-12 grid grid-cols-3 gap-6 sm:gap-10 w-full max-w-sm">
                <div>
                  <div className="text-2xl sm:text-3xl font-light">100%</div>
                  <div className="text-gray-400 text-xs sm:text-sm mt-1">{l.heroStatDigital}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-light">24/7</div>
                  <div className="text-gray-400 text-xs sm:text-sm mt-1">{l.heroStatAccess}</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-light">SSL</div>
                  <div className="text-gray-400 text-xs sm:text-sm mt-1">{l.heroStatSecure}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions / Qué resuelve */}
      <section id="solutions" className="py-16 sm:py-24 px-4 sm:px-6 bg-brand-surface border-y border-brand-border">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-brand-ink">{l.solutionsTitle}</h2>
            <p className="mt-3 text-brand-muted leading-relaxed">{l.solutionsSubtitle}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {solutions.map((s) => (
              <SolutionCard key={s.solution.problem} icon={s.icon} solution={s.solution} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-brand-ink">{l.featuresTitle}</h2>
            <p className="mt-3 text-brand-muted leading-relaxed">{l.featuresSubtitle}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-brand-muted/70">{l.featureHoverHint}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
                details={f.details}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section id="audience" className="py-16 sm:py-24 px-4 sm:px-6 bg-brand-surface border-y border-brand-border">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-brand-ink">{l.audienceTitle}</h2>
            <p className="mt-3 text-brand-muted leading-relaxed">{l.audienceSubtitle}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {audiences.map((a) => (
              <AudienceCard key={a.title} icon={a.icon} title={a.title} description={a.description} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-brand-ink">{l.pricingTitle}</h2>
            <p className="mt-3 text-brand-muted leading-relaxed">{l.pricingSubtitle}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <PricingCard plan={l.pricingBase} />
            <PricingCard plan={l.pricingPremium} highlighted />
          </div>
          <p className="mt-6 text-center text-sm text-brand-muted">{l.pricingNote}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl bg-brand-ink px-6 py-12 sm:px-12 sm:py-16 text-center text-white">
            <div className="absolute inset-0 opacity-[0.04]">{gridPattern}</div>
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-light">{l.ctaTitle}</h2>
              <p className="mt-3 text-gray-400 max-w-lg mx-auto">{l.ctaSubtitle}</p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium rounded-lg bg-white text-brand-ink hover:bg-gray-100 transition-colors min-h-[44px] w-full sm:w-auto"
                >
                  {l.ctaButton}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-medium rounded-lg border border-gray-600 text-white hover:bg-white/10 transition-colors min-h-[44px] w-full sm:w-auto"
                >
                  {l.ctaLogin}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-brand-surface px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-brand-muted">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-6 w-6" />
            <Wordmark className="text-base font-light" />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-brand-ink transition-colors">
              {l.footerTerms}
            </Link>
            <Link href="/privacy" className="hover:text-brand-ink transition-colors">
              {l.footerPrivacy}
            </Link>
          </div>
          <p className="text-xs sm:text-sm">
            © {new Date().getFullYear()} PodoAdmin. {l.footerRights}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
