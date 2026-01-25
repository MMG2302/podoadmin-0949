import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { useLocation } from "wouter";
import { api } from "../lib/api-client";

const Register = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState<{
    errors?: string[];
    retryAfter?: number;
    blockedUntil?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaWidgetId, setCaptchaWidgetId] = useState<any>(null);

  // Cargar script de CAPTCHA (Turnstile, reCAPTCHA o hCaptcha)
  useEffect(() => {
    const loadCaptcha = async () => {
      // Por ahora, asumimos que el CAPTCHA se manejará desde el frontend
      // En producción, esto debería cargar el script del proveedor configurado
      // Por ejemplo: Cloudflare Turnstile, Google reCAPTCHA, etc.
    };
    loadCaptcha();
  }, []);

  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (pwd.length < 12) errors.push(t.auth.passwordMinLength);
    if (!/[A-Z]/.test(pwd)) errors.push(t.auth.passwordUppercase);
    if (!/[a-z]/.test(pwd)) errors.push(t.auth.passwordLowercase);
    if (!/[0-9]/.test(pwd)) errors.push(t.auth.passwordNumber);
    if (!/[^A-Za-z0-9]/.test(pwd)) errors.push(t.auth.passwordSpecial);
    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setErrorDetails({});
    setIsLoading(true);

    // Validaciones básicas
    if (!name.trim()) {
      setError("El nombre es requerido");
      setIsLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("El email es requerido");
      setIsLoading(false);
      return;
    }

    if (!password || password.trim().length === 0) {
      setError("La contraseña es requerida");
      setIsLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError("Contraseña inválida");
      setErrorDetails({ errors: passwordValidation.errors });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError("Debes aceptar los términos y condiciones");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post<{ success: boolean; message: string; error?: string; errors?: string[]; retryAfter?: number; blockedUntil?: number; requiresCaptcha?: boolean }>("/auth/register", {
        email: email.trim(),
        password,
        name: name.trim(),
        termsAccepted: true,
        captchaToken: captchaToken || undefined,
      });

      console.log("Respuesta del servidor:", response);

      if (response.success) {
        setSuccess(true);
        // Redirigir a página de verificación después de 3 segundos
        setTimeout(() => {
          setLocation("/verify-email");
        }, 3000);
      } else {
        // Mostrar el mensaje de error del servidor
        // El api-client devuelve el error en response.error o response.message
        // Y los datos adicionales pueden estar en response.data
        const errorData = response.data || response;
        
        // Priorizar el mensaje del servidor
        const errorMessage = response.error || response.message || errorData.message || "Error al registrar";
        setError(errorMessage);
        
        console.log("Error del servidor:", {
          error: response.error,
          message: response.message,
          data: response.data,
          errorData: errorData,
        });
        
        // Extraer detalles adicionales de la respuesta
        if (errorData.errors) {
          setErrorDetails(prev => ({ 
            ...prev, 
            errors: Array.isArray(errorData.errors) ? errorData.errors : [errorData.errors] 
          }));
        }
        if (errorData.issues && Array.isArray(errorData.issues)) {
          // Si hay issues de validación de Zod, mostrarlos
          const issueMessages = errorData.issues.map((issue: any) => {
            const path = issue.path?.join('.') || '';
            return path ? `${path}: ${issue.message}` : issue.message;
          });
          setErrorDetails(prev => ({ 
            ...prev, 
            errors: issueMessages 
          }));
        }
        if (errorData.retryAfter || response.retryAfter) {
          setErrorDetails(prev => ({ ...prev, retryAfter: errorData.retryAfter || response.retryAfter }));
        }
        if (errorData.blockedUntil || response.blockedUntil) {
          setErrorDetails(prev => ({ ...prev, blockedUntil: errorData.blockedUntil || response.blockedUntil }));
        }
        if (errorData.requiresCaptcha || response.requiresCaptcha) {
          setErrorDetails(prev => ({ ...prev, requiresCaptcha: true }));
          // Si el error es de CAPTCHA, mostrar mensaje más claro
          if (errorMessage.includes('CAPTCHA') || errorData.requiresCaptcha) {
            setError("CAPTCHA requerido: Por favor, completa el CAPTCHA para continuar. Si no ves el widget, el CAPTCHA puede no estar configurado correctamente.");
          }
        }
      }
    } catch (err: any) {
      console.error("Error en registro (catch):", err);
      // El api.post normalmente no lanza excepciones, pero por si acaso
      // Mostrar el mensaje de error real si está disponible
      const errorMessage = err?.error || err?.message || err?.toString() || "Error de conexión con el servidor";
      setError(errorMessage);
      
      // Si hay detalles adicionales en el error
      if (err?.data) {
        const errorData = err.data;
        if (errorData.errors) {
          setErrorDetails({ errors: Array.isArray(errorData.errors) ? errorData.errors : [errorData.errors] });
        }
        if (errorData.retryAfter) {
          setErrorDetails(prev => ({ ...prev, retryAfter: errorData.retryAfter }));
        }
        if (errorData.blockedUntil) {
          setErrorDetails(prev => ({ ...prev, blockedUntil: errorData.blockedUntil }));
        }
      }
    } finally {
      setIsLoading(false);
    }
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

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Language switcher in header */}
        <div className="flex justify-end p-4">
          <LanguageSwitcher />
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-12">
              <h1 className="text-[#1a1a1a] text-4xl font-light tracking-tight">
                Podo<span className="font-bold">Admin</span>
              </h1>
            </div>

            {success ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
                    {t.auth.registrationSuccess}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {t.auth.registrationSuccessMessage}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.auth.checkEmail}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <h2 className="text-[#1a1a1a] text-3xl font-semibold mb-2">
                    {t.auth.registerTitle}
                  </h2>
                  <p className="text-gray-500">
                    {t.auth.registerSubtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      <div className="font-semibold mb-1">{error}</div>
                      {errorDetails.errors && errorDetails.errors.length > 0 && (
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {errorDetails.errors.map((err, idx) => (
                            <li key={idx} className="text-xs">{err}</li>
                          ))}
                        </ul>
                      )}
                      {errorDetails.blockedUntil && (
                        <div className="text-xs text-red-600 mt-1">
                          Bloqueado hasta: {new Date(errorDetails.blockedUntil).toLocaleString()}
                        </div>
                      )}
                      {errorDetails.retryAfter && (
                        <div className="text-xs text-red-600 mt-1">
                          Puedes intentar nuevamente en: {Math.ceil(errorDetails.retryAfter / 60)} minutos
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      {t.auth.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                      placeholder={t.auth.namePlaceholder}
                      required
                      autoComplete="name"
                    />
                  </div>

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
                      autoComplete="new-password"
                    />
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="font-medium mb-1">{t.auth.passwordRequirements}:</div>
                      <ul className="space-y-1 ml-4">
                        <li className={password.length >= 12 ? "text-green-600" : ""}>
                          {t.auth.passwordMinLength}
                        </li>
                        <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                          {t.auth.passwordUppercase}
                        </li>
                        <li className={/[a-z]/.test(password) ? "text-green-600" : ""}>
                          {t.auth.passwordLowercase}
                        </li>
                        <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                          {t.auth.passwordNumber}
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : ""}>
                          {t.auth.passwordSpecial}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      Confirmar {t.auth.passwordLabel}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                      placeholder={t.auth.passwordPlaceholder}
                      required
                      autoComplete="new-password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>
                    )}
                  </div>

                  {/* CAPTCHA Placeholder - En producción, aquí se cargaría el widget del proveedor configurado */}
                  <div id="captcha-container" className="flex justify-center">
                    {/* El CAPTCHA se cargará aquí dinámicamente según el proveedor configurado */}
                    <div className="text-sm text-gray-500">
                      {t.auth.captchaRequired}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTermsAccepted(!termsAccepted);
                      }}
                      className={`mt-1 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                        termsAccepted
                          ? 'bg-[#1a1a1a] border-[#1a1a1a]'
                          : 'bg-white border-gray-300 hover:border-[#1a1a1a]'
                      }`}
                      aria-label={termsAccepted ? 'Términos aceptados' : 'Aceptar términos'}
                    >
                      {termsAccepted && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 text-sm text-gray-700">
                      <span className="select-none">
                        {t.auth.termsAccept}{" "}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setLocation("/terms");
                        }}
                        className="text-[#1a1a1a] hover:underline cursor-pointer bg-transparent border-0 p-0"
                      >
                        {t.auth.termsLink}
                      </button>
                    </div>
                    {/* Input oculto para validación del formulario */}
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={() => {}}
                      className="hidden"
                      required
                      tabIndex={-1}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <span className={isLoading ? "opacity-0" : ""}>
                      {t.auth.registerButton}
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
                      className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm font-medium text-gray-700 bg-black text-white"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      {t.auth.loginWithApple}
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-gray-500 text-sm text-center">
                    {t.auth.alreadyHaveAccount}{" "}
                    <button
                      onClick={() => setLocation("/login")}
                      className="text-[#1a1a1a] font-medium hover:underline"
                    >
                      {t.auth.goToLogin}
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
