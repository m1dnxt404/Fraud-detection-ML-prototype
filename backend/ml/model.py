import os
from functools import lru_cache

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import OrdinalEncoder

from ..data.constants import MERCHANTS, CITIES

FEATURE_COLUMNS = [
    "amount", "hour", "velocity", "dist_from_home",
    "merchant_encoded", "city_encoded",
]

FEATURE_DISPLAY_NAMES = {
    "amount": "Transaction Amount",
    "hour": "Time of Day",
    "velocity": "Velocity (txns/hr)",
    "dist_from_home": "Distance from Home",
    "merchant_encoded": "Merchant Category",
    "city_encoded": "City",
}

# Deterministic ordinal encoders fitted on the full category lists
_merchant_encoder = OrdinalEncoder(
    categories=[MERCHANTS], handle_unknown="use_encoded_value", unknown_value=-1
)
_merchant_encoder.fit(np.array(MERCHANTS).reshape(-1, 1))

_city_encoder = OrdinalEncoder(
    categories=[CITIES], handle_unknown="use_encoded_value", unknown_value=-1
)
_city_encoder.fit(np.array(CITIES).reshape(-1, 1))


def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extract numeric feature matrix from a transaction DataFrame."""
    features = df[["amount", "hour", "velocity", "dist_from_home"]].copy()
    features["merchant_encoded"] = _merchant_encoder.transform(
        df[["merchant"]].values
    ).ravel()
    features["city_encoded"] = _city_encoder.transform(
        df[["city"]].values
    ).ravel()
    return features[FEATURE_COLUMNS]


_MODEL_PATH = os.path.join(os.path.dirname(__file__), "artifacts", "xgb_model.json")


@lru_cache(maxsize=1)
def load_model() -> xgb.XGBClassifier:
    """Load the trained XGBoost model from disk (cached)."""
    model = xgb.XGBClassifier()
    model.load_model(_MODEL_PATH)
    return model


def predict_risk_scores(df: pd.DataFrame) -> list[float]:
    """Return fraud probability for each transaction."""
    model = load_model()
    X = extract_features(df)
    probs = model.predict_proba(X)[:, 1]
    return [round(float(p), 3) for p in probs]


def evaluate_at_threshold(
    y_true: list[bool], scores: list[float], threshold: float
) -> dict:
    """Compute confusion matrix and metrics at a given threshold."""
    tp = fp = fn = tn = 0
    for truth, score in zip(y_true, scores):
        predicted_fraud = score > threshold
        if truth and predicted_fraud:
            tp += 1
        elif not truth and predicted_fraud:
            fp += 1
        elif truth and not predicted_fraud:
            fn += 1
        else:
            tn += 1

    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) else 0.0
    accuracy = (tp + tn) / len(y_true) if y_true else 0.0

    return {
        "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "accuracy": round(accuracy, 4),
    }


def compute_roc_curve(
    y_true: list[bool], scores: list[float]
) -> list[dict]:
    """Compute ROC + precision-recall data at 0.05 threshold increments."""
    points = []
    for i in range(21):
        t = round(i * 0.05, 2)
        m = evaluate_at_threshold(y_true, scores, t)
        fpr = m["fp"] / (m["fp"] + m["tn"]) if (m["fp"] + m["tn"]) else 0.0
        tpr = m["tp"] / (m["tp"] + m["fn"]) if (m["tp"] + m["fn"]) else 0.0
        points.append({
            "fpr": round(fpr, 3),
            "tpr": round(tpr, 3),
            "threshold": t,
            "precision": m["precision"],
            "recall": m["recall"],
            "f1": m["f1"],
        })
    return points


def get_feature_importance() -> list[dict]:
    """Return feature importance from XGBoost with human-readable names."""
    model = load_model()
    importances = model.feature_importances_
    result = [
        {
            "feature": FEATURE_DISPLAY_NAMES.get(name, name),
            "importance": round(float(imp), 4),
        }
        for name, imp in zip(FEATURE_COLUMNS, importances)
    ]
    result.sort(key=lambda x: x["importance"], reverse=True)
    return result
