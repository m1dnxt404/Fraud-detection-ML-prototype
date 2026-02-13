interface PayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-fd-surface-alt border border-fd-border rounded-lg px-3.5 py-2.5 text-sm">
      {label && <div className="text-fd-text-muted mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || undefined }} className="text-fd-text">
          {p.name}:{" "}
          <strong>
            {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
}
