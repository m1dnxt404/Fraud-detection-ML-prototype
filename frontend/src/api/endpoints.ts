import { apiFetch } from "./client";
import type {
  TransactionsResponse,
  ModelMetrics,
  ROCPoint,
  FeatureImportance,
} from "../types";

export function fetchTransactions(): Promise<TransactionsResponse> {
  return apiFetch<TransactionsResponse>("/transactions");
}

export function evaluateModel(threshold: number): Promise<ModelMetrics> {
  return apiFetch<ModelMetrics>("/model/evaluate", {
    method: "POST",
    body: JSON.stringify({ threshold }),
  });
}

export function fetchROCCurve(): Promise<ROCPoint[]> {
  return apiFetch<ROCPoint[]>("/model/roc");
}

export function fetchFeatureImportance(): Promise<FeatureImportance[]> {
  return apiFetch<FeatureImportance[]>("/model/features");
}
