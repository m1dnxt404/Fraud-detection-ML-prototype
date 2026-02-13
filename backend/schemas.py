from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model that serializes field names to camelCase."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class Transaction(CamelModel):
    id: str
    amount: float
    merchant: str
    city: str
    card_type: str
    hour: int
    velocity: int
    dist_from_home: int
    is_fraud: bool
    risk_score: float
    date: str
    flagged: bool


class TransactionsResponse(CamelModel):
    transactions: list[Transaction]
    total_fraud: int


class EvaluateRequest(CamelModel):
    threshold: float


class EvaluateResponse(CamelModel):
    tp: int
    fp: int
    fn: int
    tn: int
    precision: float
    recall: float
    f1: float
    accuracy: float


class ROCPoint(CamelModel):
    fpr: float
    tpr: float
    threshold: float
    precision: float
    recall: float
    f1: float


class FeatureImportanceItem(CamelModel):
    feature: str
    importance: float
