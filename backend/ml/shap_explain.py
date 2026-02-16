from functools import lru_cache

import numpy as np
import shap

from .model import load_model, extract_features, FEATURE_COLUMNS, FEATURE_DISPLAY_NAMES
from .tf_model import load_tf_model, load_scaler


@lru_cache(maxsize=2)
def _compute_shap_values(model_name: str) -> tuple[np.ndarray, float]:
    """Compute SHAP values for all 500 cached transactions (once per model)."""
    from ..data.generator import generate_transactions

    df = generate_transactions(count=500, seed=42)
    X = extract_features(df)

    if model_name == "xgboost":
        model = load_model()
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)
        # Binary classification may return list of two arrays — take class 1
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        expected_value = explainer.expected_value
        if isinstance(expected_value, (list, np.ndarray)):
            expected_value = expected_value[1]
        return np.array(shap_values), float(expected_value)
    else:
        tf_model = load_tf_model()
        scaler = load_scaler()
        X_scaled = scaler.transform(X)
        background = shap.kmeans(X_scaled, 50)
        explainer = shap.KernelExplainer(
            lambda x: tf_model.predict(x, verbose=0).ravel(),
            background,
        )
        shap_values = explainer.shap_values(X_scaled, nsamples=100)
        return np.array(shap_values), float(explainer.expected_value)


def get_shap_global_importance(model_name: str) -> list[dict]:
    """Mean |SHAP value| per feature, normalized, sorted descending."""
    shap_values, _ = _compute_shap_values(model_name)
    mean_abs = np.mean(np.abs(shap_values), axis=0)
    total = mean_abs.sum() or 1.0
    normalized = mean_abs / total

    result = [
        {
            "feature": FEATURE_DISPLAY_NAMES.get(name, name),
            "importance": round(float(imp), 4),
        }
        for name, imp in zip(FEATURE_COLUMNS, normalized)
    ]
    result.sort(key=lambda x: x["importance"], reverse=True)
    return result


def get_transaction_shap(model_name: str, txn_index: int) -> dict:
    """Return per-feature SHAP breakdown for a single transaction."""
    from ..data.generator import generate_transactions

    df = generate_transactions(count=500, seed=42)
    X = extract_features(df)

    shap_values, expected_value = _compute_shap_values(model_name)
    sv = shap_values[txn_index]

    features = [
        {
            "feature": FEATURE_DISPLAY_NAMES.get(name, name),
            "raw_value": round(float(X.iloc[txn_index][name]), 4),
            "shap_value": round(float(sv[i]), 6),
        }
        for i, name in enumerate(FEATURE_COLUMNS)
    ]
    features.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

    return {
        "base_value": round(expected_value, 6),
        "output_value": round(expected_value + float(sv.sum()), 6),
        "features": features,
    }
