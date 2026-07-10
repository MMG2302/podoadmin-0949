export type SettingsTabId = "general" | "clinical" | "integrations" | "clinic" | "other";

type Tab = { id: SettingsTabId; label: string; visible?: boolean };

type Props = {
  active: SettingsTabId;
  onChange: (id: SettingsTabId) => void;
  tabs: Tab[];
};

export function SettingsTabBar({ active, onChange, tabs }: Props) {
  const visible = tabs.filter((t) => t.visible !== false);
  return (
    <div className="flex flex-wrap gap-2 pb-4 mb-2 border-b border-brand-border">
      {visible.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            active === tab.id
              ? "bg-brand-ink text-brand-ink-fg"
              : "bg-brand-canvas text-brand-muted hover:bg-brand-border/40"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
