from functools import lru_cache

from fastapi import APIRouter, Query

from ..data.generator import generate_transactions
from ..ml.model import predict_risk_scores
from ..schemas import Transaction, TransactionsResponse

router = APIRouter(prefix="/api")


@lru_cache(maxsize=2)
def _get_dataset(model_name: str = "xgboost") -> tuple[list[dict], list[float], list[bool]]:
    """Generate and score transactions once per model, cache for the server session."""
    df = generate_transactions(count=500, seed=42)
    scores = predict_risk_scores(df, model_name=model_name)

    txns = []
    for _, row in df.iterrows():
        score = scores[len(txns)]
        txns.append({
            "id": row["id"],
            "amount": row["amount"],
            "merchant": row["merchant"],
            "city": row["city"],
            "card_type": row["card_type"],
            "hour": row["hour"],
            "velocity": row["velocity"],
            "dist_from_home": row["dist_from_home"],
            "is_fraud": row["is_fraud"],
            "risk_score": score,
            "date": row["date"],
            "flagged": score > 0.6,
        })

    y_true = [t["is_fraud"] for t in txns]
    return txns, scores, y_true


@router.get("/transactions", response_model=TransactionsResponse)
def get_transactions(model: str = Query("xgboost", pattern="^(xgboost|tensorflow)$")):
    """Return all cached transactions with risk scores from the selected model."""
    txns, _, _ = _get_dataset(model)
    total_fraud = sum(1 for t in txns if t["is_fraud"])
    return TransactionsResponse(
        transactions=[Transaction(**t) for t in txns],
        total_fraud=total_fraud,
    )
