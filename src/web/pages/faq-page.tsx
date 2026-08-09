import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, ChevronDown, Mail } from "lucide-react";
import { useLanguage } from "../contexts/language-context";
import { useHashScroll } from "../hooks/use-hash-scroll";
import { landingByLang, type LandingFaqItem } from "../i18n/landing-i18n";
import {
  LandingFooter,
  LandingHeader,
  LandingGridPattern,
} from "../components/landing/landing-chrome";

/** Mismo buzón que `SUPPORT_EMAIL` en wrangler.json. */
const SUPPORT_EMAIL = "soporte@podoraa.com";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

/** `<details>` nativo: la respuesta sigue en el DOM aunque esté plegada, y así la indexan. */
function FaqList({ items }: { items: LandingFaqItem[] }) {
  return (
    <div className="divide-y divide-brand-border border-y border-brand-border">
      {items.map((item) => (
        <details key={item.question} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
            <h3 className="text-base font-medium text-brand-ink">{item.question}</h3>
            <ChevronDown
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted transition-transform group-open:rotate-180"
              strokeWidth={1.5}
            />
          </summary>
          <p className="mt-3 pr-8 text-sm leading-relaxed text-brand-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

const FaqPage = () => {
  const { language } = useLanguage();
  const l = landingByLang[language] ?? landingByLang.es;
  useHashScroll();

  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);

  /**
   * Contacto por `mailto:`: el mensaje se abre en el correo del propio visitante, así que
   * no hace falta un endpoint público (ni el spam ni el CAPTCHA que traería). El correo que
   * escribe queda en el cuerpo porque el `From:` real lo pone su cliente de correo, que
   * puede ser otra cuenta distinta de la que quiere que le respondamos.
   */
  const sendByEmail = () => {
    if (!isValidEmail(email)) {
      setError(l.contactEmailInvalid);
      return;
    }
    if (!question.trim()) {
      setError(l.contactQuestionMissing);
      return;
    }
    setError(null);

    const body = `${question.trim()}\n\n—\n${l.contactMailFrom}: ${email.trim()}`;
    const href =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${encodeURIComponent(l.contactMailSubject)}` +
      `&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  return (
    <div className="h-full max-h-dvh overflow-y-auto overflow-scrolling-touch overscroll-y-contain bg-brand-canvas text-brand-ink">
      <LandingHeader />

      <main>
        <section className="px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/landing"
              className="inline-flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              {l.faqPageBack}
            </Link>
            <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-brand-ink">
              {l.faqPageTitle}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-brand-muted">{l.faqPageSubtitle}</p>
          </div>
        </section>

        <section className="px-4 pb-12 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-semibold text-brand-ink">{l.faqPageGeneralHeading}</h2>
            <FaqList items={l.faqItems} />
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 bg-brand-surface border-y border-brand-border">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-xl font-semibold text-brand-ink">{l.faqPageSystemHeading}</h2>
            <FaqList items={l.faqSystemItems} />
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-brand-surface p-6 sm:p-10">
              <div className="pointer-events-none absolute inset-0 opacity-[0.04] text-brand-ink">
                <LandingGridPattern />
              </div>

              <div className="relative z-10">
                <h2 className="text-2xl font-semibold text-brand-ink">{l.contactTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{l.contactSubtitle}</p>

                <div className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="faq-contact-email" className="block text-sm font-medium text-brand-ink">
                      {l.contactEmailLabel}
                    </label>
                    <input
                      id="faq-contact-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder={l.contactEmailPlaceholder}
                      className="mt-2 w-full rounded-lg border border-brand-border bg-brand-canvas px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="faq-contact-question" className="block text-sm font-medium text-brand-ink">
                      {l.contactQuestionLabel}
                    </label>
                    <textarea
                      id="faq-contact-question"
                      rows={5}
                      value={question}
                      onChange={(e) => {
                        setQuestion(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder={l.contactQuestionPlaceholder}
                      className="mt-2 w-full resize-y rounded-lg border border-brand-border bg-brand-canvas px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-ink/20"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-sm text-semantic-error">
                      {error}
                    </p>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={sendByEmail}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-brand-ink px-6 py-3.5 text-sm font-medium text-brand-ink-fg transition-colors hover:bg-brand-ink-hover"
                    >
                      {l.contactSubmit}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className="text-xs leading-relaxed text-brand-muted sm:flex-1">
                      {l.contactHint}
                    </p>
                  </div>

                  <p className="border-t border-brand-border pt-5 text-sm text-brand-muted">
                    {l.contactDirect}{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="inline-flex items-center gap-1.5 font-medium text-brand-ink hover:underline"
                    >
                      <Mail className="h-4 w-4" strokeWidth={1.5} />
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default FaqPage;
