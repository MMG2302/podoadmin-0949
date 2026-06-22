import { useEffect, useState } from "react";
import { api } from "../lib/api-client";
import { getPostLoginPath, normalizeUserSystemAccess, type User } from "../contexts/auth-context";

const GoogleCallbackPage = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) {
      setError("No se recibió código de Google");
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
        setError(res.data?.message || res.error || "Error al iniciar sesión con Google");
      })
      .catch(() => setError("Error de conexión con el servidor"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <a href="/login" className="text-[#1a1a1a] dark:text-white underline">
              Volver al inicio de sesión
            </a>
          </>
        ) : (
          <p className="text-gray-600">Completando inicio de sesión con Google…</p>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
