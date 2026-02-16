import type { Transaction, ModelMetrics, FeatureImportance, ModelType } from "../types";

interface PdfExportData {
  activeModel: ModelType;
  threshold: number;
  model: ModelMetrics;
  featureImportance: FeatureImportance[];
  flaggedTxns: Transaction[];
  transactions: Transaction[];
  totalFraud: number;
}

function datestamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function exportDashboardPdf(data: PdfExportData) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Fraud Detection Report", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Model: ${data.activeModel === "xgboost" ? "XGBoost" : "TensorFlow"}  |  ` +
    `Threshold: ${data.threshold.toFixed(2)}  |  ` +
    `Generated: ${new Date().toLocaleString()}`,
    14, y,
  );
  y += 10;

  // Summary metrics
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Metrics", 14, y);
  y += 2;

  const { model: m, transactions: txns, totalFraud, flaggedTxns } = data;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Transactions", txns.length.toString()],
      ["Confirmed Fraud", totalFraud.toString()],
      ["Flagged (above threshold)", flaggedTxns.length.toString()],
      ["True Positives", m.tp.toString()],
      ["False Positives", m.fp.toString()],
      ["False Negatives", m.fn.toString()],
      ["True Negatives", m.tn.toString()],
      ["Precision", m.precision.toFixed(4)],
      ["Recall", m.recall.toFixed(4)],
      ["F1 Score", m.f1.toFixed(4)],
    ],
    theme: "grid",
    headStyles: { fillColor: [244, 63, 94] },
    styles: { fontSize: 9 },
    margin: { left: 14 },
    tableWidth: pageWidth / 3,
  });

  // Feature importance (beside summary)
  const summaryEndY = (doc as ReturnType<typeof jsPDF.prototype.constructor> & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 60;

  if (data.featureImportance.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Feature", "Importance"]],
      body: data.featureImportance.map((f) => [f.feature, f.importance.toFixed(4)]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      margin: { left: pageWidth / 3 + 24 },
      tableWidth: pageWidth / 4,
    });
  }

  y = summaryEndY + 10;

  // Flagged transactions table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Flagged Transactions (${flaggedTxns.length})`, 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["ID", "Amount", "Merchant", "City", "Hour", "Velocity", "Distance", "Risk Score", "Fraud"]],
    body: flaggedTxns
      .sort((a, b) => b.riskScore - a.riskScore)
      .map((t) => [
        t.id,
        `$${t.amount.toLocaleString()}`,
        t.merchant,
        t.city,
        `${String(t.hour).padStart(2, "0")}:00`,
        `${t.velocity}`,
        `${t.distFromHome} mi`,
        t.riskScore.toFixed(4),
        t.isFraud ? "Yes" : "No",
      ]),
    theme: "grid",
    headStyles: { fillColor: [244, 63, 94] },
    styles: { fontSize: 8 },
    margin: { left: 14 },
  });

  doc.save(`fraud-report-${data.activeModel}-${datestamp()}.pdf`);
}
