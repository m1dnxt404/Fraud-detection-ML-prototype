from fastapi import APIRouter, Query

from ..data.generator import generate_transactions
from ..ml.model import (
    evaluate_at_threshold,
    compute_roc_curve,
    get_feature_importance,
)
from ..schemas import EvaluateRequest, EvaluateResponse, ROCPoint, FeatureImportanceItem
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
    """Return feature importance from the specified model."""
    if model == "tensorflow":
        df = generate_transactions(count=500, seed=42)
        y_true = df["is_fraud"].astype(int).values
        items = get_feature_importance(model_name=model, df=df, y_true=y_true)
    else:
        items = get_feature_importance(model_name=model)
    return [FeatureImportanceItem(**item) for item in items]
