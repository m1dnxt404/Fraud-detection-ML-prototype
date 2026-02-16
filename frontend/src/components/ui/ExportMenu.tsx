import { useState, useRef, useEffect } from "react";

interface ExportMenuProps {
  onExportFlagged: () => void;
  onExportAll: () => void;
  onExportPdf: () => void;
  disabled?: boolean;
}

const ITEMS = [
  { key: "flagged", label: "Export Flagged (CSV)", icon: "↓" },
  { key: "all", label: "Export All (CSV)", icon: "↓" },
  { key: "pdf", label: "Download PDF Report", icon: "⎙" },
] as const;

export function ExportMenu({
  onExportFlagged,
  onExportAll,
  onExportPdf,
  disabled,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handlers: Record<string, () => void> = {
    flagged: onExportFlagged,
    all: onExportAll,
    pdf: onExportPdf,
  };

  function handleSelect(key: string) {
    setOpen(false);
    handlers[key]();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
          bg-fd-surface border border-fd-border transition-all cursor-pointer
          text-fd-text-muted hover:text-fd-text hover:bg-fd-surface-alt
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="text-sm">↓</span>
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-fd-surface border border-fd-border rounded-lg shadow-xl z-50 py-1">
          {ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              className="w-full text-left px-3 py-2 text-xs text-fd-text-muted hover:text-fd-text hover:bg-fd-surface-alt transition-colors cursor-pointer flex items-center gap-2"
            >
              <span className="text-sm opacity-60">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
