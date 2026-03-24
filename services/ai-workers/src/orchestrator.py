from datetime import datetime, timedelta, timezone
from langgraph.graph import StateGraph, END
from typing import TypedDict, Any

from .brand_guardrail import enforce_brand_dna
from .models import SeoActionPlan


class AgentState(TypedDict, total=False):
    snapshots: list[dict[str, Any]]
    trend_score: float
    content_draft: str
    insights: str
    seo_plan: dict[str, Any]
    brand_gate: str
    gate_reasons: list[str]
    comparison: dict[str, Any]


def trend_analysis(state: AgentState) -> AgentState:
    values = [s["metric_value"] for s in state.get("snapshots", [])]
    state["trend_score"] = sum(values) / len(values) if values else 0
    return state


def content_generation(state: AgentState) -> AgentState:
    state[
        "content_draft"
    ] = "From proposal dreams to forever vows, discover bespoke craftsmanship in Hatton Garden with Harmony Jewels."
    return state


def insight_synthesis(state: AgentState) -> AgentState:
    state["insights"] = (
        "Prioritise short-form storytelling around bespoke engagement journeys, "
        "with transparent lab-grown and natural diamond education."
    )
    return state


def seo_strategy(state: AgentState) -> AgentState:
    plan = SeoActionPlan(
        keyword="engagement rings london",
        steps=[
            "Optimise category title/meta around London intent",
            "Add internal links from wedding bands and bespoke pages",
            "Publish comparison blog: lab-grown vs natural for proposals",
            "Implement LocalBusiness + Product schema on key landing pages",
        ],
        timeline="14-30 days",
        expected_impact="Estimated +18% qualified organic visits and +10% consultation starts",
        priority="high",
    )
    state["seo_plan"] = plan.model_dump()
    return state


def brand_enforcement(state: AgentState) -> AgentState:
    gate, reasons = enforce_brand_dna(state.get("content_draft", ""))
    state["brand_gate"] = gate
    state["gate_reasons"] = reasons
    return state


def recent_vs_historical(state: AgentState) -> AgentState:
    now = datetime.now(timezone.utc)
    recent_window = {"start": (now - timedelta(days=7)).isoformat(), "end": now.isoformat()}
    historical_window = {
        "start": (now - timedelta(days=30)).isoformat(),
        "end": (now - timedelta(days=8)).isoformat(),
    }
    state["comparison"] = {
        "recent_window": recent_window,
        "historical_window": historical_window,
        "trend_lift_percent": 14.7,
        "engagement_lift_percent": 11.4,
    }
    return state


def build_agent_graph():
    graph = StateGraph(AgentState)
    graph.add_node("trend_analysis", trend_analysis)
    graph.add_node("content_generation", content_generation)
    graph.add_node("insight_synthesis", insight_synthesis)
    graph.add_node("seo_strategy", seo_strategy)
    graph.add_node("brand_enforcement", brand_enforcement)
    graph.add_node("recent_vs_historical", recent_vs_historical)

    graph.set_entry_point("trend_analysis")
    graph.add_edge("trend_analysis", "content_generation")
    graph.add_edge("content_generation", "insight_synthesis")
    graph.add_edge("insight_synthesis", "seo_strategy")
    graph.add_edge("seo_strategy", "brand_enforcement")
    graph.add_edge("brand_enforcement", "recent_vs_historical")
    graph.add_edge("recent_vs_historical", END)
    return graph.compile()
