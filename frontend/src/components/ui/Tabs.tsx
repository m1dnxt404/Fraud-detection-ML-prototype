interface Tab {
  readonly key: string;
  readonly label: string;
}

interface TabsProps {
  tabs: readonly Tab[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-fd-surface-alt rounded-xl p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`
            px-5 py-2.5 rounded-lg border-none cursor-pointer
            font-semibold text-sm tracking-tight font-sans
            transition-all duration-200
            ${
              active === t.key
                ? "bg-fd-accent text-white"
                : "bg-transparent text-fd-text-muted hover:text-fd-text"
            }
          `}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
