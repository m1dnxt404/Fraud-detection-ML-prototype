import { Card } from "./Card";

type GlowVariant = "accent" | "green" | "amber" | "blue";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
  glow?: GlowVariant;
}

export function MetricCard({
  label,
  value,
  sub,
  colorClass = "text-fd-text",
  glow,
}: MetricCardProps) {
  return (
    <Card glow={glow}>
      <div className="text-xs text-fd-text-dim uppercase tracking-widest mb-2 font-semibold">
        {label}
      </div>
      <div className={`text-3xl font-bold font-mono leading-none ${colorClass}`}>
        {value}
      </div>
      {sub && (
        <div className="text-sm text-fd-text-muted mt-1.5">{sub}</div>
      )}
    </Card>
  );
}
