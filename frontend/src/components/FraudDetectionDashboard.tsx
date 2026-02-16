import { useState, useCallback, lazy, Suspense } from "react";
import { TAB_DEFINITIONS } from "../constants";
import { useDashboardData } from "../hooks/useDashboardData";
import { Tabs, ModelSelector, ExportMenu } from "./ui";
import { exportTransactionsCsv } from "../utils/exportCsv";
import { exportDashboardPdf } from "../utils/exportPdf";
import TransactionsTab from "./TransactionsTab";

const OverviewTab = lazy(() => import("./OverviewTab"));
const ModelTab = lazy(() => import("./ModelTab"));

export default function FraudDetectionDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const data = useDashboardData();

  const handleExportFlagged = useCallback(
    () => exportTransactionsCsv(data.flaggedTxns, data.activeModel, "flagged"),
    [data.flaggedTxns, data.activeModel],
  );
  const handleExportAll = useCallback(
    () => exportTransactionsCsv(data.transactions, data.activeModel, "all"),
    [data.transactions, data.activeModel],
  );
  const handleExportPdf = useCallback(
    () => exportDashboardPdf(data),
    [data],
  );

  if (data.loading) {
    return (
      <div className="min-h-screen bg-fd-bg flex items-center justify-center">
        <div className="text-fd-text-muted text-lg animate-pulse">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-fd-bg flex items-center justify-center">
        <div className="text-fd-accent text-lg">Error: {data.error}</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-fd-bg text-fd-text font-sans"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, rgba(244,63,94,0.06) 0%, transparent 60%), " +
          "radial-gradient(ellipse at 80% 100%, rgba(59,130,246,0.05) 0%, transparent 60%)",
      }}
    >
      {/* Header */}
      <div className="px-10 pt-8 flex justify-between items-start flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-fd-accent shadow-[0_0_12px_#f43f5e]" />
            <h1 className="text-3xl font-bold m-0 tracking-tight">
              Fraud Detection{" "}
              <span className="text-fd-text-dim font-normal">ML Prototype</span>
            </h1>
          </div>
          <p className="text-fd-text-dim text-sm m-0">
            Real-time anomaly scoring on {data.transactions.length} synthetic
            transactions — {data.totalFraud} confirmed fraud cases (
            {((data.totalFraud / data.transactions.length) * 100).toFixed(1)}%
            base rate)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ModelSelector
            active={data.activeModel}
            onChange={data.setActiveModel}
            disabled={data.loading}
          />
          <ExportMenu
            onExportFlagged={handleExportFlagged}
            onExportAll={handleExportAll}
            onExportPdf={handleExportPdf}
            disabled={data.loading}
          />
          <Tabs tabs={TAB_DEFINITIONS} active={activeTab} onChange={setActiveTab} />
        </div>
      </div>

      <div className="px-10 py-6 pb-10">
        <Suspense
          fallback={
            <div className="text-fd-text-muted text-sm animate-pulse py-8">
              Loading tab...
            </div>
          }
        >
          {activeTab === "overview" && (
            <OverviewTab
              transactions={data.transactions}
              flaggedTxns={data.flaggedTxns}
              model={data.model}
              threshold={data.threshold}
              hourlyData={data.hourlyData}
              amountDistribution={data.amountDistribution}
              scatterData={data.scatterData}
              featureImportance={data.featureImportance}
            />
          )}
          {activeTab === "model" && (
            <ModelTab
              transactions={data.transactions}
              model={data.model}
              threshold={data.threshold}
              setThreshold={data.setThreshold}
              rocCurve={data.rocCurve}
            />
          )}
          {activeTab === "transactions" && (
            <TransactionsTab topRiskyTxns={data.topRiskyTxns} activeModel={data.activeModel} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
