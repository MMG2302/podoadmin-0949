import { useState, useEffect } from "react";
import { useAuth } from "../contexts/auth-context";
import { useLanguage } from "../contexts/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { useLocation } from "wouter";

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
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [officialDomain, setOfficialDomain] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState<string | null>(null);
  const [originMismatch, setOriginMismatch] = useState(false);

  // Obtener dominio oficial y email de soporte
  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/config", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { officialDomain?: string | null; supportEmail?: string | null } | null) => {
        if (cancelled) return;
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
      })
      .catch(() => {});
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
    return apiError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorDetails({});
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Defer navigation so auth state is committed and layout paints correctly on mobile
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setLocation("/"));
      });
    } else {
      setError(getLoginErrorDisplay(result.error) || t.auth.invalidCredentials);
      setErrorDetails({
        retryAfter: result.retryAfter,
        blockedUntil: result.blockedUntil,
        attemptCount: result.attemptCount,
        isBlocked: result.isBlocked,
        blockDurationMinutes: result.blockDurationMinutes,
      });

      // Iniciar countdown si hay retryAfter
      if (result.retryAfter) {
        setCountdown(result.retryAfter);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] relative overflow-hidden">
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
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Language switcher in header */}
        <div className="flex justify-end p-4">
          <LanguageSwitcher />
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-12">
              <h1 className="text-[#1a1a1a] text-4xl font-light tracking-tight">
                Podo<span className="font-bold">Admin</span>
              </h1>
            </div>

            <div className="mb-10">
              <h2 className="text-[#1a1a1a] text-3xl font-semibold mb-2">
                {t.auth.welcome}
              </h2>
              <p className="text-gray-500">
                {t.auth.enterCredentials}
              </p>
            </div>

            {/* Alerta crítica: el usuario no está en el dominio oficial (posible phishing) */}
            {originMismatch && (
              <div className="mb-6 rounded-lg border-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900 font-medium">
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
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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
                <div className="bg-red-100 border-2 border-red-400 text-red-900 px-5 py-4 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300" role="alert">
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="font-semibold mb-1">{error}</div>
                  {errorDetails.attemptCount && errorDetails.attemptCount > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      {t.auth.failedAttempts} {errorDetails.attemptCount}
                    </div>
                  )}
                  {errorDetails.blockedUntil && (
                    <div className="text-xs text-red-600 mt-1">
                      {t.auth.blockedUntil} {new Date(errorDetails.blockedUntil).toLocaleTimeString()}
                    </div>
                  )}
                  {errorDetails.retryAfter && countdown !== null && countdown > 0 && (
                    <div className="text-xs text-red-600 mt-1 font-medium">
                      {t.auth.retryIn} {formatTime(countdown)}
                    </div>
                  )}
                  {errorDetails.attemptCount && errorDetails.attemptCount >= 3 && (
                    <div className="text-xs text-red-600 mt-2 pt-2 border-t border-red-200">
                      {t.auth.emailNotificationSent}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  {t.auth.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                  placeholder={t.auth.emailPlaceholder}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  {t.auth.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 pr-11 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                    placeholder={t.auth.passwordPlaceholder}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-[#1a1a1a]"
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
                    className="text-sm text-[#1a1a1a] hover:underline font-medium"
                  >
                    {t.auth.forgotPassword}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || originMismatch || (countdown !== null && countdown > 0)}
                className="w-full py-3.5 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
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

            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-gray-500 text-sm text-center">
                <a
                  href={`mailto:${supportEmail || "soporte@podoadmin.com"}?subject=${encodeURIComponent("Solicitud de cuenta - PodoAdmin")}`}
                  className="text-[#1a1a1a] hover:underline font-medium"
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
