import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useLanguage } from "../contexts/language-context";
import { AuthPublicToolbar } from "../components/auth/auth-public-toolbar";
import { CaptchaWidget, type CaptchaProvider } from "../components/captcha-widget";
import { api } from "../lib/api-client";
import { authPage as ap } from "../lib/auth-page-styles";

type PublicConfig = {
  officialDomain?: string | null;
  supportEmail?: string | null;
  captcha?: { provider: CaptchaProvider; siteKey: string } | null;
  captchaDisabledInDev?: boolean;
  captchaRequired?: boolean;
  emailVerificationRequired?: boolean;
  publicRegistrationEnabled?: boolean;
};

function checkPasswordRules(password: string) {
  return {
    minLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

const Register = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [clinicCode, setClinicCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailVerificationSkipped, setEmailVerificationSkipped] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const handleCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/config", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicConfig | null) => {
        if (!cancelled) setConfig(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) return;
    const timer = setTimeout(() => setRetryAfter(retryAfter - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryAfter]);

  const pwdRules = useMemo(() => checkPasswordRules(password), [password]);
  const passwordValid = Object.values(pwdRules).every(Boolean);
  const captchaConfig = config?.captcha ?? null;
  const captchaRequired = !!captchaConfig;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsDuplicateEmail(false);

    if (!termsAccepted) {
      setError(t.auth.termsAccept);
      return;
    }
    if (!privacyPolicyAccepted) {
      setError(`${t.auth.privacyAccept} ${t.auth.privacyLink}`);
      return;
    }
    if (!passwordValid) {
      setError(t.auth.passwordRequirements);
      return;
    }
    if (captchaRequired && !captchaToken) {
      setError(t.auth.captchaRequired);
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        termsAccepted: true,
        privacyPolicyAccepted: true,
      };
      if (captchaToken) body.captchaToken = captchaToken;
      if (clinicCode.trim()) body.clinicCode = clinicCode.trim();

      const response = await api.post<{
        success: boolean;
        message?: string;
        emailVerificationSkipped?: boolean;
      }>("/auth/register", body);

      if (response.success) {
        setEmailVerificationSkipped(
          Boolean(response.data?.emailVerificationSkipped) ||
            config?.emailVerificationRequired === false
        );
        setSuccess(true);
        return;
      }

      const msg = response.message || response.error || "";
      const code = (response.data as { code?: string } | undefined)?.code;
      if (code === "email_already_registered") {
        setIsDuplicateEmail(true);
        setError(t.auth.emailAlreadyRegistered);
      } else {
        if (response.retryAfter) {
          setRetryAfter(Number(response.retryAfter));
        }
        setError(msg || t.auth.captchaError);
      }
      setCaptchaToken(null);
    } catch {
      setError(t.auth.loginError);
    } finally {
      setIsLoading(false);
    }
  };

  const brandingPanel = (
    <div className="hidden lg:flex lg:w-1/2 bg-brand-ink relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-register" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-register)" />
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
        <p className="text-gray-400 text-lg text-center max-w-md leading-relaxed">{t.branding.tagline}</p>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className={ap.shell}>
        {brandingPanel}
      <div className={ap.formColumnScroll}>
        <AuthPublicToolbar />
        <div className="flex-1 flex justify-center p-8 pt-2 pb-12">
            <div className="w-full max-w-md text-center">
              <div className="mb-6 text-5xl" aria-hidden>
                {emailVerificationSkipped ? "✓" : "✉️"}
              </div>
              <h2 className={ap.heading}>{t.auth.registrationSuccess}</h2>
              {emailVerificationSkipped ? (
                <>
                  <p className={`${ap.bodyText} mb-8`}>{t.auth.registrationSuccessDevMessage}</p>
                </>
              ) : (
                <>
                  <p className={`${ap.bodyText} mb-2`}>{t.auth.registrationSuccessMessage}</p>
                  <p className={`${ap.muted} mb-8`}>{t.auth.checkEmail}</p>
                </>
              )}
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className={ap.primaryBtn}
              >
                {t.auth.goToLogin}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ap.shell}>
      {brandingPanel}

      <div className={ap.formColumnScroll}>
        <AuthPublicToolbar />
        <div className="flex-1 flex justify-center p-8 pt-2 pb-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <h1 className={ap.mobileLogo}>
                Podo<span className="font-bold">Admin</span>
              </h1>
            </div>

            <div className="mb-8">
              <h2 className={ap.heading}>{t.auth.registerTitle}</h2>
              <p className={ap.subheading}>{t.auth.registerSubtitle}</p>
            </div>

            {configLoading ? (
              <div className="flex justify-center py-12">
                <svg
                  className={ap.spinner}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className={ap.error}>
                    {error}
                    {isDuplicateEmail && (
                      <button
                        type="button"
                        onClick={() => setLocation("/login")}
                        className="mt-2 block font-medium underline hover:no-underline"
                      >
                        {t.auth.goToLogin}
                      </button>
                    )}
                    {retryAfter !== null && retryAfter > 0 && (
                      <div className="mt-1 text-xs font-medium">
                        {t.auth.retryIn} {retryAfter}s
                      </div>
                    )}
                  </div>
                )}

                {import.meta.env.DEV && !configLoading && !captchaRequired && (
                  <div className={ap.amber}>
                    {config?.captchaDisabledInDev
                      ? t.auth.captchaDisabledInDev
                      : t.auth.captchaNotConfigured}
                  </div>
                )}

                <div>
                  <label className={ap.label}>{t.auth.nameLabel}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={ap.input}
                    placeholder={t.auth.namePlaceholder}
                    required
                    minLength={2}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className={ap.labelTight}>{t.auth.emailLabel}</label>
                  <p className={ap.hint}>{t.auth.emailHint}</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={ap.input}
                    placeholder={t.auth.emailPlaceholder}
                    required
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className={ap.labelTight}>
                    {t.auth.clinicCodeLabel}
                  </label>
                  <p className={ap.hint}>{t.auth.clinicCodeHint}</p>
                  <input
                    type="text"
                    value={clinicCode}
                    onChange={(e) => setClinicCode(e.target.value)}
                    className={ap.input}
                    placeholder={t.auth.clinicCodePlaceholder}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className={ap.label}>{t.auth.passwordLabel}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={ap.inputWithIcon}
                      placeholder={t.auth.passwordPlaceholder}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-muted hover:text-brand-ink dark:hover:text-white"
                      aria-label={showPassword ? "Ocultar" : "Mostrar"}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <ul className="mt-2 text-xs text-brand-muted space-y-1">
                      <li className={pwdRules.minLength ? "text-green-700 dark:text-green-400" : ""}>• {t.auth.passwordMinLength}</li>
                      <li className={pwdRules.uppercase ? "text-green-700 dark:text-green-400" : ""}>• {t.auth.passwordUppercase}</li>
                      <li className={pwdRules.lowercase ? "text-green-700 dark:text-green-400" : ""}>• {t.auth.passwordLowercase}</li>
                      <li className={pwdRules.number ? "text-green-700 dark:text-green-400" : ""}>• {t.auth.passwordNumber}</li>
                      <li className={pwdRules.special ? "text-green-700 dark:text-green-400" : ""}>• {t.auth.passwordSpecial}</li>
                    </ul>
                  )}
                </div>

                <label className={ap.termsBox}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-5 w-5 min-h-[20px] min-w-[20px] shrink-0 rounded border-2 border-brand-border bg-brand-surface text-brand-ink accent-brand-ink cursor-pointer focus:ring-2 focus:ring-brand-ink focus:ring-offset-1"
                    required
                    aria-label={t.auth.termsLink}
                  />
                  <span className={`${ap.bodyText} leading-relaxed`}>
                    {t.auth.termsAccept}{" "}
                    <Link href="/terms" className={ap.link}>
                      {t.auth.termsLink}
                    </Link>
                  </span>
                </label>

                <label className={ap.termsBox}>
                  <input
                    type="checkbox"
                    checked={privacyPolicyAccepted}
                    onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                    className="mt-0.5 h-5 w-5 min-h-[20px] min-w-[20px] shrink-0 rounded border-2 border-brand-border bg-brand-surface text-brand-ink accent-brand-ink cursor-pointer focus:ring-2 focus:ring-brand-ink focus:ring-offset-1"
                    required
                    aria-label={t.auth.privacyLink}
                  />
                  <span className={`${ap.bodyText} leading-relaxed`}>
                    {t.auth.privacyAccept}{" "}
                    <Link href="/privacy" className={ap.link}>
                      {t.auth.privacyLink}
                    </Link>
                  </span>
                </label>

                {captchaConfig && (
                  <div className="flex justify-center min-h-[65px]">
                    <CaptchaWidget
                      provider={captchaConfig.provider}
                      siteKey={captchaConfig.siteKey}
                      onToken={handleCaptchaToken}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    (captchaRequired && !captchaToken) ||
                    (retryAfter !== null && retryAfter > 0)
                  }
                  className={ap.primaryBtn}
                >
                  <span className={isLoading ? "opacity-0" : ""}>{t.auth.registerButton}</span>
                  {isLoading && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-brand-ink-fg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            )}

            <p className={`mt-8 text-center ${ap.muted}`}>
              {t.auth.alreadyHaveAccount}{" "}
              <button
                type="button"
                onClick={() => setLocation("/login")}
                className={ap.link}
              >
                {t.auth.goToLogin}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
