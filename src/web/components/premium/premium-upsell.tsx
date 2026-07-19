import { useLocation } from "wouter";
import { Lock, Sparkles } from "lucide-react";
import { useLanguage } from "../../contexts/language-context";

/**
 * Banner de upsell para funcionalidades del plan Premium.
 * Se muestra en lugar del contenido bloqueado (evita fetches que darían 402).
 */
export function PremiumUpsellBanner({
  title,
  body,
}: {
  title?: string;
  body?: string;
}) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-8 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-brand-ink text-brand-ink-fg flex items-center justify-center">
        <Sparkles className="w-6 h-6" />
      </div>
      <p className="text-lg font-semibold text-brand-ink">
        {title ?? t.premium.upsellTitle}
      </p>
      <p className="text-sm text-brand-muted max-w-md">{body ?? t.premium.upsellBody}</p>
      <button
        type="button"
        onClick={() => setLocation("/settings?tab=billing")}
        className="mt-2 px-4 py-2 rounded-lg bg-brand-ink text-brand-ink-fg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {t.premium.upsellCta}
      </button>
    </div>
  );
}

/** Candado pequeño para pestañas e ítems de navegación bloqueados. */
export function PremiumLockIcon({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <Lock
      className={className ?? "w-3.5 h-3.5 shrink-0 opacity-70"}
      aria-label={t.premium.lockedTab}
    />
  );
}
