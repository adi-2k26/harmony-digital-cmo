from pydantic import BaseModel, Field
from typing import Literal


class ObservationSnapshot(BaseModel):
    snapshot_id: str
    entity_id: str
    source_id: str
    metric_name: str
    metric_value: float
    metric_unit: str
    observed_at: str
    collected_at: str
    processed_at: str
    topic_text: str


class QualityScore(BaseModel):
    snapshot_id: str
    source_authority_score: float = Field(ge=0, le=100)
    relevance_score: float = Field(ge=0, le=100)
    freshness_score: float = Field(ge=0, le=100)
    anomaly_score: float = Field(ge=0, le=100)
    confidence_score: float = Field(ge=0, le=100)


class SeoActionPlan(BaseModel):
    keyword: str
    steps: list[str]
    timeline: str
    expected_impact: str
    priority: Literal["high", "medium", "low"]
