import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../contexts/language-context";
import { AuthPublicToolbar } from "../components/auth/auth-public-toolbar";
import { AuthBrandPanel, AuthBrandMobile } from "../components/auth/auth-brand-link";
import { api } from "../lib/api-client";
import { authPage as ap } from "../lib/auth-page-styles";
import {
  semanticAlertInfoClass,
  semanticStatusIconSuccessClass,
} from "../lib/form-field-classes";

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [supportEmail, setSupportEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/config", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { supportEmail?: string | null } | null) => {
        if (data?.supportEmail) setSupportEmail(data.supportEmail);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post<{ success: boolean; message?: string }>("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        setSent(true);
      } else {
        const msg = response.message || response.error;
        const isGenericError =
          typeof msg === "string" &&
          (msg.includes("error al procesar") ||
            msg.includes("error processing") ||
            msg.includes("intenta más tarde") ||
            msg.includes("try again later"));
        setError(msg && !isGenericError ? msg : t.auth.forgotPasswordErrorRequest);
      }
    } catch (err: any) {
      setError(err?.message || t.auth.forgotPasswordErrorConnection);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={ap.shell}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-ink relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-forgot" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-forgot)" />
            </svg>
          </div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <AuthBrandPanel />
          <p className="text-gray-400 text-lg text-center max-w-md leading-relaxed">
            {t.branding.tagline}
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className={ap.formColumnScroll}>
        <AuthPublicToolbar />
        <div className={ap.formScrollArea}>
          <div className={ap.formScrollInner}>
            <div className="lg:hidden text-center mb-12">
              <AuthBrandMobile />
            </div>

            {!sent ? (
              <>
                <div className="mb-10">
                  <h2 className="text-brand-ink text-3xl font-semibold mb-2">
                    {t.auth.forgotPasswordTitle}
                  </h2>
                  <p className="text-gray-500">
                    {t.auth.forgotPasswordSubtitle}
                  </p>
                </div>

                <div className={`mb-6 ${semanticAlertInfoClass}`}>
                  <p>
                    {t.auth.contactToVerifyRecovery}{" "}
                    <a
                      href={`mailto:${supportEmail || "soporte@podoadmin.com"}?subject=${encodeURIComponent(t.auth.recoveryVerifySubject)}`}
                      className="font-medium text-brand-ink hover:underline"
                    >
                      {supportEmail || "soporte@podoadmin.com"}
                    </a>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className={ap.error}>
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-2">
                      {t.auth.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink transition-all text-brand-ink bg-gray-50 dark:bg-gray-900 border-brand-border placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder={t.auth.emailPlaceholder}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-brand-ink text-brand-ink-fg font-medium rounded-lg hover:bg-brand-ink-hover focus:outline-none focus:ring-2 focus:ring-brand-ink focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "..." : t.auth.forgotPasswordButton}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className={semanticStatusIconSuccessClass}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-brand-ink mb-2">
                  {t.auth.forgotPasswordTitle}
                </h2>
                <p className="text-gray-600 mb-6">
                  {t.auth.forgotPasswordSuccess}
                </p>
                <button
                  onClick={() => setLocation("/login")}
                  className="w-full py-3 bg-brand-ink text-brand-ink-fg font-medium rounded-lg hover:bg-brand-ink-hover transition-colors"
                >
                  {t.auth.backToLogin}
                </button>
              </div>
            )}

            {!sent && (
              <p className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-brand-ink font-medium hover:underline"
                >
                  {t.auth.backToLogin}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
