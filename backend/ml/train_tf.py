"""
TensorFlow/Keras training script for fraud detection.

Run from the project root:
    python -m backend.ml.train_tf
"""

import os
import sys

import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, classification_report

# Allow running as `python -m backend.ml.train_tf` from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

os.environ["KERAS_BACKEND"] = "tensorflow"

from backend.data.generator import generate_transactions
from backend.ml.model import extract_features
from backend.ml.tf_model import build_model

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "tf_model.keras")
SCALER_PATH = os.path.join(ARTIFACTS_DIR, "scaler.joblib")


def main():
    print("Generating 5000 synthetic transactions (seed=42)...")
    df = generate_transactions(count=5000, seed=42)

    fraud_count = df["is_fraud"].sum()
    print(f"  Total: {len(df)} | Fraud: {fraud_count} ({fraud_count / len(df) * 100:.1f}%)")

    print("Extracting features...")
    X = extract_features(df)
    y = df["is_fraud"].astype(int).values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # Neural nets need scaled features
    print("Fitting StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Class weights for imbalanced data
    pos_count = int(y_train.sum())
    neg_count = len(y_train) - pos_count
    class_weight = {0: 1.0, 1: neg_count / pos_count if pos_count > 0 else 1.0}
    print(f"Class weight for fraud: {class_weight[1]:.2f}")

    print("Building and training Keras model...")
    model = build_model(input_dim=X_train_scaled.shape[1])
    model.summary()

    import keras
    early_stop = keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=10, restore_best_weights=True
    )

    model.fit(
        X_train_scaled, y_train,
        validation_split=0.2,
        epochs=50,
        batch_size=32,
        class_weight=class_weight,
        callbacks=[early_stop],
        verbose=1,
    )

    # Evaluate
    y_prob = model.predict(X_test_scaled, verbose=0).ravel()
    y_pred = (y_prob > 0.5).astype(int)

    auc = roc_auc_score(y_test, y_prob)
    print(f"\nAUC-ROC: {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legit", "Fraud"]))

    # Save artifacts
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    model.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    joblib.dump(scaler, SCALER_PATH)
    print(f"Scaler saved to {SCALER_PATH}")


if __name__ == "__main__":
    main()
