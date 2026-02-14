import { useState, useEffect } from "react";
import { useLocation, useLocation as useWouterLocation } from "wouter";
import { useLanguage } from "../contexts/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { api } from "../lib/api-client";

const VerifyEmail = () => {
  const { t } = useLanguage();
  const [location, setLocation] = useWouterLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);

  useEffect(() => {
    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    
    if (tokenParam) {
      setToken(tokenParam);
      verifyEmail(tokenParam);
    } else {
      setError("No se proporcionó un token de verificación");
    }
  }, []);

  const verifyEmail = async (emailToken: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        user?: { id: string; email: string; name: string };
      }>("/auth/verify-email", {
        token: emailToken,
      });

      if (response.success) {
        setIsVerified(true);
        if (response.data?.user) {
          setUser(response.data.user);
        }
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          setLocation("/login");
        }, 3000);
      } else {
        setError(response.error || response.message || "Error al verificar el email");
      }
    } catch (err: any) {
      console.error("Error verificando email:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setIsVerifying(false);
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
        </div>
      </div>

      {/* Right Panel - Verification Status */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Language switcher in header */}
        <div className="flex justify-end p-4">
          <LanguageSwitcher />
        </div>
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-12">
              <h1 className="text-[#1a1a1a] text-4xl font-light tracking-tight">
                Podo<span className="font-bold">Admin</span>
              </h1>
            </div>

            {isVerifying && (
              <div>
                <div className="mb-6">
                  <svg className="animate-spin h-12 w-12 text-[#1a1a1a] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
                  {t.auth.verifyEmailTitle}
                </h2>
                <p className="text-gray-600">
                  {t.auth.verifyEmailSubtitle}
                </p>
              </div>
            )}

            {isVerified && (
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
                    {t.auth.verifyEmailSuccess}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {t.auth.verifyEmailSuccessMessage}
                  </p>
                  {user && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{user.name}</span>
                        <br />
                        <span className="text-gray-500">{user.email}</span>
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Redirigiendo al login...
                  </p>
                </div>
              </div>
            )}

            {error && !isVerifying && (
              <div>
                <div className="mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">
                    {t.auth.verifyEmailError}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {error}
                  </p>
                  {error.includes("expirado") || error.includes("expired") ? (
                    <p className="text-sm text-gray-500 mb-4">
                      {t.auth.verifyEmailExpired}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setLocation("/login")}
                    className="w-full py-3 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
                  >
                    {t.auth.goToLogin}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
