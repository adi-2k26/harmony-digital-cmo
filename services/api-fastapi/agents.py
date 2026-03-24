from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from module_sections_market import MARKET_MODULES

# --- Full curated registry (7 agents) --------------------------------------


def _agent_registry() -> list[dict]:
    return [
        {
            "id": "data_collection_agent",
            "name": "Data Collection Agent",
            "tagline": "Ingests and normalises market signals with recency and source confidence.",
            "purpose": "Collect recency-prioritised UK jewellery and luxury retail signals from configured sources, "
            "normalise them into observation snapshots, and attach provenance for downstream analysis.",
            "inputs": [
                "TikTok / short-form trend endpoints (where licensed)",
                "Meta marketing insights (where connected)",
                "SEO / Search Console exports",
                "Competitor page change feeds (manual or tool-based)",
            ],
            "outputs": [
                "Observation snapshots (metric_name, metric_value, observed_at, source_system_id)",
                "Quality scores and credibility flags",
                "Provenance audit rows for replay and compliance",
            ],
            "dependencies": ["PostgreSQL", "Optional Redis queue", "API credentials per source"],
            "cadence": "6h (social) / 24h (SEO) / 72h (competitor) — configurable",
            "failure_handling": "Exponential backoff retries, dead-letter queue for poison messages, "
            "degraded mode with last-known-good snapshot.",
            "owner": "data_ops",
            "sla": "95% successful collection windows per schedule",
            "what_it_does": [
                "Pulls or accepts batched exports from each source connector.",
                "Normalises units (UK locale, currency where applicable) and timestamps to UTC.",
                "Applies jewellery-relevance and credibility filters before persistence.",
                "Emits events for Trend Analysis and Dashboard agents.",
            ],
            "example_outputs": [
                "engagement_rate snapshot for Instagram content cluster X",
                "avg_position for query cluster engagement rings london",
                "competitor_new_collection_page flag with URL hash",
            ],
            "brand_dna_notes": "Does not publish customer-facing copy; only structured signals. "
            "All public-facing content is downstream of Brand DNA.",
            "limitations": [
                "Requires valid API credentials and rate limits per platform.",
                "Cannot access private competitor data without legal tools.",
            ],
            "kpis_it_moves": ["Data freshness index", "Source coverage %", "Ingest error rate"],
            "handoffs_to": ["trend_analysis_agent", "dashboard_generation_agent"],
        },
        {
            "id": "trend_analysis_agent",
            "name": "Trend Analysis Agent",
            "tagline": "Turns snapshots into trend scores and opportunity indicators.",
            "purpose": "Aggregate recent vs historical windows, compute trend deltas and opportunity scores "
            "for UK luxury jewellery categories (engagement, wedding, bespoke).",
            "inputs": ["observation_snapshot rows", "quality_score", "segment definitions"],
            "outputs": ["trend_score", "opportunity_score", "segment deltas", "narrative hooks for content"],
            "dependencies": ["PostgreSQL", "Optional OpenAI enrichment"],
            "cadence": "Hourly aggregation on ingest; on-demand for drilldowns",
            "failure_handling": "Fallback scoring from rolling averages; alert on schema drift.",
            "owner": "insights_ops",
            "sla": "P95 under 30 minutes from last snapshot",
            "what_it_does": [
                "Builds rolling windows (7d / 30d / 90d) for comparison.",
                "Scores momentum for themes (e.g. oval vs radiant cuts, proposal storytelling).",
                "Surfaces anomalies and confidence intervals for reporting.",
            ],
            "example_outputs": [
                "trend_score 82 for proposal-story creative cluster",
                "opportunity_score high for local intent pages",
            ],
            "brand_dna_notes": "Trend language must align with bespoke craftsmanship and trust; "
            "no aggressive discount framing.",
            "limitations": [
                "Trends are modelled from available data; sparse data yields wider confidence bands.",
            ],
            "kpis_it_moves": ["Trend score", "Engagement lift % vs baseline", "Opportunity score"],
            "handoffs_to": ["content_generation_agent", "insight_synthesis_agent", "dashboard_generation_agent"],
        },
        {
            "id": "content_generation_agent",
            "name": "Content Generation Agent",
            "tagline": "Produces on-brand social and editorial drafts from approved signals.",
            "purpose": "Generate draft captions, hooks, and blog outlines for Harmony Jewels London, "
            "UK market, luxury emotional tone, with consultation CTAs where appropriate.",
            "inputs": ["trend signals", "brand guidelines", "product and collection metadata", "SEO keyword clusters"],
            "outputs": ["draft posts", "hook variants", "blog outlines", "content calendar suggestions"],
            "dependencies": ["OpenAI", "Brand DNA enforcement (pre-publish)"],
            "cadence": "On-demand and batch (e.g. weekly cadence)",
            "failure_handling": "Regenerate with stricter JSON schema; route to human review queue.",
            "owner": "marketing_ops",
            "sla": "Draft generation within minutes per batch",
            "what_it_does": [
                "Maps approved signals to content pillars (engagement, wedding, bespoke).",
                "Produces multiple variants for A/B testing in social.",
                "Outputs structured JSON for CMS or scheduling tools.",
            ],
            "example_outputs": [
                "Three Instagram caption variants for oval engagement ring story",
                "Long-form outline for lab-grown vs natural education page",
            ],
            "brand_dna_notes": "Must pass Brand DNA agent: Hatton Garden heritage, transparency, no pressure.",
            "limitations": [
                "Does not auto-publish; requires human approval in regulated environments.",
            ],
            "kpis_it_moves": ["Engagement rate", "Save/share rate", "Consultation clicks from content"],
            "handoffs_to": ["brand_dna_enforcement_agent", "seo_organic_strategy_agent"],
        },
        {
            "id": "insight_synthesis_agent",
            "name": "Insight Synthesis Agent",
            "tagline": "Synthesises cross-channel findings into executive briefs and decisions.",
            "purpose": "Combine trend, SEO, social, and competitor signals into a coherent narrative "
            "with recommended actions, effort, and expected impact ranges.",
            "inputs": [
                "Outputs from trend and content agents",
                "SEO performance summaries",
                "Action queue and decision history",
            ],
            "outputs": [
                "Weekly briefs",
                "Monthly comparison tables",
                "Decision log entries",
                "Prioritised action recommendations",
            ],
            "dependencies": ["PostgreSQL", "OpenAI for synthesis"],
            "cadence": "Weekly + monthly rollups",
            "failure_handling": "Partial synthesis with explicit gaps; never invent missing metrics.",
            "owner": "marketing_ops",
            "sla": "Brief available within SLA window after data freeze",
            "what_it_does": [
                "Merges quantitative deltas with qualitative brand notes.",
                "Ranks recommendations by impact vs effort.",
                "Writes decision-ready bullets for leadership.",
            ],
            "example_outputs": [
                "Executive summary: consultation intent +11% vs prior month with drivers",
                "Prioritised action list with owners",
            ],
            "brand_dna_notes": "Framing stays premium and trust-first; avoids hype.",
            "limitations": [
                "Quality depends on upstream data completeness.",
            ],
            "kpis_it_moves": ["Consultation intent", "Organic sessions", "Avg rank", "Action completion rate"],
            "handoffs_to": ["dashboard_generation_agent"],
        },
        {
            "id": "brand_dna_enforcement_agent",
            "name": "Brand DNA Enforcement Agent",
            "tagline": "Deterministic and model checks for Harmony Jewels voice and compliance.",
            "purpose": "Block or rewrite disallowed phrases; require trust and craftsmanship signals; "
            "enforce UK spelling and luxury tone.",
            "inputs": ["Any draft text from Content Agent", "Blocked terms list", "Required tone signals"],
            "outputs": ["pass/fail", "sanitised copy", "audit log", "suggested fixes"],
            "dependencies": ["Policy config", "Optional OpenAI for rewrite suggestions"],
            "cadence": "On every draft before publish",
            "failure_handling": "Fail closed; human review queue for edge cases.",
            "owner": "brand_ops",
            "sla": "Near real-time per document",
            "what_it_does": [
                "Runs deterministic regex and keyword gates.",
                "Scores emotional tone alignment with brand pillars.",
                "Logs decisions for compliance review.",
            ],
            "example_outputs": [
                "PASS with minor tweak to replace superlative claim",
                "FAIL with suggested replacement sentence",
            ],
            "brand_dna_notes": "Core guardian of bespoke, transparency, Hatton Garden trust.",
            "limitations": [
                "Cannot catch all legal edge cases without legal review for high-risk claims.",
            ],
            "kpis_it_moves": ["Brand pass rate", "Time to approval", "Revision count"],
            "handoffs_to": ["content_generation_agent"],
        },
        {
            "id": "dashboard_generation_agent",
            "name": "Dashboard Generation Agent",
            "tagline": "Turns metrics and narratives into dashboard modules and drilldowns.",
            "purpose": "Compose KPI cards, module sections, and chart-ready series for the executive UI; "
            "support exports (CSV, PDF, PNG).",
            "inputs": ["Aggregated KPIs", "trend outputs", "reporting snapshots"],
            "outputs": ["module_sections JSON", "drilldown payloads", "chart configs"],
            "dependencies": ["FastAPI", "PostgreSQL for historical series"],
            "cadence": "On page load and refresh intervals",
            "failure_handling": "Graceful degradation with cached KPIs and clear status flags.",
            "owner": "platform_ops",
            "sla": "API P95 under typical load thresholds",
            "what_it_does": [
                "Maps metrics to executive dashboard modules",
                "Aligns drilldowns with action planner",
                "Ensures export bundles include chart snapshots when available",
            ],
            "example_outputs": [
                "Enterprise dashboard payload for /dashboards/enterprise",
                "Drilldown narrative for selected metric",
            ],
            "brand_dna_notes": "Labels and tooltips use consistent luxury terminology.",
            "limitations": [
                "Charts depend on client-side rendering; empty states when no data.",
            ],
            "kpis_it_moves": ["Time-to-interactive", "Export success rate"],
            "handoffs_to": ["insight_synthesis_agent"],
        },
        {
            "id": "seo_organic_strategy_agent",
            "name": "SEO & Organic Strategy Agent",
            "tagline": "Keyword clusters, intent pages, schema, and implementation steps.",
            "purpose": "Define UK-focused SEO strategy for engagement and wedding jewellery; "
            "prioritise pages, schema, and internal linking with impact and timeline.",
            "inputs": ["Search Console data", "keyword research", "site crawl summaries", "competitor SERP notes"],
            "outputs": [
                "Primary keyword map",
                "Implementation steps with tools",
                "Expected impact ranges (qualitative)",
                "Dashboard comparison for rank and sessions",
            ],
            "dependencies": ["PostgreSQL", "OpenAI for synthesis", "Third-party SEO tools optional"],
            "cadence": "Weekly strategy refresh; monthly deep-dive",
            "failure_handling": "Fallback to best-practice checklist when data sparse.",
            "owner": "growth_ops",
            "sla": "Recommendations within 2 business days of data freeze",
            "what_it_does": [
                "Clusters intents (engagement rings London, bespoke wedding bands, etc.)",
                "Proposes on-page and technical fixes",
                "Feeds Insight Synthesis for reporting",
            ],
            "example_outputs": [
                "Implementation engine for /seo/implementation-engine",
                "Monthly rank vs sessions comparison",
            ],
            "brand_dna_notes": "Educational content must stay honest; no misleading ranking guarantees.",
            "limitations": [
                "Cannot guarantee rankings; outcomes depend on Google updates and competition.",
            ],
            "kpis_it_moves": ["Organic sessions", "Avg rank", "CTR", "Consultation rate from organic"],
            "handoffs_to": ["content_generation_agent", "insight_synthesis_agent"],
        },
    ]


