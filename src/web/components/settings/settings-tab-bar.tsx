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
    <div className="flex flex-wrap gap-2 pb-4 mb-2 border-b border-gray-200 dark:border-gray-800">
      {visible.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            active === tab.id
              ? "bg-[#1a1a1a] dark:bg-white text-white dark:text-[#1a1a1a]"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
