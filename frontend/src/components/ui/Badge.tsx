import type { ReactNode } from "react";

export type BadgeColor = "accent" | "green" | "amber" | "blue" | "purple";

const colorClasses: Record<BadgeColor, string> = {
  accent: "bg-fd-accent/10 text-fd-accent border-fd-accent/20",
  green: "bg-fd-green/10 text-fd-green border-fd-green/20",
  amber: "bg-fd-amber/10 text-fd-amber border-fd-amber/20",
  blue: "bg-fd-blue/10 text-fd-blue border-fd-blue/20",
  purple: "bg-fd-purple/10 text-fd-purple border-fd-purple/20",
};

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
}

export function Badge({ children, color = "accent" }: BadgeProps) {
  return (
    <span
      className={`
        ${colorClasses[color]}
        px-3 py-1 rounded-full text-xs font-semibold tracking-wide border
      `}
    >
      {children}
    </span>
  );
}