_REGISTRY: list[dict] | None = None


def _registry() -> list[dict]:
    global _REGISTRY
    if _REGISTRY is None:
        _REGISTRY = _agent_registry()
    return _REGISTRY


def _by_id(agent_id: str) -> dict | None:
    for a in _registry():
        if a["id"] == agent_id:
            return a
    return None


def agent_catalog() -> dict:
    """Catalog list: full fields for UI; backward compatible."""
    return {"agents": _registry()}


def get_agent_detail(agent_id: str) -> dict | None:
    return _by_id(agent_id)


def fallback_actions() -> list[dict]:
    return [
        {
            "id": str(uuid4()),
            "title": "Launch bespoke proposal story series for oval and radiant cuts",
            "expected_impact": "Increase consultation submissions by 10-15% over 30 days",
            "effort": "medium",
            "priority": "high",
            "owner": "marketing_ops",
            "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "status": "ready_for_review",
        }
    ]


def kpi_explanations() -> dict:
    """Plain-language explanations: UK market / category lens; may blend with your connected snapshot."""
    return {
        "consultation_intent_score": (
            "0–100 market-style proxy for consultation-led behaviour (high-intent journeys vs "
            "browsing) in the engine snapshot—useful for direction, not as a single-brand accounting "
            "metric. Higher suggests more sessions resemble UK luxury buyers moving toward appointment "
            "or enquiry. When your own analytics are connected, reconcile with first-party funnels."
        ),
        "organic_growth_percent": (
            "Estimated organic demand change vs a prior window in the snapshot—positive means "
            "stronger discovery momentum for tracked UK jewellery intents. Pair with rank and "
            "engagement quality to avoid chasing low-intent volume."
        ),
        "engagement_quality_score": (
            "Category-relevant engagement depth (saves, meaningful watch/read, relevance)—not likes "
            "alone. Higher indicates content that resonates with UK luxury jewellery audiences in "
            "the model; compare platforms using filters."
        ),
        "avg_rank_position": (
            "Mean position across UK priority intents (e.g. engagement rings London, bespoke "
            "jewellery). Lower is better. Directional average for the tracked set—not a live rank "
            "for every URL; use Search Console for URL-level truth when connected."
        ),
    }


