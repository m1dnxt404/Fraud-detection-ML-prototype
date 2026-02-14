import { apiFetch } from "./client";
import type {
  TransactionsResponse,
  ModelMetrics,
  ROCPoint,
  FeatureImportance,
  ModelType,
} from "../types";

export function fetchTransactions(model: ModelType = "xgboost"): Promise<TransactionsResponse> {
  return apiFetch<TransactionsResponse>(`/transactions?model=${model}`);
}

export function evaluateModel(threshold: number, model: ModelType = "xgboost"): Promise<ModelMetrics> {
  return apiFetch<ModelMetrics>("/model/evaluate", {
    method: "POST",
    body: JSON.stringify({ threshold, model }),
  });
}

export function fetchROCCurve(model: ModelType = "xgboost"): Promise<ROCPoint[]> {
  return apiFetch<ROCPoint[]>(`/model/roc?model=${model}`);
}

export function fetchFeatureImportance(model: ModelType = "xgboost"): Promise<FeatureImportance[]> {
  return apiFetch<FeatureImportance[]>(`/model/features?model=${model}`);
}
