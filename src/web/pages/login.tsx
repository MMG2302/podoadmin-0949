import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/auth-context";
import { useLanguage } from "../contexts/language-context";
import { AuthPublicToolbar } from "../components/auth/auth-public-toolbar";
import { CaptchaWidget, type CaptchaProvider } from "../components/captcha-widget";
import { useLocation } from "wouter";
import { authPage as ap } from "../lib/auth-page-styles";
import { formErrorClass } from "../lib/form-field-classes";

type PublicConfig = {
  officialDomain?: string | null;
  supportEmail?: string | null;
  googleOAuthEnabled?: boolean;
  captcha?: { provider: CaptchaProvider; siteKey: string } | null;
  captchaDisabledInDev?: boolean;
};

const Login = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState<{
    retryAfter?: number;
    blockedUntil?: number;
    attemptCount?: number;
    isBlocked?: boolean;
    blockDurationMinutes?: number;
    requiresCaptcha?: boolean;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [officialDomain, setOfficialDomain] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState<string | null>(null);
  const [originMismatch, setOriginMismatch] = useState(false);
  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState(false);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  const handleCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  const captchaConfig = config?.captcha ?? null;
  const captchaRequired = !!captchaConfig;

  // Obtener dominio oficial y email de soporte
  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/config", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicConfig | null) => {
        if (cancelled) return;
        if (data) setConfig(data);
        const domain = data?.officialDomain;
        if (domain) {
          setOfficialDomain(domain);
          try {
            const officialOrigin = new URL(domain).origin;
            setOriginMismatch(window.location.origin !== officialOrigin);
          } catch {
            setOriginMismatch(false);
          }
        }
        if (data?.supportEmail) setSupportEmail(data.supportEmail);
        if (data?.googleOAuthEnabled) setGoogleOAuthEnabled(true);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Countdown timer para rate limiting
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
    }
  }, [countdown]);

  const formatTime = (seconds: number): string => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    return `${seconds}s`;
  };

  const getLoginErrorDisplay = (apiError: string | undefined): string => {
    if (!apiError) return t.auth.invalidCredentials;
    const lower = apiError.toLowerCase();
    if (lower.includes("demasiados intentos") || lower.includes("too many attempts") || lower.includes("muitas tentativas") || lower.includes("trop de tentatives")) return t.auth.tooManyAttempts;
    if (lower.includes("cuenta temporalmente bloqueada") || lower.includes("account temporarily blocked") || lower.includes("conta temporariamente bloqueada") || lower.includes("compte temporairement bloqué")) return t.auth.accountTemporarilyBlocked;
    if (lower.includes("credenciales") || lower.includes("invalid credentials") || lower.includes("credenciais") || lower.includes("identifiants")) return t.auth.invalidCredentials;
    if (lower.includes("captcha")) return apiError;
    return apiError;
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/google/url", { credentials: "include" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Google no está configurado en este entorno");
    } catch {
      setError("No se pudo conectar con Google");
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (captchaRequired && !captchaToken) {
      setError(t.auth.captchaRequired);
      return;
    }

    setIsLoading(true);

    const result = await login(email, password, captchaToken);

    if (result.success) {
      const dest = result.redirectPath ?? "/";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setLocation(dest));
      });
    } else {
      const needsCaptcha = result.requiresCaptcha === true || captchaRequired;
      setError(getLoginErrorDisplay(result.error) || t.auth.invalidCredentials);
      setErrorDetails({
        retryAfter: result.retryAfter,
        blockedUntil: result.blockedUntil,
        attemptCount: result.attemptCount,
        isBlocked: result.isBlocked,
        blockDurationMinutes: result.blockDurationMinutes,
        requiresCaptcha: needsCaptcha,
      });

      if (needsCaptcha || result.error?.toLowerCase().includes("captcha")) {
        setCaptchaToken(null);
        setCaptchaKey((k) => k + 1);
      }

      // Iniciar countdown si hay retryAfter
      if (result.retryAfter) {
        setCountdown(result.retryAfter);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className={ap.shell}>
      <div className="hidden lg:flex lg:w-1/2 bg-brand-ink relative overflow-hidden">
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
          
          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-white text-3xl font-light mb-2">100%</div>
              <div className="text-gray-500 text-sm">{t.branding.digital}</div>
            </div>
            <div>
              <div className="text-white text-3xl font-light mb-2">24/7</div>
              <div className="text-gray-500 text-sm">{t.branding.access}</div>
            </div>
            <div>
              <div className="text-white text-3xl font-light mb-2">SSL</div>
              <div className="text-gray-500 text-sm">{t.branding.secure}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className={ap.formColumnScroll}>
        <AuthPublicToolbar />

        <div className={ap.formScrollArea}>
          <div className={ap.formScrollInner}>
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-12">
              <h1 className={ap.mobileLogo}>
                Podo<span className="font-bold">Admin</span>
              </h1>
            </div>

            <div className="mb-10">
              <h2 className={ap.heading}>
                {t.auth.welcome}
              </h2>
              <p className={ap.subheading}>
                {t.auth.enterCredentials}
              </p>
            </div>

            {/* Alerta crítica: el usuario no está en el dominio oficial (posible phishing) */}
            {originMismatch && (
              <div className={`mb-6 ${ap.error} border-2 font-medium`}>
                {officialDomain ? (
                  (() => {
                    const [before, after] = t.auth.notOnOfficialDomain.split("{domain}");
                    return <>{before}<strong className="break-all">{officialDomain}</strong>{after}</>;
                  })()
                ) : (
                  t.auth.notOnOfficialDomainNoDomain
                )}
              </div>
            )}

            {/* Aviso anti-phishing: solo iniciar sesión en el dominio oficial */}
            <div className={`mb-6 ${ap.amber}`}>
              <span className="font-medium">{t.auth.securityLabel} </span>
              {officialDomain ? (
                (() => {
                  const [before, after] = t.auth.loginOnlyOnOfficialDomainWithDomain.split("{domain}");
                  return <>{before}<strong className="break-all">{officialDomain}</strong>{after}</>;
                })()
              ) : (
                t.auth.loginOnlyOnOfficialDomainGeneric
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Zona de bloqueo: aviso prominente cuando la cuenta está bloqueada por el backend */}
              {errorDetails.isBlocked && (
                <div className={`${ap.error} border-2 !px-5 !py-4 animate-in fade-in slide-in-from-top-2 duration-300`} role="alert">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 text-2xl" aria-hidden>🔒</span>
                    <div>
                      <div className="font-bold text-base">{t.auth.accountTemporarilyBlocked}</div>
                      {errorDetails.blockedUntil && (
                        <div className="text-sm mt-1">
                          {t.auth.blockedUntil} {new Date(errorDetails.blockedUntil).toLocaleTimeString()}
                          {errorDetails.blockDurationMinutes && ` (${errorDetails.blockDurationMinutes} min)`}
                        </div>
                      )}
                      {errorDetails.retryAfter !== undefined && countdown !== null && countdown > 0 && (
                        <div className="text-sm font-semibold mt-2">
                          {t.auth.retryIn} {formatTime(countdown)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {error && !errorDetails.isBlocked && (
                <div className={`${ap.error} animate-in fade-in slide-in-from-top-2 duration-300`}>
                  <div className="font-semibold mb-1">{error}</div>
                  {errorDetails.attemptCount && errorDetails.attemptCount > 0 && (
                    <div className={`${formErrorClass} text-xs mt-1`}>
                      {t.auth.failedAttempts} {errorDetails.attemptCount}
                    </div>
                  )}
                  {errorDetails.blockedUntil && (
                    <div className={`${formErrorClass} text-xs mt-1`}>
                      {t.auth.blockedUntil} {new Date(errorDetails.blockedUntil).toLocaleTimeString()}
                    </div>
                  )}
                  {errorDetails.retryAfter && countdown !== null && countdown > 0 && (
                    <div className={`${formErrorClass} text-xs mt-1 font-medium`}>
                      {t.auth.retryIn} {formatTime(countdown)}
                    </div>
                  )}
                  {errorDetails.attemptCount && errorDetails.attemptCount >= 3 && (
                    <div className={`${formErrorClass} text-xs mt-2 pt-2 border-t border-semantic-error/30`}>
                      {t.auth.emailNotificationSent}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className={ap.label}>
                  {t.auth.emailLabel}
                </label>
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
                <label className={ap.label}>
                  {t.auth.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={ap.inputWithIcon}
                    placeholder={t.auth.passwordPlaceholder}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-muted hover:text-brand-ink dark:hover:text-white"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M3 3l18 18M10.477 10.49A3 3 0 0113.5 13.5m-1.086 2.924A6.5 6.5 0 015.21 12.21M9.88 9.88A3 3 0 0114.12 14.12M9.88 9.88L7.05 7.05M14.12 14.12L16.95 16.95M9.88 9.88L9.88 9.88M14.12 14.12L14.12 14.12M9.88 9.88a3 3 0 014.24 4.24"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setLocation("/forgot-password")}
                    className={`text-sm ${ap.link}`}
                  >
                    {t.auth.forgotPassword}
                  </button>
                </div>
              </div>

              {import.meta.env.DEV && !configLoading && !captchaRequired && (
                <div className={`${ap.amber} mb-4`}>
                  {config?.captchaDisabledInDev
                    ? t.auth.captchaDisabledInDev
                    : t.auth.captchaNotConfigured}
                </div>
              )}

              {captchaConfig && (
                <div className="flex flex-col items-center gap-2 min-h-[65px]">
                  <CaptchaWidget
                    key={captchaKey}
                    provider={captchaConfig.provider}
                    siteKey={captchaConfig.siteKey}
                    onToken={handleCaptchaToken}
                  />
                </div>
              )}

              {googleOAuthEnabled && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading || originMismatch}
                    className={ap.googleBtn}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {t.auth.loginWithGoogle}
                  </button>
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className={ap.dividerLine}>o</span></div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={
                  isLoading ||
                  originMismatch ||
                  (countdown !== null && countdown > 0) ||
                  (captchaRequired && !captchaToken)
                }
                className={ap.primaryBtn}
              >
                <span className={isLoading ? "opacity-0" : ""}>
                  {t.auth.loginButton}
                </span>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-brand-border space-y-3">
              <p className={`${ap.muted} text-center`}>
                {t.auth.dontHaveAccount}{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/register")}
                  className={ap.link}
                >
                  {t.auth.register}
                </button>
              </p>
              <p className={`${ap.muted} text-center`}>
                <a
                  href={`mailto:${supportEmail || "soporte@podoadmin.com"}?subject=${encodeURIComponent("Solicitud de cuenta - PodoAdmin")}`}
                  className={ap.link}
                >
                  {t.auth.contactAdminForAccount}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