def dashboard_intro() -> str:
    return (
        "UK market intelligence dashboard: trend, audience, content, peer, opportunity, and SEO modules "
        "feed a single view of generic search demand, peer SERP patterns, and category momentum. "
        "Headline KPIs are directional (modelled or snapshot-based) unless your analytics and Search "
        "Console are connected. Use filters for range and objective; click a chart point to capture a "
        "drill-down for your action queue."
    )


def dashboard_chart_captions() -> dict:
    return {
        "engagement_trend": (
            "Compares recent vs historical engagement in the snapshot—useful for spotting momentum "
            "shifts in category-relevant creative, not as a full-market census of every UK brand."
        ),
        "seo_position": (
            "**UK intent** average rank (lower is better): shows whether your tracked query set is "
            "moving vs an earlier window—pair with peer SEO patterns in the SEO module."
        ),
        "platform_performance": (
            "Relative emphasis by platform for the selected objective—helps allocate creative "
            "and tests across channels; confirm with your own attribution when available."
        ),
    }


def data_scope_banner() -> str:
    return (
        "Scope: headline KPIs may combine UK market/category proxies with your observation "
        "snapshots when the database is connected. For definitive site performance, use your "
        "analytics and Search Console alongside this intelligence."
    )


def _uk_search_insight_for_module(m: dict) -> str:
    """Compose a UK search / SERP / intent angle from curated module fields (neutral copy)."""
    key = m.get("key", "")
    narrative = (m.get("narrative") or "").strip()
    summary = (m.get("summary") or "").strip()

    if key == "trend":
        return (
            f"{summary} "
            f"{narrative} "
            "For organic and paid search: align titles and landing copy with the same language clusters "
            "UK buyers use (e.g. bespoke, certification, local consultation)—social momentum often "
            "prefigures query growth in the category."
        )
    if key == "audience":
        return (
            f"{summary} "
            f"{narrative} "
            "For search strategy: favour keywords and landing paths that match education- and "
            "consultation-ready journeys; broad luxury terms often attract traffic that does not "
            "convert to qualified enquiries."
        )
    if key == "content":
        return (
            f"{summary} "
            f"{narrative} "
            "For SERP and social discovery: formats that mirror how people search (proposal journey, "
            "transparency, craft) tend to earn stronger engagement than catalogue-only messaging—reuse "
            "those hooks in meta descriptions and on-page headings."
        )
    if key == "competitor":
        return (
            f"{summary} "
            f"{narrative} "
            "For SEO: observe peer title patterns, offer framing, and education blocks on high-intent "
            "URLs—differentiate on expertise and trust rather than copying claims; peer moves show which "
            "SERP features and intents are contested."
        )
    if key == "opportunity":
        return (
            f"{summary} "
            f"{narrative} "
            "For UK search: prioritise URLs and intents where demand is strong but content depth or "
            "schema lags peers; local and FAQ-rich pages often outperform thin category shells for "
            "the same keyword groups."
        )
    if key == "seo":
        return (
            f"{summary} "
            f"{narrative} "
            "For refinement: compare your coverage of UK priority intents against peer titles, FAQ "
            "blocks, and structured data; improve internal linking and E-E-A-T depth on money pages "
            "while using Search Console for URL-level queries and CTR when available."
        )
    if key == "brand_benchmark":
        return (
            f"{summary} "
            f"{narrative} "
            "For search and brand: use Trends and synthesis to see where Harmony can differentiate vs "
            "Queensmith, Flawless Fine Jewellery, and 77 Diamonds on intent, education, and trust—then "
            "validate with your own Search Console and site analytics."
        )
    return f"{summary} {narrative}".strip()


