from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


ActionStatus = Literal["draft", "ready_for_review", "approved", "rejected"]


class HealthResponse(BaseModel):
    ok: bool
    service: str
    ts: str


class OpenAiHealthResponse(BaseModel):
    """OpenAI connectivity; use ?probe=true for a minimal live API call (uses a few tokens)."""

    configured: bool
    model: str
    probe: Literal["skipped", "ok", "error"]
    detail: str | None = None


class AuthSetupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=256)


class AuthLoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=256)


class AuthUserResponse(BaseModel):
    username: str
    configured: bool = True


class AuthConfiguredResponse(BaseModel):
    configured: bool


class ModuleKeysHealthResponse(BaseModel):
    """Intelligence module keys loaded from MARKET_MODULES (used by run-full-analysis)."""

    module_keys: list[str]
    brand_benchmark_registered: bool


class SystemStatusResponse(BaseModel):
    db: Literal["up", "down"]
    background_jobs: bool
    queue: Literal["up", "down", "disabled", "incompatible"]
    workers: Literal["up", "down", "disabled", "incompatible"]
    redis_version: str | None = None


class KpiSummary(BaseModel):
    consultation_intent_score: float
    organic_growth_percent: float
    engagement_quality_score: float
    avg_rank_position: float


class ModuleLink(BaseModel):
    label: str
    href: str


class ModuleInsightBlock(BaseModel):
    """Detailed insight with optional comparison vs baseline or prior window."""

    title: str
    body: str
    comparison: str | None = None


ResearchSourceScope = Literal["uk_market", "peer_set", "category_benchmark", "connected_account", "editorial"]
ResearchSourceKind = Literal[
    "aggregated_signal",
    "serp_sample",
    "editorial_synthesis",
    "connected_account",
    "category_benchmark",
]


class ResearchSource(BaseModel):
    """Named input or methodology behind a module’s signals (transparency for marketing teams)."""

    label: str
    scope: ResearchSourceScope
    kind: ResearchSourceKind
    detail: str | None = Field(default=None, description="One line on how this source is used.")


class ModuleSection(BaseModel):
    key: str
    title: str
    narrative: str
    primary_metric: str
    value: float
    trend_percent: float
    summary: str | None = None
    user_value: str | None = None
    primary_actions: list[str] | None = None
    links: list[ModuleLink] | None = None
    purpose_note: str | None = Field(
        default=None,
        description="What this module does (and does not claim); shown first on module pages.",
    )
    detailed_insights: list[ModuleInsightBlock] | None = None
    metric_explanations: dict[str, str] | None = Field(
        default=None,
        description="Keys e.g. primary_metric, primary_value, trend_percent — how to read the numbers.",
    )
    metric_display_name: str | None = Field(
        default=None,
        description="Human-readable label for the primary index (UI); primary_metric stays the internal key.",
    )
    research_sources: list[ResearchSource] | None = Field(
        default=None,
        description="Methodology and signal origins (UK market, peer set, etc.).",
    )
    application_note: str | None = Field(
        default=None,
        description="Neutral ‘apply to your brand’ guidance for the marketing team.",
    )


class KpiExplanations(BaseModel):
    """Plain-language interpretation for each headline KPI on the executive dashboard."""

    consultation_intent_score: str | None = None
    organic_growth_percent: str | None = None
    engagement_quality_score: str | None = None
    avg_rank_position: str | None = None


class DashboardChartCaptions(BaseModel):
    """How to read each chart on the executive dashboard."""

    engagement_trend: str | None = None
    seo_position: str | None = None
    platform_performance: str | None = None


class ConfidenceProvenance(BaseModel):
    confidence: float
    source: str
    collected_at: str
    refreshed_at: str
    freshness_sla: str


class ActionRecommendation(BaseModel):
    id: str
    title: str
    expected_impact: str
    effort: Literal["low", "medium", "high"]
    priority: Literal["low", "medium", "high"]
    owner: str
    due_date: str
    status: ActionStatus


class UkMarketModuleInsight(BaseModel):
    """Per-module UK search / market angle for dashboard aggregation (neutral, not brand-specific)."""

    module_key: str
    title: str
    insight: str


