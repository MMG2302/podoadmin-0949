import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../contexts/language-context";
import { useAuth } from "../contexts/auth-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { api } from "../lib/api-client";

const PASSWORD_REQUIREMENTS = [
  { key: "length", test: (p: string) => p.length >= 12, labelKey: "passwordMinLength" as const },
  { key: "uppercase", test: (p: string) => /[A-Z]/.test(p), labelKey: "passwordUppercase" as const },
  { key: "lowercase", test: (p: string) => /[a-z]/.test(p), labelKey: "passwordLowercase" as const },
  { key: "number", test: (p: string) => /[0-9]/.test(p), labelKey: "passwordNumber" as const },
  { key: "special", test: (p: string) => /[^A-Za-z0-9]/.test(p), labelKey: "passwordSpecial" as const },
];

const ChangePassword = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t.auth.resetPasswordPasswordsMismatch);
      return;
    }

    if (!currentPassword) {
      setError("Introduce tu contraseña actual.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<{ success: boolean; message?: string }>("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (response.success) {
        updateUser({ mustChangePassword: false });
        setSuccess(true);
        setTimeout(() => setLocation("/"), 2000);
      } else {
        setError(response.message || response.error || "Error al cambiar la contraseña");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-change" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-change)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <img src="/favicon.svg" alt="Logo" className="w-40 h-40 mb-8" />
          <h1 className="text-white text-5xl font-light tracking-tight mb-4">
            Podo<span className="font-bold">Admin</span>
          </h1>
          <p className="text-gray-400 text-lg text-center max-w-md">{t.branding.tagline}</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="flex justify-end p-4">
          <LanguageSwitcher />
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-12">
              <h1 className="text-[#1a1a1a] text-4xl font-light tracking-tight">
                Podo<span className="font-bold">Admin</span>
              </h1>
            </div>

            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">{t.auth.changePasswordSuccess}</h2>
                <p className="text-gray-600">{t.auth.changePasswordRedirecting}</p>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <h2 className="text-[#1a1a1a] text-3xl font-semibold mb-2">{t.auth.changePasswordTitle}</h2>
                  <p className="text-gray-500">{t.auth.changePasswordSubtitle}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      {t.auth.currentPasswordLabel}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3.5 pr-11 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-[#1a1a1a]"
                        aria-label={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showCurrentPassword ? (
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">{t.auth.newPasswordLabel}</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3.5 pr-11 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                        placeholder="••••••••"
                        required
                        minLength={12}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-[#1a1a1a]"
                        aria-label={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showNewPassword ? (
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
                    <div className="mt-2 space-y-1.5">
                      {PASSWORD_REQUIREMENTS.map((req) => {
                        const ok = req.test(newPassword);
                        return (
                          <div key={req.key} className="flex items-center gap-2 text-sm">
                            <span
                              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${ok ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                            >
                              {ok ? (
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-xs">—</span>
                              )}
                            </span>
                            <span className={ok ? "text-green-700" : "text-gray-500"}>{t.auth[req.labelKey]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      {t.auth.resetPasswordRepeatPassword}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3.5 pr-11 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                        placeholder="••••••••"
                        required
                        minLength={12}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-[#1a1a1a]"
                        aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showConfirmPassword ? (
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
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "..." : t.auth.changePasswordButton}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
