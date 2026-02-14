import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "../contexts/language-context";
import { LanguageSwitcher } from "../components/language-switcher";
import { api } from "../lib/api-client";

const PASSWORD_REQUIREMENTS = [
  { key: "length", test: (p: string) => p.length >= 12, labelKey: "passwordMinLength" as const },
  { key: "uppercase", test: (p: string) => /[A-Z]/.test(p), labelKey: "passwordUppercase" as const },
  { key: "lowercase", test: (p: string) => /[a-z]/.test(p), labelKey: "passwordLowercase" as const },
  { key: "number", test: (p: string) => /[0-9]/.test(p), labelKey: "passwordNumber" as const },
  { key: "special", test: (p: string) => /[^A-Za-z0-9]/.test(p), labelKey: "passwordSpecial" as const },
];

const ResetPassword = () => {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError(t.auth.resetPasswordInvalidLink);
    }
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t.auth.resetPasswordPasswordsMismatch);
      return;
    }

    if (!token) {
      setError(t.auth.resetPasswordMissingToken);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<{ success: boolean; message?: string }>("/auth/reset-password", {
        token,
        newPassword,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => setLocation("/login"), 3000);
      } else {
        setError(response.message || response.error || t.auth.resetPasswordErrorReset);
      }
    } catch (err: any) {
      setError(err?.message || t.auth.resetPasswordErrorConnection);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => setLocation("/forgot-password")}
            className="w-full py-3 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#2a2a2a]"
          >
            {t.auth.requestNewLink}
          </button>
          <button
            onClick={() => setLocation("/login")}
            className="w-full mt-3 py-3 bg-gray-100 text-[#1a1a1a] font-medium rounded-lg hover:bg-gray-200"
          >
            {t.auth.backToLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-reset" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-reset)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <img src="/favicon.svg" alt="Logo" className="w-40 h-40 mb-8" />
          <h1 className="text-white text-5xl font-light tracking-tight mb-4">
            Podo<span className="font-bold">Admin</span>
          </h1>
          <p className="text-gray-400 text-lg text-center max-w-md">
            {t.branding.tagline}
          </p>
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
                <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">
                  {t.auth.resetPasswordSuccess}
                </h2>
                <p className="text-gray-600">{t.auth.resetPasswordRedirecting}</p>
              </div>
            ) : (
              <>
                <div className="mb-10">
                  <h2 className="text-[#1a1a1a] text-3xl font-semibold mb-2">
                    {t.auth.resetPasswordTitle}
                  </h2>
                  <p className="text-gray-500">
                    {t.auth.resetPasswordSubtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      {t.auth.newPasswordLabel}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                      placeholder="••••••••"
                      required
                      minLength={12}
                      autoComplete="new-password"
                    />
                    <div className="mt-2 space-y-1.5">
                      {PASSWORD_REQUIREMENTS.map((req) => {
                        const ok = req.test(newPassword);
                        return (
                          <div key={req.key} className="flex items-center gap-2 text-sm">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${ok ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                              {ok ? (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-xs">—</span>
                              )}
                            </span>
                            <span className={ok ? "text-green-700" : "text-gray-500"}>
                              {t.auth[req.labelKey]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                      {t.auth.resetPasswordRepeatPassword}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a] transition-all text-[#1a1a1a] placeholder:text-gray-400"
                      placeholder="••••••••"
                      required
                      minLength={12}
                      autoComplete="new-password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "..." : t.auth.resetPasswordButton}
                  </button>
                </form>

                <p className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => setLocation("/login")}
                    className="text-[#1a1a1a] font-medium hover:underline"
                  >
                    {t.auth.backToLogin}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