class AgentRunRecord(BaseModel):
    """Logged click-to-run intelligence execution (module key in agent_id)."""

    run_id: str
    agent_id: str
    status: Literal["pending", "completed", "failed"]
    started_at: str
    completed_at: str | None = None
    message: str | None = None
    source_meta: dict | None = None
    output: dict | None = None
    selected_for_dashboard: bool = True


class EnterpriseDashboardResponse(BaseModel):
    kpi_summary: KpiSummary
    module_sections: list[ModuleSection]
    confidence_and_provenance: list[ConfidenceProvenance]
    action_recommendations: list[ActionRecommendation]
    kpi_explanations: KpiExplanations | None = None
    dashboard_intro: str | None = Field(
        default=None,
        description="Introductory copy for the executive dashboard report.",
    )
    dashboard_chart_captions: DashboardChartCaptions | None = None
    data_scope_banner: str | None = Field(
        default=None,
        description="Clarifies blend of UK market proxies vs connected first-party data.",
    )
    uk_market_search_overview: str | None = Field(
        default=None,
        description="Executive summary: UK generic search and market intent across modules.",
    )
    uk_market_search_by_module: list[UkMarketModuleInsight] | None = Field(
        default=None,
        description="One insight per intelligence module—search demand, peer SERP, or intent lens.",
    )
    selected_intelligence_runs: list[AgentRunRecord] | None = Field(
        default=None,
        description="Latest click-to-run intelligence outputs selected for dashboard (module keys).",
    )
    generated_at: str | None = Field(
        default=None,
        description="ISO timestamp when this dashboard payload was assembled (server clock).",
    )
    source_mode: str | None = Field(
        default=None,
        description="Data assembly mode (e.g. hybrid_no_external_api).",
    )
    refreshed_on_login_at: str | None = Field(
        default=None,
        description="When login/session bootstrap last recomputed hybrid payload.",
    )


class RecentVsHistoricalResponse(BaseModel):
    recent: dict
    historical: dict
    deltas: dict


class DrilldownResponse(BaseModel):
    metric: str
    narrative: str
    recommendations: list[str]


class ReportCenterResponse(BaseModel):
    weekly_snapshot: dict
    monthly_comparison: dict
    decision_logs: list[dict]


class WebsiteAnalysisResponse(BaseModel):
    products: dict
    journey: dict
    tone: dict
    pricing: dict


class SeoImplementationResponse(BaseModel):
    primaryKeyword: str
    timeline: str
    actions: list[dict]


class AgentCatalogResponse(BaseModel):
    agents: list[dict]


class AgentDetailResponse(BaseModel):
    agent: dict


class DeepDiveRequest(BaseModel):
    objective: str | None = Field(
        default=None,
        description="Optional focus for the deep dive (e.g. Q2 engagement ring push).",
    )


class DeepDiveResponse(BaseModel):
    available: bool
    source: Literal["openai", "unavailable"]
    content: dict | None = None
    message: str | None = None


class ModuleDeepDiveResponse(BaseModel):
    """On-demand OpenAI long-form analysis for a UK market intelligence module."""

    available: bool
    source: Literal["openai", "unavailable"]
    content: dict | None = None
    message: str | None = None


class FullAnalysisRequest(BaseModel):
    """Optional focus string for the long-form narrative layer of run-full-analysis."""

    objective: str | None = Field(
        default=None,
        description="Optional focus (e.g. Q2 engagement ring push).",
    )


class AgentRunDetailedResponse(BaseModel):
    run: AgentRunRecord


class AgentRunListResponse(BaseModel):
    runs: list[AgentRunRecord]


class AgentRunSelectRequest(BaseModel):
    selected: bool


class ModuleLandingResponse(BaseModel):
    module: dict


class SessionBootstrapResponse(BaseModel):
    status: Literal["recomputed", "skipped"]
    generated_at: str | None = None
    source_mode: str | None = None


class AgentRunRequest(BaseModel):
    agent_id: str = Field(..., min_length=3)
    objective: str = Field(..., min_length=5)
    context: dict = Field(default_factory=dict)


class AgentRunResponse(BaseModel):
    signal: str
    reasoning: str
    recommendation: str
    impact_estimate: str
    confidence: float
    provenance: list[dict]


class ActionListResponse(BaseModel):
    actions: list[ActionRecommendation]


class ActionStatusPatchRequest(BaseModel):
    status: ActionStatus