def uk_market_search_insights() -> dict:
    """Aggregated UK market/search lens from all module payloads (deterministic; no external APIs)."""
    modules = _module_base()
    overview = (
        "This view summarises UK-oriented market intelligence across modules: demand and formats, "
        "audiences, content, peer patterns, opportunities, SEO, plus a focused competitive benchmark "
        "of Harmony Jewels vs three named peers. Indices are directional and modelled unless "
        "first-party tools are connected; use Search Console and your analytics for live query and rank data."
    )
    by_module = [
        {
            "module_key": m["key"],
            "title": m["title"],
            "insight": _uk_search_insight_for_module(m),
        }
        for m in modules
    ]
    return {"overview": overview, "by_module": by_module}


def _module_base() -> list[dict]:
    """Six differentiated modules for landing pages and home (UK market and peer intelligence)."""
    return MARKET_MODULES


def module_sections() -> list[dict]:
    return _module_base()


def confidence_and_provenance() -> list[dict]:
    now = datetime.now(timezone.utc).isoformat()
    return [
        {
            "confidence": 0.86,
            "source": "harmony_cmo_engine",
            "collected_at": now,
            "refreshed_at": now,
            "freshness_sla": "daily",
        }
    ]


def get_module_landing(module_key: str) -> dict | None:
    for m in _module_base():
        if m["key"] == module_key:
            return m
    return None


