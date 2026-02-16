import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import { palette } from "../constants";
import type { ModelMetrics, FeatureImportance } from "../types";
import { useComparisonData, type ModelData } from "../hooks/useComparisonData";
import { Card, CustomTooltip } from "./ui";

/* ─── Confusion Matrix (reused pattern from ModelTab) ─── */

const CONFUSION_CELLS = [
  { key: "tp" as const, label: "True Positive", desc: "Fraud caught", colorClass: "text-fd-green", bgClass: "bg-fd-green/10 border-fd-green/20" },
  { key: "fp" as const, label: "False Positive", desc: "False alarm", colorClass: "text-fd-amber", bgClass: "bg-fd-amber/10 border-fd-amber/20" },
  { key: "fn" as const, label: "False Negative", desc: "Fraud missed", colorClass: "text-fd-accent", bgClass: "bg-fd-accent/10 border-fd-accent/20" },
  { key: "tn" as const, label: "True Negative", desc: "Correct pass", colorClass: "text-fd-blue", bgClass: "bg-fd-blue/10 border-fd-blue/20" },
] as const;

function ConfusionMatrix({ model, title }: { model: ModelMetrics; title: string }) {
  return (
    <Card>
      <div className="text-sm font-semibold mb-4">{title}</div>
      <div className="grid grid-cols-2 gap-3 max-w-[340px] mx-auto my-5">
        {CONFUSION_CELLS.map((c) => (
          <div key={c.label} className={`${c.bgClass} border-2 rounded-xl px-4 py-5 text-center`}>
            <div className={`text-4xl font-bold font-mono ${c.colorClass}`}>{model[c.key]}</div>
            <div className="text-xs text-fd-text-muted mt-1">{c.label}</div>
            <div className="text-[11px] text-fd-text-dim">{c.desc}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-fd-text-dim mt-2">Predicted → | Actual ↓</div>
    </Card>
  );
}

/* ─── Feature Importance Panel ─── */

function FeaturePanel({ features, title, color }: { features: FeatureImportance[]; title: string; color: string }) {
  const maxImportance = useMemo(
    () => Math.max(...features.map((f) => f.importance), 0.01),
    [features],
  );

  return (
    <Card>
      <div className="text-sm font-semibold mb-4">{title}</div>
      <div className="flex flex-col gap-3.5">
        {features.map((f) => (
          <div key={f.feature}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-fd-text-muted">{f.feature}</span>
              <span className="text-fd-text font-mono font-semibold">
                {(f.importance * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-fd-surface-alt rounded overflow-hidden">
              <div
                className="h-full rounded transition-[width] duration-1000 ease-in-out"
                style={{
                  width: `${(f.importance / maxImportance) * 100}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Metrics Comparison Table ─── */

const METRICS_ROWS: { label: string; key: keyof ModelMetrics; format: (v: number) => string }[] = [
  { label: "Precision", key: "precision", format: (v) => (v * 100).toFixed(1) + "%" },
  { label: "Recall", key: "recall", format: (v) => (v * 100).toFixed(1) + "%" },
  { label: "F1 Score", key: "f1", format: (v) => v.toFixed(4) },
  { label: "Accuracy", key: "accuracy", format: (v) => (v * 100).toFixed(1) + "%" },
];

function MetricsTable({ xg, tf, threshold }: { xg: ModelMetrics; tf: ModelMetrics; threshold: number }) {
  return (
    <Card>
      <div className="text-sm font-semibold mb-4">
        Metrics at Threshold <span className="font-mono text-fd-accent">{threshold.toFixed(2)}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-fd-text-dim text-[11px] uppercase tracking-wide">
            <th className="text-left py-2 px-3 font-semibold">Metric</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: palette.accent }}>XGBoost</th>
            <th className="text-right py-2 px-3 font-semibold" style={{ color: palette.blue }}>TensorFlow</th>
            <th className="text-right py-2 px-3 font-semibold">Diff</th>
          </tr>
        </thead>
        <tbody>
          {METRICS_ROWS.map((m) => {
            const xgVal = xg[m.key] as number;
            const tfVal = tf[m.key] as number;
            const diff = xgVal - tfVal;
            const diffColor = diff > 0.0001 ? palette.accent : diff < -0.0001 ? palette.blue : palette.textDim;

            return (
              <tr key={m.label} className="border-t border-fd-border/30">
                <td className="py-2.5 px-3 text-fd-text-muted">{m.label}</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold" style={{ color: palette.accent }}>
                  {m.format(xgVal)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold" style={{ color: palette.blue }}>
                  {m.format(tfVal)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-xs" style={{ color: diffColor }}>
                  {diff > 0 ? "+" : ""}{(diff * 100).toFixed(2)}pp
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/* ─── Threshold Slider ─── */

const METRIC_CARDS = [
  { label: "Accuracy", key: "accuracy" as const, format: (v: number) => (v * 100).toFixed(1) + "%", colorClass: "text-fd-green" },
  { label: "F1 Score", key: "f1" as const, format: (v: number) => v.toFixed(3), colorClass: "text-fd-purple" },
  { label: "Precision", key: "precision" as const, format: (v: number) => (v * 100).toFixed(1) + "%", colorClass: "text-fd-blue" },
  { label: "Recall", key: "recall" as const, format: (v: number) => (v * 100).toFixed(1) + "%", colorClass: "text-fd-accent" },
] as const;

function ComparisonSlider({
  threshold, setThreshold, xg, tf,
}: { threshold: number; setThreshold: (t: number) => void; xg: ModelMetrics; tf: ModelMetrics }) {
  return (
    <Card glow="blue">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="text-sm font-semibold mb-2">Decision Threshold</div>
          <div className="flex items-center gap-4">
            <input
              type="range" min="0.1" max="0.9" step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
              className="flex-1 h-1.5 accent-fd-accent"
            />
            <span className="font-mono text-2xl font-bold text-fd-accent min-w-[60px]">
              {threshold.toFixed(2)}
            </span>
          </div>
          <p className="text-fd-text-dim text-xs mt-1.5">
            Adjusting the threshold updates metrics for both models simultaneously.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 min-w-[480px]">
          {METRIC_CARDS.map((m) => (
            <div key={m.label} className="bg-fd-surface-alt rounded-lg px-3 py-2.5">
              <div className="text-[10px] text-fd-text-dim uppercase tracking-wide mb-1">{m.label}</div>
              <div className="flex gap-2 items-baseline">
                <span className="text-sm font-bold font-mono" style={{ color: palette.accent }}>
                  {m.format(xg[m.key])}
                </span>
                <span className="text-[10px] text-fd-text-dim">vs</span>
                <span className="text-sm font-bold font-mono" style={{ color: palette.blue }}>
                  {m.format(tf[m.key])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ─── ROC Curve Comparison ─── */

function ROCComparison({ xg, tf }: { xg: ModelData; tf: ModelData }) {
  return (
    <Card>
      <div className="text-sm font-semibold mb-4">ROC Curve — XGBoost vs TensorFlow</div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={xg.roc}>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
          <XAxis
            dataKey="fpr"
            tick={{ fill: palette.textDim, fontSize: 11 }}
            label={{ value: "False Positive Rate", position: "bottom", fill: palette.textDim, fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: palette.textDim, fontSize: 11 }}
            label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fill: palette.textDim, fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="tpr" stroke={palette.accent} strokeWidth={2.5} dot={false} name="XGBoost" />
          <Line type="monotone" data={tf.roc} dataKey="tpr" stroke={palette.blue} strokeWidth={2.5} dot={false} name="TensorFlow" />
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
  );
}

/* ─── Precision-Recall Comparison ─── */

function PRComparison({ xg, tf }: { xg: ModelData; tf: ModelData }) {
  const xgPR = useMemo(() => xg.roc.map((p) => ({
    threshold: p.threshold, precision: p.precision, recall: p.recall,
  })), [xg.roc]);

  const tfPR = useMemo(() => tf.roc.map((p) => ({
    threshold: p.threshold, precision: p.precision, recall: p.recall,
  })), [tf.roc]);

  return (
    <Card>
      <div className="text-sm font-semibold mb-4">Precision-Recall — XGBoost vs TensorFlow</div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={xgPR}>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
          <XAxis
            dataKey="threshold"
            tick={{ fill: palette.textDim, fontSize: 11 }}
            label={{ value: "Threshold", position: "bottom", fill: palette.textDim, fontSize: 11 }}
          />
          <YAxis tick={{ fill: palette.textDim, fontSize: 11 }} domain={[0, 1]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="precision" stroke={palette.accent} strokeWidth={2} dot={false} name="XGB Precision" />
          <Line type="monotone" dataKey="recall" stroke={palette.accent} strokeWidth={2} strokeDasharray="6 3" dot={false} name="XGB Recall" />
          <Line type="monotone" data={tfPR} dataKey="precision" stroke={palette.blue} strokeWidth={2} dot={false} name="TF Precision" />
          <Line type="monotone" data={tfPR} dataKey="recall" stroke={palette.blue} strokeWidth={2} strokeDasharray="6 3" dot={false} name="TF Recall" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ─── Main ComparisonTab ─── */

export default function ComparisonTab() {
  const data = useComparisonData();

  if (data.loading) {
    return (
      <div className="text-fd-text-muted text-sm animate-pulse py-8">
        Loading comparison data for both models...
      </div>
    );
  }

  if (data.error) {
    return <div className="text-fd-accent text-sm py-8">Error: {data.error}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <ComparisonSlider
        threshold={data.threshold}
        setThreshold={data.setThreshold}
        xg={data.xgboost.metrics}
        tf={data.tensorflow.metrics}
      />

      <ROCComparison xg={data.xgboost} tf={data.tensorflow} />

      <PRComparison xg={data.xgboost} tf={data.tensorflow} />

      <MetricsTable xg={data.xgboost.metrics} tf={data.tensorflow.metrics} threshold={data.threshold} />

      <div className="grid grid-cols-2 gap-4">
        <ConfusionMatrix model={data.xgboost.metrics} title="XGBoost — Confusion Matrix" />
        <ConfusionMatrix model={data.tensorflow.metrics} title="TensorFlow — Confusion Matrix" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FeaturePanel features={data.xgboost.features} title="XGBoost — Feature Importance" color={palette.accent} />
        <FeaturePanel features={data.tensorflow.features} title="TensorFlow — Feature Importance" color={palette.blue} />
      </div>
    </div>
  );
}
