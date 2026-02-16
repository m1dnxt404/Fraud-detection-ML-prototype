from fastapi import APIRouter, HTTPException, Query

from ..ml.model import evaluate_at_threshold, compute_roc_curve
from ..ml.shap_explain import get_shap_global_importance, get_transaction_shap
from ..schemas import (
    EvaluateRequest, EvaluateResponse, ROCPoint,
    FeatureImportanceItem, TransactionShapResponse, ShapFeatureItem,
)
from .transactions import _get_dataset

router = APIRouter(prefix="/api/model")


@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate_model(req: EvaluateRequest):
    """Evaluate model metrics at a given threshold."""
    _, scores, y_true = _get_dataset(req.model)
    result = evaluate_at_threshold(y_true, scores, req.threshold)
    return EvaluateResponse(**result)


@router.get("/roc", response_model=list[ROCPoint])
def get_roc_curve(model: str = Query("xgboost", pattern="^(xgboost|tensorflow)$")):
    """Return ROC + precision-recall curve data points."""
    _, scores, y_true = _get_dataset(model)
    points = compute_roc_curve(y_true, scores)
    return [ROCPoint(**p) for p in points]


@router.get("/features", response_model=list[FeatureImportanceItem])
def get_features(model: str = Query("xgboost", pattern="^(xgboost|tensorflow)$")):
    """Return SHAP-based global feature importance."""
    items = get_shap_global_importance(model_name=model)
    return [FeatureImportanceItem(**item) for item in items]


@router.get("/shap/{txn_id}", response_model=TransactionShapResponse)
def get_txn_shap(
    txn_id: str,
    model: str = Query("xgboost", pattern="^(xgboost|tensorflow)$"),
):
    """Return SHAP explanation for a single transaction."""
    txns, _, _ = _get_dataset(model)
    index = next((i for i, t in enumerate(txns) if t["id"] == txn_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail=f"Transaction {txn_id} not found")
    result = get_transaction_shap(model_name=model, txn_index=index)
    return TransactionShapResponse(
        base_value=result["base_value"],
        output_value=result["output_value"],
        features=[ShapFeatureItem(**f) for f in result["features"]],
    )
