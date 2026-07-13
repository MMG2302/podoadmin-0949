export type SettingsTabId = "general" | "clinical" | "integrations" | "clinic" | "billing" | "other";

type Tab = { id: SettingsTabId; label: string; visible?: boolean };

type Props = {
  active: SettingsTabId;
  onChange: (id: SettingsTabId) => void;
  tabs: Tab[];
};

export function SettingsTabBar({ active, onChange, tabs }: Props) {
  const visible = tabs.filter((t) => t.visible !== false);
  return (
    <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto overscroll-x-contain pb-4 mb-2 border-b border-brand-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-1.5 sm:gap-2 sm:flex-wrap min-w-max sm:min-w-0">
        {visible.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap ${
              active === tab.id
                ? "bg-brand-ink text-brand-ink-fg"
                : "bg-brand-canvas text-brand-muted hover:bg-brand-border/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
