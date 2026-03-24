from __future__ import annotations

from datetime import datetime, timezone
import time

import repositories as repo
import agents
from hybrid_fallback import (
    build_fallback_kpi,
    build_fallback_module_sections,
    build_fallback_recent_vs,
)

_LAST_RECOMPUTE_AT = 0.0
_RECOMPUTE_TTL_SECONDS = 90.0


def recompute_hybrid_intelligence(force: bool = False) -> dict:
    """Recompute a no-external-API hybrid snapshot for this login/session."""
    global _LAST_RECOMPUTE_AT
    now = time.time()
    if not force and (now - _LAST_RECOMPUTE_AT) < _RECOMPUTE_TTL_SECONDS:
        existing = repo.load_hybrid_dashboard_snapshot()
        if existing:
            return {"status": "skipped", "generated_at": existing.get("generated_at"), "source_mode": existing.get("source_mode")}

    kpi_seed = repo.kpi_summary_from_snapshots()
    module_seed = agents.module_sections()
    kpi = build_fallback_kpi(kpi_seed, "hybrid-kpi")
    modules = build_fallback_module_sections(module_seed, "hybrid-modules")
    recent_vs = build_fallback_recent_vs(kpi)
    ts = datetime.now(timezone.utc).isoformat()
    payload = {
        "generated_at": ts,
        "source_mode": "hybrid_no_external_api",
        "refreshed_on_login_at": ts,
        "kpi_summary": kpi,
        "module_sections": modules,
        "recent_vs_historical": recent_vs,
    }
    repo.save_hybrid_dashboard_snapshot(payload)
    _LAST_RECOMPUTE_AT = now
    return {"status": "recomputed", "generated_at": ts, "source_mode": payload["source_mode"]}


def build_enterprise_dashboard() -> dict:
    snapshot = repo.load_hybrid_dashboard_snapshot() or {}
    kpi = snapshot.get("kpi_summary") if isinstance(snapshot.get("kpi_summary"), dict) else repo.kpi_summary_from_snapshots()
    uk_search = agents.uk_market_search_insights()
    selected_runs = repo.list_agent_runs(selected_only=True, limit=24)
    return {
        "kpi_summary": kpi,
        "module_sections": snapshot.get("module_sections") if isinstance(snapshot.get("module_sections"), list) else agents.module_sections(),
        "confidence_and_provenance": agents.confidence_and_provenance(),
        "action_recommendations": repo.list_actions(),
        "kpi_explanations": agents.kpi_explanations(),
        "dashboard_intro": agents.dashboard_intro(),
        "dashboard_chart_captions": agents.dashboard_chart_captions(),
        "data_scope_banner": agents.data_scope_banner(),
        "uk_market_search_overview": uk_search["overview"],
        "uk_market_search_by_module": uk_search["by_module"],
        "selected_intelligence_runs": selected_runs,
        "generated_at": snapshot.get("generated_at") if isinstance(snapshot.get("generated_at"), str) else datetime.now(timezone.utc).isoformat(),
        "source_mode": snapshot.get("source_mode", "snapshot_only"),
        "refreshed_on_login_at": snapshot.get("refreshed_on_login_at"),
    }


def build_recent_vs_historical() -> dict:
    snapshot = repo.load_hybrid_dashboard_snapshot() or {}
    if isinstance(snapshot.get("recent_vs_historical"), dict):
        return snapshot["recent_vs_historical"]
    return repo.recent_vs_historical_from_snapshots()


def build_report_center() -> dict:
    base = agents.report_center()
    base["decision_logs"] = repo.decision_logs()
    return base
