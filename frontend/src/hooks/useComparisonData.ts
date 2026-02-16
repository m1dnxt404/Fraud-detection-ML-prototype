import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchROCCurve,
  evaluateModel,
  fetchFeatureImportance,
} from "../api/endpoints";
import type { ROCPoint, ModelMetrics, FeatureImportance } from "../types";

const EMPTY_METRICS: ModelMetrics = {
  tp: 0, fp: 0, fn: 0, tn: 0,
  precision: 0, recall: 0, f1: 0, accuracy: 0,
};

export interface ModelData {
  roc: ROCPoint[];
  metrics: ModelMetrics;
  features: FeatureImportance[];
}

export interface ComparisonData {
  xgboost: ModelData;
  tensorflow: ModelData;
  threshold: number;
  setThreshold: (t: number) => void;
  loading: boolean;
  error: string | null;
}

export function useComparisonData(): ComparisonData {
  const [xgboostROC, setXgboostROC] = useState<ROCPoint[]>([]);
  const [tensorflowROC, setTensorflowROC] = useState<ROCPoint[]>([]);
  const [xgboostMetrics, setXgboostMetrics] = useState<ModelMetrics>(EMPTY_METRICS);
  const [tensorflowMetrics, setTensorflowMetrics] = useState<ModelMetrics>(EMPTY_METRICS);
  const [xgboostFeatures, setXgboostFeatures] = useState<FeatureImportance[]>([]);
  const [tensorflowFeatures, setTensorflowFeatures] = useState<FeatureImportance[]>([]);
  const [threshold, setThresholdRaw] = useState(0.55);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Initial load — fetch everything for both models
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchROCCurve("xgboost"),
      fetchROCCurve("tensorflow"),
      fetchFeatureImportance("xgboost"),
      fetchFeatureImportance("tensorflow"),
      evaluateModel(0.55, "xgboost"),
      evaluateModel(0.55, "tensorflow"),
    ])
      .then(([xgRoc, tfRoc, xgFeat, tfFeat, xgMetrics, tfMetrics]) => {
        setXgboostROC(xgRoc);
        setTensorflowROC(tfRoc);
        setXgboostFeatures(xgFeat);
        setTensorflowFeatures(tfFeat);
        setXgboostMetrics(xgMetrics);
        setTensorflowMetrics(tfMetrics);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Debounced threshold — only re-evaluate metrics
  const setThreshold = useCallback((t: number) => {
    setThresholdRaw(t);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      Promise.all([
        evaluateModel(t, "xgboost"),
        evaluateModel(t, "tensorflow"),
      ])
        .then(([xgM, tfM]) => {
          setXgboostMetrics(xgM);
          setTensorflowMetrics(tfM);
        })
        .catch((e) => setError(e.message));
    }, 150);
  }, []);

  return {
    xgboost: { roc: xgboostROC, metrics: xgboostMetrics, features: xgboostFeatures },
    tensorflow: { roc: tensorflowROC, metrics: tensorflowMetrics, features: tensorflowFeatures },
    threshold,
    setThreshold,
    loading,
    error,
  };
}