def website_analysis() -> dict:
    return {
        "products": {
            "core": [
                "Bespoke engagement rings",
                "Wedding bands",
                "Lab-grown and natural diamond jewellery",
                "Custom fine jewellery",
            ],
            "keyStyles": ["Oval", "Radiant", "Cushion", "Emerald", "Round"],
        },
        "journey": {
            "steps": [
                "Book consultation",
                "Select setting or diamond",
                "Discuss certification, pricing, and design details",
                "Approve bespoke concept",
                "Production and delivery/collection",
            ],
            "model": "consultation-driven",
        },
        "tone": {
            "voice": "Luxury, emotional, trust-first, craftsmanship-led",
            "signals": ["Hatton Garden heritage", "Transparency", "No pressure guidance"],
        },
        "pricing": {
            "positioning": "Premium with transparency",
            "notes": [
                "Natural and lab-grown options for budget-fit luxury",
                "Pricing influenced by diamond and precious metal markets",
            ],
        },
    }


def seo_implementation() -> dict:
    return {
        "primaryKeyword": "engagement rings london",
        "timeline": "30-90 days",
        "actions": [
            {
                "step": "Optimise title tags and headings for local buyer intent",
                "tools": ["Google Search Console", "Screaming Frog", "CMS editor"],
                "expectedImpact": "Higher CTR and improved average ranking in 2-6 weeks",
            },
            {
                "step": "Add LocalBusiness, Product, and FAQ schema to high-intent pages",
                "tools": ["Schema generator", "Rich Results Test"],
                "expectedImpact": "Improved SERP visibility and trust signals",
            },
        ],
    }


def report_center() -> dict:
    return {
        "weekly_snapshot": {
            "period": "Last 7 days",
            "highlights": ["Consultation intent +11%", "SEO average rank improved from 15.4 to 13.2"],
        },
        "monthly_comparison": {
            "current_month": {"organic_sessions": 1240, "consultation_rate": 3.8, "avg_rank": 13.2},
            "previous_month": {"organic_sessions": 1010, "consultation_rate": 3.2, "avg_rank": 16.9},
        },
        "decision_logs": [],
    }


def run_agent(agent_id: str, objective: str, context: dict) -> dict:
    persona = {
        "trend_analysis_agent": "Trend momentum is strongest in proposal-story content and local intent pages.",
        "content_generation_agent": "Emotion-led storytelling with transparency language performs best in consultation conversion.",
        "seo_organic_strategy_agent": "Local SEO gains are available through intent page depth and schema completeness.",
    }.get(agent_id, "Multi-signal opportunity detected across social intent and search behavior.")
    return {
        "signal": persona,
        "reasoning": f"Objective '{objective}' was evaluated against current KPI and recency windows with UK luxury filters.",
        "recommendation": "Prioritise high-intent engagement ring journeys, then reinforce with local SEO pages and proof-led creatives.",
        "impact_estimate": "Expected +8-15% consultation intent in 30 days if executed with weekly iteration.",
        "confidence": 0.84,
        "provenance": [
            {
                "source": "fastapi_agent_engine",
                "agent_id": agent_id,
                "context_keys": list(context.keys()),
            }
        ],
    }
