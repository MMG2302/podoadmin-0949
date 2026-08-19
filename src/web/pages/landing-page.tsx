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
  CalendarCheck,
  UserPlus,
  Clock,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../contexts/language-context";
import { STEP_MEDIA } from "../components/landing/step-media";
import { useHashScroll } from "../hooks/use-hash-scroll";
import { landingByLang, type LandingPlan, type LandingSolution } from "../i18n/landing-i18n";
import {
  LandingFooter,
  LandingGridPattern,
  LandingHeader,
  Wordmark,
} from "../components/landing/landing-chrome";
import { cn } from "../lib/utils";

/**
 * Clips de la app para los pasos, en el mismo orden que `l.steps`.
 *
 * Son capturas reales recortadas a una sola region (no recorridos de pantalla):
 * muestran que el sistema resuelve algo, sin exponer como se opera. Se regeneran
 * con `node scripts/capture-landing-steps.mjs`.
 *
 * El paso 01 cruza dos paletas reales de la vista previa de marca en vez de grabar
 * a alguien eligiendo colores: se ve que la interfaz se adapta, no como se opera.
 */
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
      {/* El halo late para que el plan recomendado se note sin gritar; el color
          va como variable porque el distintivo cambia de fondo segun la tarjeta. */}
      {plan.badge ? (
        <span
          className={cn(
            "absolute -top-4 left-8 rounded-full px-4 py-1.5 text-sm font-semibold tracking-tight",
            "animate-badge-ping motion-reduce:animate-none",
            highlighted
              ? "bg-white text-gray-900 [--badge-halo:rgb(255_255_255/0.9)]"
              : "bg-brand-ink text-brand-ink-fg [--badge-halo:rgb(26_26_26/0.6)]"
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
            ? "bg-white text-gray-900 hover:bg-gray-100"
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
    <div className="mr-4 w-[19rem] shrink-0 rounded-xl border border-brand-border bg-brand-canvas p-6 dark:bg-gray-900/50">
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
  const l = landingByLang[language] ?? landingByLang.es;
  useHashScroll();

  const features = [
    { icon: Calendar, title: l.featureCalendarTitle, description: l.featureCalendarDesc, details: l.featureCalendarDetails },
    { icon: Users, title: l.featurePatientsTitle, description: l.featurePatientsDesc, details: l.featurePatientsDetails },
    { icon: FileText, title: l.featureSessionsTitle, description: l.featureSessionsDesc, details: l.featureSessionsDetails },
    { icon: Wallet, title: l.featureCheckoutTitle, description: l.featureCheckoutDesc, details: l.featureCheckoutDetails },
    { icon: MessageCircle, title: l.featureWhatsappTitle, description: l.featureWhatsappDesc, details: l.featureWhatsappDetails },
    { icon: Settings, title: l.featureSettingsTitle, description: l.featureSettingsDesc, details: l.featureSettingsDetails },
  ];

  const solutions = [
    { icon: CalendarCheck, solution: l.solutionAbsences },
    { icon: UserPlus, solution: l.solutionRetention },
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
      <LandingHeader onLanding />

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
            <div className="mt-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium rounded-lg bg-brand-ink text-brand-ink-fg hover:bg-brand-ink-hover transition-colors min-h-[44px]"
              >
                {l.heroCtaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative bg-[#1a1a1a] text-white px-4 py-10 sm:px-6 sm:py-24 lg:py-32 flex flex-col items-center justify-center">
            <div className="absolute inset-0 opacity-[0.04] text-white"><LandingGridPattern /></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <img src="/favicon.svg" alt="" className="w-20 h-20 sm:w-36 sm:h-36 mb-5 sm:mb-8" />
              <Wordmark className="text-3xl sm:text-5xl font-light text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* Para quién es — cinta en movimiento, justo debajo del hero */}
      <section id="audience" className="overflow-hidden py-12 sm:py-16">
        <div className="mx-auto mb-8 max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-brand-ink">{l.audienceTitle}</h2>
          <p className="mt-3 max-w-2xl text-brand-muted leading-relaxed">{l.audienceSubtitle}</p>
        </div>
        {/* El degradado de los bordes evita que las tarjetas aparezcan y
            desaparezcan de golpe contra el borde de la pantalla. */}
        <div className="[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[0, 1, 2, 3].map((copia) => (
              // Solo la primera vuelta se anuncia: las otras tres son la misma
              // lista repetida para que el bucle no tenga costura.
              <div key={copia} className="flex" aria-hidden={copia > 0}>
                {audiences.map((a) => (
                  <AudienceCard key={a.title} icon={a.icon} title={a.title} description={a.description} />
                ))}
              </div>
            ))}
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

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-brand-ink">{l.pricingTitle}</h2>
            <p className="mt-3 text-brand-muted leading-relaxed">{l.pricingSubtitle}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {l.pricingPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} highlighted={plan.highlighted} />
            ))}
          </div>

          {/* Roles cost info card */}
          <div className="mt-8 rounded-2xl border border-brand-border bg-brand-surface px-6 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-4">
              <h3 className="text-sm font-semibold text-brand-ink">{l.rolesCardTitle}</h3>
              <span className="text-xs text-brand-muted">{l.rolesCardSubtitle}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {l.rolesCardRows.map((row) => (
                <div key={row.role} className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-bg px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-brand-ink truncate">{row.role}</p>
                    <p className="text-xs text-brand-muted mt-0.5">{row.note}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-brand-ink">{row.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-brand-muted">{l.pricingNote}</p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-xs leading-relaxed text-brand-muted/80">
            {l.pricingNoteDisclaimer}
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-brand-surface border-y border-brand-border">
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

      {/* Cómo empezar — cuatro pasos numerados */}
      <section id="steps" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-3xl text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink">
            {l.stepsTitle}
          </h2>
          <p className="mt-6 inline-flex items-start gap-2.5 rounded-full border border-brand-border bg-brand-canvas px-5 py-2.5 text-sm text-brand-muted">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-ink" />
            <span>{l.stepsBadge}</span>
          </p>

          <ol className="mt-12 grid gap-y-10 border-t border-brand-border pt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0">
            {l.steps.map((step, i) => (
              <li
                key={step.title}
                className={cn(
                  "px-0 sm:px-6",
                  i === 0 && "sm:pl-0",
                  i > 0 && "sm:border-l sm:border-brand-border"
                )}
              >
                <div className="font-mono text-xs tracking-widest text-brand-muted/70">
                  {String(i + 1).padStart(2, "0")}
                  <span className="mx-1.5">/</span>
                  {String(l.steps.length).padStart(2, "0")}
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-snug text-brand-ink">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{step.description}</p>
                {/* El clip va despues del texto para que los cuatro titulos alineen arriba:
                    el paso 01 todavia no tiene captura y, puesto antes, descolgaba su columna. */}
                {/* Fondo blanco fijo, no bg-brand-canvas: los clips son capturas de la
                    interfaz en claro y con object-contain el sobrante quedaba como una
                    franja oscura al lado en el tema oscuro. */}
                {STEP_MEDIA[i] && (
                  <div className="mt-5 overflow-hidden rounded-lg border border-brand-border bg-white">
                    {/* La UI capturada esta en ingles a proposito: un solo juego de clips
                        para los cuatro idiomas en vez de cuatro juegos que mantener. */}
                    <video
                      className="block h-40 w-full object-contain object-left motion-reduce:hidden"
                      src={STEP_MEDIA[i]!.mp4}
                      poster={STEP_MEDIA[i]!.poster}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-hidden
                    />
                    <img
                      className="hidden h-40 w-full object-contain object-left motion-reduce:block"
                      src={STEP_MEDIA[i]!.poster}
                      alt={l.stepsMediaAlt[i] ?? ""}
                      loading="lazy"
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Comparativa con lo que se usa antes de tener un software */}
      <section id="comparison" className="py-16 sm:py-24 px-4 sm:px-6 bg-brand-surface border-y border-brand-border">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-brand-ink">
              {l.comparisonTitle}
            </h2>
            <p className="mt-3 text-brand-muted leading-relaxed">{l.comparisonSubtitle}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {l.comparisonRows.map((row) => (
              <article
                key={row.alternative}
                className="rounded-xl border border-brand-border bg-brand-surface p-6"
              >
                <h3 className="text-base font-semibold text-brand-ink">{row.alternative}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{row.problem}</p>
                <p className="mt-4 border-t border-brand-border pt-4 text-sm leading-relaxed text-brand-ink">
                  {row.podoraa}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Guía de compra — contenido de fondo, pensado sobre todo para búsqueda */}
      <section id="guide" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-brand-ink">{l.guideTitle}</h2>
            <p className="mt-3 text-brand-muted leading-relaxed">{l.guideSubtitle}</p>
          </div>
          <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {l.guideItems.map((item, i) => (
              <li key={item.title} className="border-t border-brand-border pt-5">
                <div className="font-mono text-xs tracking-widest text-brand-muted/70">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-brand-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Las preguntas frecuentes viven en /faq; acá solo queda el enlace. */}
      <section className="px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-xl sm:text-2xl font-semibold text-brand-ink hover:underline"
          >
            {l.faqPageTitle}
            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-2xl bg-brand-ink dark:bg-gray-900 px-6 py-12 sm:px-12 sm:py-16 text-center text-white">
            <div className="absolute inset-0 opacity-[0.04]"><LandingGridPattern /></div>
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-light">{l.ctaTitle}</h2>
              <p className="mt-3 text-gray-400 max-w-lg mx-auto">{l.ctaSubtitle}</p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-medium rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors min-h-[44px] w-full sm:w-auto"
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

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
