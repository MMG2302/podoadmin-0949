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
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState<{
    retryAfter?: number;
    blockedUntil?: number;
    attemptCount?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [officialDomain, setOfficialDomain] = useState<string | null>(null);
  const [originMismatch, setOriginMismatch] = useState(false);

  // Obtener dominio oficial y verificar que el usuario está en el origen correcto (anti-phishing)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/config", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { officialDomain?: string | null } | null) => {
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
      setLocation("/");
    } else {
      setError(getLoginErrorDisplay(result.error) || t.auth.invalidCredentials);
      setErrorDetails({
        retryAfter: result.retryAfter,
        blockedUntil: result.blockedUntil,
        attemptCount: result.attemptCount,
      });

      // Iniciar countdown si hay retryAfter
      if (result.retryAfter) {
        setCountdown(result.retryAfter);
      }
    }
    setIsLoading(false);
  };

  const testCredentials = [
    { role: t.roles.superAdmin, email: "admin@podoadmin.com", password: "admin123" },
    { role: t.roles.admin, email: "support@podoadmin.com", password: "support123" },
  ];

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
              {error && (
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                  placeholder={t.auth.passwordPlaceholder}
                  required
                  autoComplete="current-password"
                />
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

            {/* OAuth Buttons */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t.auth.orContinueWith}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => window.location.href = '/api/auth/oauth/google'}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium text-gray-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t.auth.loginWithGoogle}
                </button>
                <button
                  type="button"
                  onClick={() => window.location.href = '/api/auth/oauth/apple'}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-800 hover:border-gray-700 transition-colors text-sm font-medium bg-black text-white"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  {t.auth.loginWithApple}
                </button>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-gray-400 text-sm text-center mb-4">{t.auth.testCredentials}</p>
              <div className="grid grid-cols-2 gap-3 text-xs mb-6">
                {testCredentials.map((cred, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email);
                      setPassword(cred.password);
                    }}
                    className="bg-gray-50 p-3 rounded-lg text-left hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-semibold text-[#1a1a1a] mb-1">{cred.role}</div>
                    <div className="text-gray-500 truncate">{cred.email}</div>
                    <div className="text-gray-400">{cred.password}</div>
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-sm text-center">
                {t.auth.dontHaveAccount}{" "}
                <button
                  onClick={() => setLocation("/register")}
                  className="text-[#1a1a1a] font-medium hover:underline"
                >
                  {t.auth.register}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
