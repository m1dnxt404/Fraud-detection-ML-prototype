import os
from functools import lru_cache

import numpy as np
import pandas as pd
import joblib
from sklearn.inspection import permutation_importance

from .model import extract_features, FEATURE_COLUMNS, FEATURE_DISPLAY_NAMES

os.environ["KERAS_BACKEND"] = "tensorflow"
import keras

_ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
_MODEL_PATH = os.path.join(_ARTIFACTS_DIR, "tf_model.keras")
_SCALER_PATH = os.path.join(_ARTIFACTS_DIR, "scaler.joblib")


def build_model(input_dim: int = 6) -> keras.Model:
    """Build a Keras Sequential model for binary fraud classification."""
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),
        keras.layers.Dense(64, activation="relu"),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(32, activation="relu"),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    return model


@lru_cache(maxsize=1)
def load_tf_model() -> keras.Model:
    """Load the trained Keras model from disk (cached)."""
    return keras.models.load_model(_MODEL_PATH)


@lru_cache(maxsize=1)
def load_scaler():
    """Load the fitted StandardScaler from disk (cached)."""
    return joblib.load(_SCALER_PATH)


def predict_tf_scores(df: pd.DataFrame) -> list[float]:
    """Return fraud probability for each transaction using the TF model."""
    model = load_tf_model()
    scaler = load_scaler()
    X = extract_features(df)
    X_scaled = scaler.transform(X)
    probs = model.predict(X_scaled, verbose=0).ravel()
    return [round(float(p), 3) for p in probs]


def get_tf_feature_importance(
    df: pd.DataFrame, y_true: np.ndarray
) -> list[dict]:
    """Compute permutation importance for the TF model."""
    model = load_tf_model()
    scaler = load_scaler()
    X = extract_features(df)
    X_scaled = scaler.transform(X)

    result = permutation_importance(
        model, X_scaled, y_true,
        n_repeats=10, random_state=42, scoring="roc_auc",
    )

    items = [
        {
            "feature": FEATURE_DISPLAY_NAMES.get(name, name),
            "importance": round(float(imp), 4),
        }
        for name, imp in zip(FEATURE_COLUMNS, result.importances_mean)
    ]
    items.sort(key=lambda x: x["importance"], reverse=True)
    return items
