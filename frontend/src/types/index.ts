export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  city: string;
  cardType: string;
  hour: number;
  velocity: number;
  distFromHome: number;
  isFraud: boolean;
  riskScore: number;
  date: string;
  flagged: boolean;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  totalFraud: number;
}

export interface ModelMetrics {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
}

export interface ROCPoint {
  fpr: number;
  tpr: number;
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface HourlyDataPoint {
  hour: string;
  total: number;
  fraud: number;
}

export interface AmountBin {
  range: string;
  legit: number;
  fraud: number;
}

export interface ScatterPoint {
  amount: number;
  velocity: number;
  risk: number;
  fraud: number;
}
