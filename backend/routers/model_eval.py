from fastapi import APIRouter

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
    _, scores, y_true = _get_dataset()
    result = evaluate_at_threshold(y_true, scores, req.threshold)
    return EvaluateResponse(**result)


@router.get("/roc", response_model=list[ROCPoint])
def get_roc_curve():
    """Return ROC + precision-recall curve data points."""
    _, scores, y_true = _get_dataset()
    points = compute_roc_curve(y_true, scores)
    return [ROCPoint(**p) for p in points]


@router.get("/features", response_model=list[FeatureImportanceItem])
def get_features():
    """Return feature importance from the trained XGBoost model."""
    items = get_feature_importance()
    return [FeatureImportanceItem(**item) for item in items]
