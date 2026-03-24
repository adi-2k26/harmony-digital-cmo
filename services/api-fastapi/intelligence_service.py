"""Click-to-run market intelligence: Google Trends + OpenAI, run logging."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import agents
import repositories as repo
from openai_client import (
    generate_competitive_benchmark_intelligence,
    generate_detailed_market_intelligence,
    generate_full_analysis_narrative,
    generate_seo_harmony_strategy,
    get_openai_client,
)
from module_sections_market import MARKET_MODULES
from research_context import build_research_context
from trends_google import fetch_google_trends_payload

# Single source of truth with `agents.get_module_landing` / dashboard modules — avoids drift (e.g. missing brand_benchmark).
MODULE_KEYS = frozenset(m["key"] for m in MARKET_MODULES)

_BENCHMARK_BRAND_IDS = frozenset({"harmony", "queensmith", "flawless", "diamonds77"})
_BENCHMARK_CRITERIA_IDS = frozenset(
    {
        "brand_positioning",
        "offer_architecture",
        "pricing_transparency",
        "showroom_journey",
        "content_creative",
        "organic_search",
        "paid_media_posture",
        "social_community",
        "trust_credibility",
        "ux_conversion",
        "local_london_relevance",
        "innovation_measurement",
    }
)

# Map catalog agent ids to module intelligence keys
AGENT_ID_TO_MODULE: dict[str, str] = {
    "seo_organic_strategy_agent": "seo",
    "trend_analysis_agent": "trend",
    "content_generation_agent": "content",
}


def normalize_intelligence_key(agent_id: str) -> str | None:
    if agent_id in MODULE_KEYS:
        return agent_id
    return AGENT_ID_TO_MODULE.get(agent_id)


def _validate_market_shape(o: dict[str, Any]) -> None:
    for k in (
        "executive_summary",
        "market_signal_breakdown",
        "segment_or_intent_analysis",
        "peer_pattern_notes",
        "risk_and_confidence",
        "recommended_actions",
    ):
        if k not in o:
            raise ValueError(f"Invalid model output: missing {k}")


def _validate_seo_shape(o: dict[str, Any]) -> None:
    _validate_market_shape(o)
    for k in (
        "market_context_used",
        "harmony_priority_playbook",
        "implementation_plan_30_60_90",
        "expected_visibility_impact_assumptions",
    ):
        if k not in o:
            raise ValueError(f"Invalid SEO output: missing {k}")


def _validate_benchmark_shape(o: dict[str, Any]) -> None:
    _validate_market_shape(o)
    for k in ("source_provenance",):
        if k not in o:
            raise ValueError(f"Invalid benchmark output: missing {k}")
    sp = o.get("source_provenance")
    if not isinstance(sp, dict) or "notes" not in sp or "trends_status" not in sp:
        raise ValueError("Invalid benchmark output: source_provenance shape")
    bd = o.get("benchmark_dashboard")
    if not isinstance(bd, dict):
        raise ValueError("Invalid benchmark output: benchmark_dashboard")
    brands = bd.get("brands")
    if not isinstance(brands, list) or len(brands) < 4:
        raise ValueError("Invalid benchmark output: brands")
    scores = bd.get("scores")
    if not isinstance(scores, dict):
        raise ValueError("Invalid benchmark output: scores")
    for bid in _BENCHMARK_BRAND_IDS:
        if bid not in scores:
            raise ValueError(f"Invalid benchmark output: scores missing {bid}")
        bscores = scores[bid]
        if not isinstance(bscores, dict):
            raise ValueError(f"Invalid benchmark output: scores[{bid}]")
        for cid in _BENCHMARK_CRITERIA_IDS:
            if cid not in bscores:
                raise ValueError(f"Invalid benchmark output: scores[{bid}] missing {cid}")
            cell = bscores[cid]
            if not isinstance(cell, dict) or "score" not in cell:
                raise ValueError(f"Invalid benchmark output: scores[{bid}][{cid}]")
    for k in ("criteria", "harmony_swot", "peer_highlights", "initiatives"):
        if k not in bd:
            raise ValueError(f"Invalid benchmark output: benchmark_dashboard missing {k}")


def _validate_narrative_brief(o: dict[str, Any]) -> None:
    for k in (
        "executive_summary",
        "detailed_analysis",
        "peer_or_market_notes",
        "risks_and_limitations",
        "recommended_actions",
        "provenance_note",
    ):
        if k not in o:
            raise ValueError(f"Invalid narrative output: missing {k}")


def run_detailed_intelligence(agent_id_raw: str) -> dict[str, Any]:
    """
    Execute one intelligence run. agent_id_raw is a module key or mapped catalog id.
    Returns AgentRunRecord-shaped dict.
    """
    key = normalize_intelligence_key(agent_id_raw)
    if not key:
        raise ValueError(f"Unknown intelligence agent: {agent_id_raw}")

    run_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc).isoformat()
    repo.insert_agent_run_pending(run_id=run_id, agent_id=key, started_at=started_at)

    if not get_openai_client():
        repo.fail_agent_run(run_id, "OPENAI_API_KEY not configured; cannot generate detailed intelligence.")
        return repo.get_agent_run(run_id)  # type: ignore[return-value]

    mod = agents.get_module_landing(key)
    if not mod:
        repo.fail_agent_run(run_id, "Module payload not found.")
        return repo.get_agent_run(run_id)  # type: ignore[return-value]

    try:
        rc = build_research_context(key)
        trends = fetch_google_trends_payload(key)
        if key == "seo":
            prior = repo.list_latest_selected_outputs_excluding_seo()
            output = generate_seo_harmony_strategy(mod, trends, prior, research_context=rc)
            _validate_seo_shape(output)
        elif key == "brand_benchmark":
            output = generate_competitive_benchmark_intelligence(mod, trends, research_context=rc)
            _validate_benchmark_shape(output)
        else:
            output = generate_detailed_market_intelligence(key, mod, trends, research_context=rc)
            _validate_market_shape(output)
        repo.complete_agent_run(
            run_id,
            source_meta=trends,
            output=output,
        )
    except Exception as exc:  # noqa: BLE001
        repo.fail_agent_run(run_id, str(exc))

    row = repo.get_agent_run(run_id)
    if not row:
        raise RuntimeError("Run record missing after execution")
    return row


def run_full_module_analysis(agent_id_raw: str, objective: str | None) -> dict[str, Any]:
    """
    Structured intelligence (Trends + OpenAI) plus long-form narrative in one run.
    Output shape: { structured, narrative_brief, provenance_banner }.
    """
    key = normalize_intelligence_key(agent_id_raw)
    if not key:
        raise ValueError(f"Unknown intelligence agent: {agent_id_raw}")

    run_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc).isoformat()
    repo.insert_agent_run_pending(run_id=run_id, agent_id=key, started_at=started_at)

    if not get_openai_client():
        repo.fail_agent_run(run_id, "OPENAI_API_KEY not configured; cannot generate detailed intelligence.")
        return repo.get_agent_run(run_id)  # type: ignore[return-value]

    mod = agents.get_module_landing(key)
    if not mod:
        repo.fail_agent_run(run_id, "Module payload not found.")
        return repo.get_agent_run(run_id)  # type: ignore[return-value]

    try:
        rc = build_research_context(key)
        trends = fetch_google_trends_payload(key)
        if key == "seo":
            prior = repo.list_latest_selected_outputs_excluding_seo()
            structured = generate_seo_harmony_strategy(mod, trends, prior, research_context=rc)
            _validate_seo_shape(structured)
            narrative = generate_full_analysis_narrative(
                key, mod, trends, structured, objective, is_seo=True
            )
        elif key == "brand_benchmark":
            structured = generate_competitive_benchmark_intelligence(mod, trends, research_context=rc)
            _validate_benchmark_shape(structured)
            narrative = generate_full_analysis_narrative(
                key, mod, trends, structured, objective, is_seo=False, is_benchmark=True
            )
        else:
            structured = generate_detailed_market_intelligence(key, mod, trends, research_context=rc)
            _validate_market_shape(structured)
            narrative = generate_full_analysis_narrative(
                key, mod, trends, structured, objective, is_seo=False
            )
        _validate_narrative_brief(narrative)
        merged: dict[str, Any] = {
            "structured": structured,
            "narrative_brief": narrative,
            "provenance_banner": rc.get("provenance_banner", ""),
        }
        source_meta: dict[str, Any] = {
            **trends,
            "research_context": {
                "module_key": rc.get("module_key"),
                "provenance": rc.get("provenance_banner", ""),
            },
        }
        repo.complete_agent_run(run_id, source_meta=source_meta, output=merged)
    except Exception as exc:  # noqa: BLE001
        repo.fail_agent_run(run_id, str(exc))

    row = repo.get_agent_run(run_id)
    if not row:
        raise RuntimeError("Run record missing after execution")
    return row
