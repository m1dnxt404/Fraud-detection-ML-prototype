import type { ModelType } from "../../types";

const MODELS: { value: ModelType; label: string }[] = [
  { value: "xgboost", label: "XGBoost" },
  { value: "tensorflow", label: "TensorFlow" },
];

interface ModelSelectorProps {
  active: ModelType;
  onChange: (model: ModelType) => void;
  disabled?: boolean;
}

export function ModelSelector({ active, onChange, disabled }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-fd-surface border border-fd-border rounded-lg p-1">
      {MODELS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            active === m.value
              ? "bg-fd-accent text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]"
              : "text-fd-text-muted hover:text-fd-text hover:bg-fd-surface-alt"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
