import type { Transaction, ModelType } from "../types";

const CSV_HEADERS = [
  "ID", "Date", "Amount", "Merchant", "City", "Card Type",
  "Hour", "Velocity", "Distance From Home", "Risk Score", "Is Fraud", "Flagged",
];

function escapeField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function txnToRow(t: Transaction): string {
  return [
    t.id,
    t.date,
    t.amount.toString(),
    escapeField(t.merchant),
    escapeField(t.city),
    escapeField(t.cardType),
    t.hour.toString(),
    t.velocity.toString(),
    t.distFromHome.toString(),
    t.riskScore.toFixed(4),
    t.isFraud ? "Yes" : "No",
    t.flagged ? "Yes" : "No",
  ].join(",");
}

function downloadBlob(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function datestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportTransactionsCsv(
  transactions: Transaction[],
  model: ModelType,
  label: "flagged" | "all",
) {
  const csv = [CSV_HEADERS.join(","), ...transactions.map(txnToRow)].join("\n");
  downloadBlob(csv, `fraud-${label}-${model}-${datestamp()}.csv`);
}
