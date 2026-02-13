import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";
import { palette } from "../constants";
import type {
  Transaction, ModelMetrics, FeatureImportance,
  HourlyDataPoint, AmountBin, ScatterPoint,
} from "../types";
import { Card, Badge, MetricCard, CustomTooltip } from "./ui";

function FeatureImportancePanel({ features }: { features: FeatureImportance[] }) {
  const maxImportance = useMemo(
    () => Math.max(...features.map((f) => f.importance), 0.01),
    [features],
  );

  return (
    <Card>
      <div className="text-sm font-semibold mb-4">Feature Importance</div>
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
                  background: `linear-gradient(90deg, ${palette.blue}, ${palette.accent})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface OverviewTabProps {
  transactions: Transaction[];
  flaggedTxns: Transaction[];
  model: ModelMetrics;
  threshold: number;
  hourlyData: HourlyDataPoint[];
  amountDistribution: AmountBin[];
  scatterData: ScatterPoint[];
  featureImportance: FeatureImportance[];
}

export default function OverviewTab({
  transactions,
  flaggedTxns,
  model,
  threshold,
  hourlyData,
  amountDistribution,
  scatterData,
  featureImportance,
}: OverviewTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <MetricCard label="Transactions" value={transactions.length} sub="Total processed" />
        <MetricCard label="Flagged" value={flaggedTxns.length} sub={`At threshold ${threshold}`} colorClass="text-fd-accent" glow="accent" />
        <MetricCard label="Precision" value={(model.precision * 100).toFixed(1) + "%"} sub="Of flagged, actually fraud" colorClass="text-fd-green" glow="green" />
        <MetricCard label="Recall" value={(model.recall * 100).toFixed(1) + "%"} sub="Of all fraud, caught" colorClass="text-fd-blue" glow="blue" />
        <MetricCard label="F1 Score" value={model.f1.toFixed(3)} sub="Harmonic mean" colorClass="text-fd-purple" />
      </div>

      {/* Hourly Volume + Feature Importance */}
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <Card>
          <div className="text-sm font-semibold mb-4 flex justify-between items-center">
            <span>Transaction Volume by Hour</span>
            <Badge color="accent">Fraud peaks 1am–5am</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
              <XAxis dataKey="hour" tick={{ fill: palette.textDim, fontSize: 11 }} interval={2} />
              <YAxis tick={{ fill: palette.textDim, fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill={palette.blue} radius={[4, 4, 0, 0]} name="Total" opacity={0.5} />
              <Bar dataKey="fraud" fill={palette.accent} radius={[4, 4, 0, 0]} name="Fraud" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <FeatureImportancePanel features={featureImportance} />
      </div>

      {/* Amount Distribution + Scatter */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-sm font-semibold mb-4">Amount Distribution</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={amountDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
              <XAxis dataKey="range" tick={{ fill: palette.textDim, fontSize: 11 }} />
              <YAxis tick={{ fill: palette.textDim, fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="legit" fill={palette.blue} name="Legitimate" stackId="a" />
              <Bar dataKey="fraud" fill={palette.accent} name="Fraud" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="text-sm font-semibold mb-4">Risk Scatter — Amount vs Velocity</div>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
              <XAxis dataKey="amount" name="Amount" tick={{ fill: palette.textDim, fontSize: 11 }} type="number" />
              <YAxis dataKey="velocity" name="Velocity" tick={{ fill: palette.textDim, fontSize: 11 }} type="number" />
              <ZAxis dataKey="risk" range={[20, 200]} name="Risk" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={scatterData.filter((d) => !d.fraud)} fill={palette.blue} opacity={0.4} name="Legit" />
              <Scatter data={scatterData.filter((d) => d.fraud)} fill={palette.accent} opacity={0.8} name="Fraud" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
