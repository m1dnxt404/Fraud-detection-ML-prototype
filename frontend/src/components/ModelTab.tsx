import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import { palette } from "../constants";
import type { Transaction, ModelMetrics, ROCPoint } from "../types";
import { Card, CustomTooltip } from "./ui";

const CONFUSION_CELLS = [
  { key: "tp" as const, label: "True Positive", desc: "Fraud caught", colorClass: "text-fd-green", bgClass: "bg-fd-green/10 border-fd-green/20" },
  { key: "fp" as const, label: "False Positive", desc: "False alarm", colorClass: "text-fd-amber", bgClass: "bg-fd-amber/10 border-fd-amber/20" },
  { key: "fn" as const, label: "False Negative", desc: "Fraud missed", colorClass: "text-fd-accent", bgClass: "bg-fd-accent/10 border-fd-accent/20" },
  { key: "tn" as const, label: "True Negative", desc: "Correct pass", colorClass: "text-fd-blue", bgClass: "bg-fd-blue/10 border-fd-blue/20" },
] as const;

const METRIC_SUMMARY = [
  { label: "Accuracy", key: "accuracy" as const, format: (v: number) => (v * 100).toFixed(1) + "%", colorClass: "text-fd-green" },
  { label: "F1 Score", key: "f1" as const, format: (v: number) => v.toFixed(3), colorClass: "text-fd-purple" },
  { label: "Precision", key: "precision" as const, format: (v: number) => (v * 100).toFixed(1) + "%", colorClass: "text-fd-blue" },
  { label: "Recall", key: "recall" as const, format: (v: number) => (v * 100).toFixed(1) + "%", colorClass: "text-fd-accent" },
] as const;

interface ThresholdSliderProps {
  threshold: number;
  setThreshold: (t: number) => void;
  model: ModelMetrics;
}

function ThresholdSlider({ threshold, setThreshold, model }: ThresholdSliderProps) {
  return (
    <Card glow="blue">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="text-sm font-semibold mb-2">Decision Threshold</div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
              className="flex-1 h-1.5 accent-fd-accent"
            />
            <span className="font-mono text-2xl font-bold text-fd-accent min-w-[60px]">
              {threshold.toFixed(2)}
            </span>
          </div>
          <p className="text-fd-text-dim text-xs mt-1.5">
            Lower threshold → more flagged (higher recall, lower precision). Higher → fewer flagged (lower recall, higher precision).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-[260px]">
          {METRIC_SUMMARY.map((m) => (
            <div key={m.label} className="bg-fd-surface-alt rounded-lg px-4 py-3">
              <div className="text-[11px] text-fd-text-dim uppercase tracking-wide">{m.label}</div>
              <div className={`text-xl font-bold font-mono ${m.colorClass}`}>
                {m.format(model[m.key])}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ConfusionMatrix({ model }: { model: ModelMetrics }) {
  return (
    <Card>
      <div className="text-sm font-semibold mb-4">Confusion Matrix</div>
      <div className="grid grid-cols-2 gap-3 max-w-[340px] mx-auto my-5">
        {CONFUSION_CELLS.map((c) => (
          <div
            key={c.label}
            className={`${c.bgClass} border-2 rounded-xl px-4 py-5 text-center`}
          >
            <div className={`text-4xl font-bold font-mono ${c.colorClass}`}>
              {model[c.key]}
            </div>
            <div className="text-xs text-fd-text-muted mt-1">{c.label}</div>
            <div className="text-[11px] text-fd-text-dim">{c.desc}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-fd-text-dim mt-2">
        Predicted → | Actual ↓
      </div>
    </Card>
  );
}

interface ModelTabProps {
  transactions: Transaction[];
  model: ModelMetrics;
  threshold: number;
  setThreshold: (t: number) => void;
  rocCurve: ROCPoint[];
}

export default function ModelTab({
  model,
  threshold,
  setThreshold,
  rocCurve,
}: ModelTabProps) {
  const precisionRecallData = useMemo(
    () =>
      rocCurve.map((p) => ({
        threshold: p.threshold,
        precision: p.precision,
        recall: p.recall,
        f1: p.f1,
      })),
    [rocCurve],
  );

  return (
    <div className="flex flex-col gap-6">
      <ThresholdSlider threshold={threshold} setThreshold={setThreshold} model={model} />

      <div className="grid grid-cols-2 gap-4">
        {/* ROC Curve */}
        <Card>
          <div className="text-sm font-semibold mb-4">ROC Curve</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rocCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
              <XAxis
                dataKey="fpr"
                tick={{ fill: palette.textDim, fontSize: 11 }}
                label={{ value: "False Positive Rate", position: "bottom", fill: palette.textDim, fontSize: 11 }}
              />
              <YAxis
                dataKey="tpr"
                tick={{ fill: palette.textDim, fontSize: 11 }}
                label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fill: palette.textDim, fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="tpr" stroke={palette.accent} strokeWidth={2.5} dot={false} name="Model" />
              <Line
                type="monotone"
                data={[{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }]}
                dataKey="tpr"
                stroke={palette.textDim}
                strokeDasharray="6 4"
                strokeWidth={1}
                dot={false}
                name="Random"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <ConfusionMatrix model={model} />
      </div>

      {/* Precision-Recall Tradeoff */}
      <Card>
        <div className="text-sm font-semibold mb-4">Precision-Recall Tradeoff Across Thresholds</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={precisionRecallData}>
            <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
            <XAxis
              dataKey="threshold"
              tick={{ fill: palette.textDim, fontSize: 11 }}
              label={{ value: "Threshold", position: "bottom", fill: palette.textDim, fontSize: 11 }}
            />
            <YAxis tick={{ fill: palette.textDim, fontSize: 11 }} domain={[0, 1]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="precision" stroke={palette.blue} strokeWidth={2} dot={false} name="Precision" />
            <Line type="monotone" dataKey="recall" stroke={palette.accent} strokeWidth={2} dot={false} name="Recall" />
            <Line type="monotone" dataKey="f1" stroke={palette.purple} strokeWidth={2} dot={false} name="F1" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
