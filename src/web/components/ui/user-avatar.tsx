type UserAvatarSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<UserAvatarSize, { box: string; text: string }> = {
  sm: { box: "w-10 h-10", text: "text-sm" },
  md: { box: "w-16 h-16", text: "text-2xl" },
  lg: { box: "w-20 h-20", text: "text-3xl" },
};

export interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  /** Fondo cuando no hay imagen (sidebar vs settings) */
  variant?: "sidebar" | "settings";
  className?: string;
}

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  variant = "settings",
  className = "",
}: UserAvatarProps) {
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";
  const { box, text } = SIZE_CLASS[size];

  if (avatarUrl) {
    return (
      <img
        key={avatarUrl}
        src={avatarUrl}
        alt=""
        className={`${box} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  const fallbackClass =
    variant === "sidebar"
      ? "bg-white/10 text-white"
      : "bg-brand-ink text-brand-ink-fg";

  return (
    <div
      className={`${box} ${fallbackClass} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      aria-hidden
    >
      <span className={`font-semibold ${text}`}>{initial}</span>
    </div>
  );
}
