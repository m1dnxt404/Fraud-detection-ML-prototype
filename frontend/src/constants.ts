/** Palette values for Recharts (which needs raw hex colors, not Tailwind classes). */
export const palette = {
  bg: "#0a0e17",
  surface: "#111827",
  surfaceAlt: "#1a2235",
  border: "#1e293b",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  accent: "#f43f5e",
  green: "#10b981",
  amber: "#f59e0b",
  blue: "#3b82f6",
  purple: "#8b5cf6",
} as const;

export const TAB_DEFINITIONS = [
  { key: "overview", label: "Overview" },
  { key: "model", label: "Model Performance" },
  { key: "comparison", label: "Model Comparison" },
  { key: "transactions", label: "Transaction Log" },
] as const;

export const AMOUNT_BINS = [
  { range: "$0-100", min: 0, max: 100 },
  { range: "$100-500", min: 100, max: 500 },
  { range: "$500-1K", min: 500, max: 1000 },
  { range: "$1K-3K", min: 1000, max: 3000 },
  { range: "$3K-5K", min: 3000, max: 5000 },
  { range: "$5K+", min: 5000, max: Infinity },
] as const;
