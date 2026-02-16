import { useState, useEffect } from "react";
import type { Transaction, TransactionShap, ModelType } from "../types";
import { fetchTransactionShap } from "../api/endpoints";
import { Card, Badge, ShapWaterfall, type BadgeColor } from "./ui";

const TABLE_HEADERS = [
  "ID", "Amount", "Merchant", "City", "Hour",
  "Velocity", "Distance", "Risk Score", "Actual",
];

function riskColorClass(score: number): string {
  if (score > 0.7) return "text-fd-accent";
  if (score > 0.4) return "text-fd-amber";
  return "text-fd-green";
}

interface RiskFactor {
  condition: boolean;
  label: string;
  color: BadgeColor;
}

function TransactionDetail({ txn }: { txn: Transaction }) {
  const fields = [
    { label: "Amount", value: `$${txn.amount.toLocaleString()}` },
    { label: "Merchant", value: txn.merchant },
    { label: "City", value: txn.city },
    { label: "Card Type", value: txn.cardType },
    { label: "Time", value: `${String(txn.hour).padStart(2, "0")}:00` },
    { label: "Velocity", value: `${txn.velocity} txn/hr` },
    { label: "Distance from Home", value: `${txn.distFromHome} mi` },
    { label: "Risk Score", value: txn.riskScore.toFixed(3) },
  ];

  const riskFactors: RiskFactor[] = [
    { condition: txn.amount > 3000, label: "High Amount", color: "accent" },
    { condition: txn.hour <= 5, label: "Late Night", color: "amber" },
    { condition: txn.velocity > 6, label: "High Velocity", color: "purple" },
    { condition: txn.distFromHome > 1000, label: "Far from Home", color: "blue" },
  ];

  return (
    <Card glow={txn.isFraud ? "accent" : "green"}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-base font-bold">Transaction Detail — {txn.id}</div>
          <div className="text-xs text-fd-text-dim">
            {new Date(txn.date).toLocaleString()}
          </div>
        </div>
        <Badge color={txn.isFraud ? "accent" : "green"}>
          {txn.isFraud ? "CONFIRMED FRAUD" : "LEGITIMATE"}
        </Badge>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {fields.map((d) => (
          <div key={d.label} className="bg-fd-surface-alt rounded-lg px-4 py-3">
            <div className="text-[11px] text-fd-text-dim uppercase tracking-wide">
              {d.label}
            </div>
            <div className="text-[15px] font-semibold mt-1 font-mono">
              {d.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 px-4 py-3 bg-fd-surface-alt rounded-lg text-sm text-fd-text-muted">
        <strong className="text-fd-text">Risk Factors: </strong>
        {riskFactors
          .filter((f) => f.condition)
          .map((f) => (
            <span key={f.label} className="mr-1.5">
              <Badge color={f.color}>{f.label}</Badge>
            </span>
          ))}
      </div>
    </Card>
  );
}

interface TransactionsTabProps {
  topRiskyTxns: Transaction[];
  activeModel: ModelType;
}

export default function TransactionsTab({
  topRiskyTxns,
  activeModel,
}: TransactionsTabProps) {
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [shapData, setShapData] = useState<TransactionShap | null>(null);
  const [shapLoading, setShapLoading] = useState(false);

  useEffect(() => {
    if (!selectedTxn) {
      setShapData(null);
      return;
    }
    setShapLoading(true);
    setShapData(null);
    fetchTransactionShap(selectedTxn.id, activeModel)
      .then(setShapData)
      .catch(() => setShapData(null))
      .finally(() => setShapLoading(false));
  }, [selectedTxn?.id, activeModel]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="text-sm font-semibold mb-1">
          Top 15 Highest Risk Transactions
        </div>
        <p className="text-fd-text-dim text-xs mb-4">Click a row for details</p>
        <div className="overflow-x-auto">
          <table className="w-full border-separate text-sm" style={{ borderSpacing: "0 4px" }}>
            <thead>
              <tr className="text-fd-text-dim text-[11px] uppercase tracking-wide">
                {TABLE_HEADERS.map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topRiskyTxns.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTxn(t)}
                  className={`
                    cursor-pointer transition-colors duration-200 rounded-lg
                    ${selectedTxn?.id === t.id ? "bg-fd-surface-alt" : "hover:bg-fd-surface-alt/50"}
                  `}
                >
                  <td className="px-3 py-2.5 font-mono text-xs">{t.id}</td>
                  <td className="px-3 py-2.5 font-semibold">${t.amount.toLocaleString()}</td>
                  <td className="px-3 py-2.5">{t.merchant}</td>
                  <td className="px-3 py-2.5 text-fd-text-muted">{t.city}</td>
                  <td className="px-3 py-2.5 font-mono">{String(t.hour).padStart(2, "0")}:00</td>
                  <td className="px-3 py-2.5">{t.velocity} txn/hr</td>
                  <td className="px-3 py-2.5">{t.distFromHome} mi</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-mono font-bold ${riskColorClass(t.riskScore)}`}>
                      {t.riskScore.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge color={t.isFraud ? "accent" : "green"}>
                      {t.isFraud ? "FRAUD" : "LEGIT"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedTxn && <TransactionDetail txn={selectedTxn} />}

      {selectedTxn && (
        <Card>
          <div className="text-sm font-semibold mb-3">SHAP Explanation</div>
          <p className="text-fd-text-dim text-xs mb-4">
            How each feature contributed to this prediction (log-odds space)
          </p>
          {shapLoading ? (
            <div className="text-fd-text-dim text-xs animate-pulse py-4">
              Computing SHAP values...
            </div>
          ) : shapData ? (
            <ShapWaterfall shap={shapData} />
          ) : (
            <div className="text-fd-text-dim text-xs py-4">
              SHAP data unavailable
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
