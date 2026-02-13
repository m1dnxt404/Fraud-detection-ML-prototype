import type { ReactNode } from "react";

type GlowVariant = "accent" | "green" | "amber" | "blue";

const glowClasses: Record<GlowVariant, string> = {
  accent: "shadow-glow-accent",
  green: "shadow-glow-green",
  amber: "shadow-glow-amber",
  blue: "shadow-glow-blue",
};

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: GlowVariant;
}

export function Card({ children, className = "", glow }: CardProps) {
  return (
    <div
      className={`
        bg-fd-surface border border-fd-border rounded-2xl p-6
        ${glow ? glowClasses[glow] : "shadow-card"}
        transition-all duration-300 ease-in-out
        ${className}
      `}
    >
      {children}
    </div>
  );
}
