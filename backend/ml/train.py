"""
XGBoost training script for fraud detection.

Run from the project root:
    python -m backend.ml.train
"""

import os
import sys

import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report

# Allow running as `python -m backend.ml.train` from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.data.generator import generate_transactions
from backend.ml.model import extract_features


ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "xgb_model.json")


def main():
    print("Generating 5000 synthetic transactions (seed=42)...")
    df = generate_transactions(count=5000, seed=42)

    fraud_count = df["is_fraud"].sum()
    print(f"  Total: {len(df)} | Fraud: {fraud_count} ({fraud_count / len(df) * 100:.1f}%)")

    print("Extracting features...")
    X = extract_features(df)
    y = df["is_fraud"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    pos_count = y_train.sum()
    neg_count = len(y_train) - pos_count
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0

    print(f"Training XGBoost (scale_pos_weight={scale_pos_weight:.2f})...")
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=42,
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)

    auc = roc_auc_score(y_test, y_prob)
    print(f"\nAUC-ROC: {auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legit", "Fraud"]))

    # Save model
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    model.save_model(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()
