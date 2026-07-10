import { useRef, useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { api } from "../../lib/api-client";
import { compressImageForAvatar } from "../../lib/image-compress";
import { UserAvatar } from "../ui/user-avatar";

export function ProfileAvatarSettingsSection() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.avatarUrl !== undefined) return;
    void (async () => {
      const res = await api.get<{ success?: boolean; avatar?: string | null }>("/users/me/avatar");
      if (res.success && res.data?.success) {
        updateUser({ avatarUrl: res.data.avatar ?? null });
      }
    })();
  }, [user, updateUser]);

  if (!user) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Formato no válido. Use PNG, JPG o WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar 2 MB.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const avatar = await compressImageForAvatar(file);
      // Vista previa inmediata (data URI única) mientras se guarda en el servidor
      updateUser({ avatarUrl: avatar });

      const res = await api.put<{ success: boolean; avatar?: string | null; message?: string; error?: string }>(
        "/users/me/avatar",
        { avatar }
      );
      if (res.success && res.data?.success) {
        updateUser({ avatarUrl: res.data.avatar ?? avatar });
      } else {
        setError(res.message || res.data?.error || "No se pudo guardar la foto.");
        const reload = await api.get<{ success?: boolean; avatar?: string | null }>("/users/me/avatar");
        if (reload.success && reload.data?.success) {
          updateUser({ avatarUrl: reload.data.avatar ?? null });
        }
      }
    } catch {
      setError("No se pudo procesar la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user.avatarUrl) return;
    setUploading(true);
    setError(null);
    try {
      const res = await api.delete<{ success: boolean }>("/users/me/avatar");
      if (res.success && res.data?.success) {
        updateUser({ avatarUrl: null });
      } else {
        setError("No se pudo quitar la foto.");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-2 disabled:opacity-60"
        title="Cambiar foto de perfil"
      >
        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="md" variant="settings" />
        <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-brand-ink">{user.name}</p>
        <p className="text-sm text-brand-muted">{user.email}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-sm font-medium text-brand-ink hover:underline disabled:opacity-50"
          >
            {uploading ? "Guardando…" : user.avatarUrl ? "Cambiar foto" : "Subir foto"}
          </button>
          {user.avatarUrl && (
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={uploading}
              className="text-sm font-medium text-brand-muted hover:text-semantic-error disabled:opacity-50"
            >
              Quitar foto
            </button>
          )}
        </div>
        <p className="text-xs text-brand-muted mt-1">
          JPG, PNG o WebP. Máx. 2 MB. Se muestra en el menú lateral.
        </p>
        {error && <p className="text-xs text-semantic-error mt-1">{error}</p>}
      </div>
    </div>
  );
}
