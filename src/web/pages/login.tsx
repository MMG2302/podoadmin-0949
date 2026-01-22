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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorDetails({});
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      setLocation("/");
    } else {
      setError(result.error || t.auth.invalidCredentials);
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="font-semibold mb-1">{error}</div>
                  {errorDetails.attemptCount && errorDetails.attemptCount > 0 && (
                    <div className="text-xs text-red-600 mt-1">
                      Intentos fallidos: {errorDetails.attemptCount}
                    </div>
                  )}
                  {errorDetails.blockedUntil && (
                    <div className="text-xs text-red-600 mt-1">
                      Bloqueado hasta: {new Date(errorDetails.blockedUntil).toLocaleTimeString()}
                    </div>
                  )}
                  {errorDetails.retryAfter && countdown !== null && countdown > 0 && (
                    <div className="text-xs text-red-600 mt-1 font-medium">
                      Puedes intentar nuevamente en: {formatTime(countdown)}
                    </div>
                  )}
                  {errorDetails.attemptCount && errorDetails.attemptCount >= 3 && (
                    <div className="text-xs text-red-600 mt-2 pt-2 border-t border-red-200">
                      Se ha enviado una notificación por email sobre estos intentos.
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
              </div>

              <button
                type="submit"
                disabled={isLoading || (countdown !== null && countdown > 0)}
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
              <p className="text-gray-400 text-sm text-center mb-4">{t.auth.testCredentials}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
