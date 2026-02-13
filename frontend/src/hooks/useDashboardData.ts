import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { groupBy } from "lodash-es";
import {
  fetchTransactions,
  evaluateModel,
  fetchROCCurve,
  fetchFeatureImportance,
} from "../api/endpoints";
import { AMOUNT_BINS } from "../constants";
import type {
  Transaction,
  ModelMetrics,
  ROCPoint,
  FeatureImportance,
  HourlyDataPoint,
  AmountBin,
  ScatterPoint,
} from "../types";

const EMPTY_METRICS: ModelMetrics = {
  tp: 0, fp: 0, fn: 0, tn: 0,
  precision: 0, recall: 0, f1: 0, accuracy: 0,
};

export interface DashboardData {
  transactions: Transaction[];
  totalFraud: number;
  threshold: number;
  setThreshold: (t: number) => void;
  model: ModelMetrics;
  rocCurve: ROCPoint[];
  featureImportance: FeatureImportance[];
  flaggedTxns: Transaction[];
  hourlyData: HourlyDataPoint[];
  amountDistribution: AmountBin[];
  scatterData: ScatterPoint[];
  topRiskyTxns: Transaction[];
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalFraud, setTotalFraud] = useState(0);
  const [threshold, setThresholdRaw] = useState(0.55);
  const [model, setModel] = useState<ModelMetrics>(EMPTY_METRICS);
  const [rocCurve, setRocCurve] = useState<ROCPoint[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer for threshold slider
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Initial data load: transactions, ROC, features, initial evaluation (parallel)
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTransactions(),
      fetchROCCurve(),
      fetchFeatureImportance(),
      evaluateModel(0.55),
    ])
      .then(([txRes, roc, features, initialModel]) => {
        setTransactions(txRes.transactions);
        setTotalFraud(txRes.totalFraud);
        setRocCurve(roc);
        setFeatureImportance(features);
        setModel(initialModel);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Debounced threshold update
  const setThreshold = useCallback((t: number) => {
    setThresholdRaw(t);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      evaluateModel(t).then(setModel).catch((e) => setError(e.message));
    }, 150);
  }, []);

  // Derived data — computed client-side from the transaction array
  const flaggedTxns = useMemo(
    () => transactions.filter((t) => t.riskScore > threshold),
    [transactions, threshold],
  );

  const hourlyData = useMemo<HourlyDataPoint[]>(() => {
    const groups = groupBy(transactions, "hour");
    return Array.from({ length: 24 }, (_, h) => {
      const txns = groups[h] || [];
      return {
        hour: `${String(h).padStart(2, "0")}:00`,
        total: txns.length,
        fraud: txns.filter((t: Transaction) => t.isFraud).length,
      };
    });
  }, [transactions]);

  const amountDistribution = useMemo<AmountBin[]>(
    () =>
      AMOUNT_BINS.map((b) => {
        const inBin = transactions.filter(
          (t) => t.amount >= b.min && t.amount < b.max,
        );
        return {
          range: b.range,
          legit: inBin.filter((t) => !t.isFraud).length,
          fraud: inBin.filter((t) => t.isFraud).length,
        };
      }),
    [transactions],
  );

  const scatterData = useMemo<ScatterPoint[]>(
    () =>
      transactions.map((t) => ({
        amount: t.amount,
        velocity: t.velocity,
        risk: t.riskScore,
        fraud: t.isFraud ? 1 : 0,
      })),
    [transactions],
  );

  const topRiskyTxns = useMemo(
    () =>
      [...transactions].sort((a, b) => b.riskScore - a.riskScore).slice(0, 15),
    [transactions],
  );

  return {
    transactions,
    totalFraud,
    threshold,
    setThreshold,
    model,
    rocCurve,
    featureImportance,
    flaggedTxns,
    hourlyData,
    amountDistribution,
    scatterData,
    topRiskyTxns,
    loading,
    error,
  };
}
