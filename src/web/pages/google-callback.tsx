import { useEffect, useState } from "react";
import { formErrorClass } from "../lib/form-field-classes";
import { api } from "../lib/api-client";
import { getPostLoginPath, normalizeUserSystemAccess, type User } from "../contexts/auth-context";
import { useLanguage } from "../contexts/language-context";

const GoogleCallbackPage = () => {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      setError(t.auth.googleNoCode);
      return;
    }

    api
      .post<{ success?: boolean; user?: User; message?: string; error?: string }>(
        "/auth/google/callback",
        { code }
      )
      .then((res) => {
        if (res.success && res.data?.success && res.data.user) {
          const userData = normalizeUserSystemAccess(res.data.user);
          localStorage.setItem("podoadmin_user", JSON.stringify(userData));
          window.location.href = getPostLoginPath(userData);
          return;
        }
        setError(res.data?.message || res.error || t.auth.googleLoginError);
      })
      .catch(() => setError(t.auth.serverConnectionError));
  }, [t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <p className={`${formErrorClass} mb-4`}>{error}</p>
            <a href="/login" className="text-brand-ink underline">
              {t.auth.backToLogin}
            </a>
          </>
        ) : (
          <p className="text-gray-600">{t.auth.googleCompleting}</p>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
