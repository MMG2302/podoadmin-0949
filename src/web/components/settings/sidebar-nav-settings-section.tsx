import { useCallback, useMemo, useState } from "react";
import { useLanguage } from "../../contexts/language-context";
import { useSidebarNavItems } from "../../hooks/use-sidebar-nav-items";
import { resetNavVisibility, setNavPathVisible } from "../../lib/nav-preferences";
import { useNavVisibility } from "../../hooks/use-nav-visibility";

export function SidebarNavSettingsSection() {
  const { t } = useLanguage();
  const { permittedItems } = useSidebarNavItems();
  const navVisibility = useNavVisibility();
  const [minOneWarning, setMinOneWarning] = useState(false);

  const visibleCount = useMemo(
    () => permittedItems.filter((item) => navVisibility[item.path] !== false).length,
    [permittedItems, navVisibility]
  );

  const togglePath = useCallback(
    (path: string, nextVisible: boolean) => {
      if (!nextVisible && visibleCount <= 1) {
        setMinOneWarning(true);
        return;
      }
      setMinOneWarning(false);
      setNavPathVisible(path, nextVisible);
    },
    [visibleCount]
  );

  const handleReset = useCallback(() => {
    resetNavVisibility();
    setMinOneWarning(false);
  }, []);

  if (permittedItems.length === 0) return null;

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border p-6">
      <h3 className="text-lg font-semibold text-brand-ink mb-1">{t.settings.navMenuTitle}</h3>
      <p className="text-sm text-brand-muted mb-4">{t.settings.navMenuHint}</p>

      <ul className="space-y-2">
        {permittedItems.map((item) => {
          const visible = navVisibility[item.path] !== false;
          return (
            <li key={item.path}>
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-brand-border bg-brand-canvas hover:bg-brand-border/20 cursor-pointer transition-colors min-h-[44px]">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => togglePath(item.path, e.target.checked)}
                  className="w-4 h-4 rounded border-brand-border text-brand-ink focus:ring-brand-ink"
                />
                <span className="text-brand-muted shrink-0 [&>svg]:w-5 [&>svg]:h-5">{item.icon}</span>
                <span className="text-sm font-medium text-brand-ink flex-1">{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>

      {minOneWarning && (
        <p className="mt-3 text-sm text-semantic-warning">{t.settings.navMenuMinOne}</p>
      )}

      <div className="mt-4 pt-4 border-t border-brand-border">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-brand-muted border border-brand-border rounded-lg hover:bg-brand-canvas transition-colors"
        >
          {t.settings.navMenuReset}
        </button>
      </div>
    </div>
  );
}
