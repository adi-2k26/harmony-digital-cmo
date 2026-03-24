from __future__ import annotations

import json
from typing import Any

from config import settings


def get_openai_client() -> Any | None:
    if not settings.openai_api_key:
        return None
    try:
        from openai import OpenAI  # type: ignore

        return OpenAI(api_key=settings.openai_api_key)
    except Exception:
        return None


def generate_agent_deep_dive_json(agent_id: str, agent_name: str, objective: str | None) -> dict[str, Any]:
    """Returns structured deep-dive; raises on API failure."""
    client = get_openai_client()
    if not client:
        raise RuntimeError("OpenAI client unavailable")

    user_obj = objective or "Explain operator value, UK luxury jewellery context, and next steps for marketing_ops."
    prompt = f"""You are documenting an internal AI agent for Harmony Jewels London (Hatton Garden, bespoke luxury jewellery, UK market).
Agent id: {agent_id}
Agent name: {agent_name}
User focus: {user_obj}

Return strictly valid JSON only (no markdown fences) with this exact shape:
{{
  "title": "string",
  "problem": "string",
  "signals": ["string"],
  "recommendations": ["string"],
  "next_steps": ["string"],
  "limitations": ["string"],
  "brand_alignment": "string",
  "provenance_note": "string stating content is model-generated guidance not live metrics"
}}

Rules:
- UK English. Luxury, trust, transparency tone. No invented statistics or revenue claims.
- Reference jewellery categories: engagement rings, wedding bands, bespoke where relevant.
- Do not claim real-time TikTok/Meta/Google data unless framed as illustrative."""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": "Return strictly valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.25,
    )
    text = response.choices[0].message.content
    if not text:
        raise RuntimeError("Empty OpenAI response")
    text = text.strip()
    return json.loads(text)


def generate_module_deep_dive_json(
    module_key: str, module_payload: dict[str, Any], objective: str | None
) -> dict[str, Any]:
    """Long-form structured module analysis; raises on API failure."""
    client = get_openai_client()
    if not client:
        raise RuntimeError("OpenAI client unavailable")

    focus = objective or (
        "Produce a thorough UK market and marketing operations analysis for the marketing team. "
        "Reference peer behaviour, SEO/content implications where relevant."
    )
    payload_json = json.dumps(module_payload, ensure_ascii=False, indent=2)[:24000]

    prompt = f"""You are a senior UK luxury jewellery marketing strategist (Harmony Jewels London context: Hatton Garden, bespoke, trust-first).

Module key: {module_key}

The following JSON is the curated module payload from our intelligence platform (indices may be illustrative; not live feeds unless stated). Use it as the ONLY factual anchor for module scope and numbers—do not invent statistics, revenue, or rankings.

--- MODULE PAYLOAD ---
{payload_json}
--- END ---

User focus / extra instructions: {focus}

Return strictly valid JSON only (no markdown fences) with this exact shape:
{{
  "executive_summary": "string — 3–5 sentences for executives",
  "detailed_analysis": "string — multiple long paragraphs (plain text, use \\n\\n between paragraphs). Cover UK market dynamics, buyer behaviour, and practical marketing implications.",
  "peer_or_market_notes": "string — how peers or the wider UK market typically behave in this area",
  "risks_and_limitations": "string — what this module cannot prove and how to validate with first-party data",
  "recommended_actions": ["string", "..."],
  "provenance_note": "string — states content is model-generated guidance grounded on the payload above, not live platform APIs unless explicitly connected"
}}

Rules:
- UK English. Luxury, calm, transparent tone.
- Do not invent statistics, revenue figures, or exact competitor rankings.
- If the payload lacks a detail, say what is unknown rather than guessing.
- recommended_actions: 5–8 specific, actionable bullets for the marketing team."""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": "Return strictly valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.28,
        max_tokens=4096,
    )
    text = response.choices[0].message.content
    if not text:
        raise RuntimeError("Empty OpenAI response")
    text = text.strip()
    return json.loads(text)


def generate_detailed_market_intelligence(
    module_key: str,
    module_payload: dict[str, Any],
    trends_payload: dict[str, Any],
    research_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Structured UK market intelligence (no single-retailer focus). Raises on API failure."""
    client = get_openai_client()
    if not client:
        raise RuntimeError("OpenAI client unavailable")

    mod_json = json.dumps(module_payload, ensure_ascii=False, indent=2)[:12000]
    trends_json = json.dumps(trends_payload, ensure_ascii=False, indent=2)[:8000]
    rc = research_context or {}
    prov = rc.get("provenance_banner", "")
    syn = rc.get("synthesis_guidance", "")

    prompt = f"""You are a UK luxury jewellery market analyst. Output is for a marketing team studying the **whole UK category**, not one named retailer.

Module: {module_key}

PROVENANCE (must respect in every field):
{prov}

SYNTHESIS GUIDANCE (analytical angles — not live feeds):
{syn}

MODULE PAYLOAD (curated platform data; indices may be illustrative):
{mod_json}

GOOGLE TRENDS / LIVE SNAPSHOT (UK — may be partial if Trends failed; say so in risk_and_confidence):
{trends_json}

Return strictly valid JSON only (no markdown fences) with this exact shape:
{{
  "executive_summary": "string — 6–10 sentences; lead with Trends + payload facts, then high-level implications",
  "market_signal_breakdown": "string — multiple long paragraphs (use \\n\\n). Include: (1) what Google Trends shows for UK demand; (2) search-channel angle as analytical synthesis; (3) organic social angle as synthesis; (4) trade/industry signals as synthesis; (5) news/media lens as synthesis. Label synthesis paragraphs clearly as interpretation, not live data.",
  "segment_or_intent_analysis": "string — at least 4 paragraphs on buyer segments and intent; ground specifics in Trends/payload where possible",
  "peer_pattern_notes": "string — at least 3 paragraphs; generic category behaviour, no invented rankings",
  "risk_and_confidence": "string — limitations, data gaps, what needs Search Console, CRM, or paid tools",
  "recommended_actions": ["string", "..."],
  "source_provenance": {{
    "notes": "string — how module payload, Trends, and synthesis paragraphs were used",
    "trends_status": "string"
  }}
}}

Rules:
- UK English. Ground quantitative claims in Trends or payload only; synthesis paragraphs must state they are analytical, not scraped feeds.
- Do not invent revenue, rankings, or share statistics.
- recommended_actions: 8–12 bullets for marketing/creative/SEO teams.
- Do not centre Harmony Jewels; speak category-wide unless comparing peer patterns generically."""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": "Return strictly valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.25,
        max_tokens=8192,
    )
    text = response.choices[0].message.content
    if not text:
        raise RuntimeError("Empty OpenAI response")
    return json.loads(text.strip())


def generate_competitive_benchmark_intelligence(
    module_payload: dict[str, Any],
    trends_payload: dict[str, Any],
    research_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Harmony vs three named peers — structured market fields plus benchmark_dashboard for UI charts.
    """
    client = get_openai_client()
    if not client:
        raise RuntimeError("OpenAI client unavailable")

    mod_json = json.dumps(module_payload, ensure_ascii=False, indent=2)[:12000]
    trends_json = json.dumps(trends_payload, ensure_ascii=False, indent=2)[:8000]
    rc = research_context or {}
    prov = rc.get("provenance_banner", "")
    syn = rc.get("synthesis_guidance", "")

    prompt = f"""You are a UK luxury jewellery CMO advisor. Produce a competitive benchmark for **Harmony Jewels**
(London / Hatton Garden, bespoke luxury jewellery) vs these **three peers only**:
- Queensmith
- Flawless Fine Jewellery
- 77 Diamonds

PROVENANCE (must respect):
{prov}

SYNTHESIS GUIDANCE:
{syn}

MODULE PAYLOAD:
{mod_json}

GOOGLE TRENDS SNAPSHOT (UK — may be partial; say so in risk_and_confidence):
{trends_json}

Return strictly valid JSON only (no markdown fences). Include the standard narrative fields below PLUS
`benchmark_dashboard` for dashboards. Use these criterion ids exactly (12 criteria):
brand_positioning, offer_architecture, pricing_transparency, showroom_journey, content_creative,
organic_search, paid_media_posture, social_community, trust_credibility, ux_conversion,
local_london_relevance, innovation_measurement.

Shape:
{{
  "executive_summary": "string — 8–14 sentences; name all four brands; lead with strategic headline for Harmony",
  "market_signal_breakdown": "string — multiple paragraphs separated by \\n\\n; UK demand + category context; cite Trends where relevant and label synthesis otherwise",
  "segment_or_intent_analysis": "string — buyer segments and intent differences across the four brands (synthesis)",
  "peer_pattern_notes": "string — at least 4 paragraphs on how Queensmith, Flawless Fine Jewellery, and 77 Diamonds typically show up in market narrative (synthesis; no fabricated financials)",
  "risk_and_confidence": "string — data limits, what requires first-party validation, Trends caveats",
  "recommended_actions": ["string", "..."],
  "source_provenance": {{
    "notes": "string",
    "trends_status": "string"
  }},
  "benchmark_dashboard": {{
    "brands": [
      {{"id": "harmony", "label": "Harmony Jewels", "role": "harmony"}},
      {{"id": "queensmith", "label": "Queensmith", "role": "peer"}},
      {{"id": "flawless", "label": "Flawless Fine Jewellery", "role": "peer"}},
      {{"id": "diamonds77", "label": "77 Diamonds", "role": "peer"}}
    ],
    "criteria": [
      {{"id": "brand_positioning", "label": "Brand & positioning", "description": "short"}},
      {{"id": "offer_architecture", "label": "Offer & collections", "description": "short"}},
      {{"id": "pricing_transparency", "label": "Pricing & transparency", "description": "short"}},
      {{"id": "showroom_journey", "label": "Showroom & consultation journey", "description": "short"}},
      {{"id": "content_creative", "label": "Content & creative", "description": "short"}},
      {{"id": "organic_search", "label": "Organic search & SERP", "description": "short"}},
      {{"id": "paid_media_posture", "label": "Paid media posture", "description": "short"}},
      {{"id": "social_community", "label": "Social & community", "description": "short"}},
      {{"id": "trust_credibility", "label": "Trust & credibility", "description": "short"}},
      {{"id": "ux_conversion", "label": "UX & conversion paths", "description": "short"}},
      {{"id": "local_london_relevance", "label": "Local / London relevance", "description": "short"}},
      {{"id": "innovation_measurement", "label": "Innovation & measurement maturity", "description": "short"}}
    ],
    "scores": {{
      "harmony": {{ "brand_positioning": {{"score": 0, "rationale": "string", "confidence": "high|medium|low"}}, "...each criterion id..." }},
      "queensmith": {{ }},
      "flawless": {{ }},
      "diamonds77": {{ }}
    }},
    "harmony_swot": {{
      "strengths": ["string"],
      "gaps": ["string"],
      "opportunities": ["string"]
    }},
    "peer_highlights": {{
      "queensmith": ["string"],
      "flawless": ["string"],
      "diamonds77": ["string"]
    }},
    "initiatives": [
      {{
        "title": "string",
        "rationale": "string",
        "impact": "high|medium|low",
        "effort": "high|medium|low",
        "owner_hint": "string"
      }}
    ]
  }}
}}

Rules:
- Scores are integers 0–100 per brand per criterion. Be consistent: higher = stronger for that criterion.
- Fill every criterion for every brand in scores with score, rationale (1–2 sentences), confidence.
- recommended_actions: 10–14 bullets prioritised for Harmony; initiatives: 8–12 items sorted by impact vs effort.
- Do not invent revenue, market share, or exact competitor rankings from APIs.
- UK English. Respectful tone toward all brands."""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": "Return strictly valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.25,
        max_tokens=8192,
    )
    text = response.choices[0].message.content
    if not text:
        raise RuntimeError("Empty OpenAI response")
    return json.loads(text.strip())


def generate_seo_harmony_strategy(
    seo_module_payload: dict[str, Any],
    trends_payload: dict[str, Any],
    prior_market_outputs: list[dict[str, Any]],
    research_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """SEO agent: Harmony-specific strategy after market context. Raises on API failure."""
    client = get_openai_client()
    if not client:
        raise RuntimeError("OpenAI client unavailable")

    seo_json = json.dumps(seo_module_payload, ensure_ascii=False, indent=2)[:8000]
    trends_json = json.dumps(trends_payload, ensure_ascii=False, indent=2)[:6000]
    prior_json = json.dumps(prior_market_outputs, ensure_ascii=False, indent=2)[:16000]
    rc = research_context or {}
    prov = rc.get("provenance_banner", "")
    syn = rc.get("synthesis_guidance", "")

    prompt = f"""You are the SEO & organic strategy lead for **Harmony Jewels** (Hatton Garden, London, UK luxury jewellery). Prior steps analysed the **overall UK market**; your job is a **Harmony-specific** implementation plan that improves visibility **if** executed, without guaranteeing rankings.

PROVENANCE:
{prov}

SYNTHESIS GUIDANCE (for market_signal_breakdown — analytical angles, not live feeds):
{syn}

SEO / peer module payload:
{seo_json}

Google Trends snapshot:
{trends_json}

PRIOR MARKET AGENT OUTPUTS (may be empty — if empty, say market context came from module snapshots only):
{prior_json}

Return strictly valid JSON only (no markdown fences) with this exact shape:
{{
  "executive_summary": "string",
  "market_signal_breakdown": "string — recap UK market context used",
  "segment_or_intent_analysis": "string — intents Harmony should own",
  "peer_pattern_notes": "string — SERP patterns to respect",
  "risk_and_confidence": "string — GSC required for URL truth, etc.",
  "recommended_actions": ["string"],
  "source_provenance": {{"notes": "string", "trends_status": "string"}},
  "market_context_used": "string — what you took from prior agents",
  "harmony_priority_playbook": "string — pillars and pages to prioritise",
  "implementation_plan_30_60_90": "string — week-by-week style plan",
  "expected_visibility_impact_assumptions": "string — qualitative, no fake numbers"
}}

Rules:
- UK English. No fabricated traffic or rank numbers.
- Be explicit when prior agent outputs were missing.
- market_signal_breakdown: use multiple paragraphs; include how search/social/trade/news angles inform SEO alongside Trends (label synthesis clearly).
- actionable for Harmony’s site and content."""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": "Return strictly valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.28,
        max_tokens=8192,
    )
    text = response.choices[0].message.content
    if not text:
        raise RuntimeError("Empty OpenAI response")
    return json.loads(text.strip())


def generate_full_analysis_narrative(
    module_key: str,
    module_payload: dict[str, Any],
    trends_payload: dict[str, Any],
    structured_output: dict[str, Any],
    objective: str | None,
    *,
    is_seo: bool = False,
    is_benchmark: bool = False,
) -> dict[str, Any]:
    """
    Long-form narrative that builds on structured intelligence (not a duplicate of raw Trends JSON).
    Same JSON shape as module deep dive for UI reuse.
    """
    client = get_openai_client()
    if not client:
        raise RuntimeError("OpenAI client unavailable")

    focus = objective or (
        "Expand on the structured analysis with practical guidance for the marketing team; avoid repeating it verbatim."
    )
    mod_json = json.dumps(module_payload, ensure_ascii=False, indent=2)[:16000]
    trends_json = json.dumps(trends_payload, ensure_ascii=False, indent=2)[:6000]
    struct_json = json.dumps(structured_output, ensure_ascii=False, indent=2)[:14000]

    if is_benchmark:
        brand_line = (
            "This module compares Harmony Jewels with Queensmith, Flawless Fine Jewellery, and 77 Diamonds only. "
            "Centre Harmony as the client; be specific about differentiation and initiatives."
        )
    elif is_seo:
        brand_line = "Harmony Jewels is the client for SEO-specific narrative sections when is_seo is true."
    else:
        brand_line = "Keep category-wide tone; do not centre Harmony unless comparing generic peer patterns."

    prompt = f"""You are a senior UK luxury jewellery marketing strategist.

Module: {module_key}
{brand_line}

You already have a STRUCTURED MARKET INTELLIGENCE JSON (from the same run). Use it as the primary reasoning anchor. The Google Trends JSON provides live search-interest context. Do NOT paste raw JSON. Write fresh narrative prose.

--- MODULE PAYLOAD ---
{mod_json}
--- STRUCTURED OUTPUT (same run) ---
{struct_json}
--- GOOGLE TRENDS SNAPSHOT ---
{trends_json}

User focus: {focus}

Return strictly valid JSON only (no markdown fences) with this exact shape:
{{
  "executive_summary": "string — 4–7 sentences tying structured insights to actions",
  "detailed_analysis": "string — many paragraphs separated by \\n\\n (minimum 800 words total). Cover implications, cadence, and how teams should use the structured report.",
  "peer_or_market_notes": "string — category and peer patterns",
  "risks_and_limitations": "string — what remains uncertain; how to validate",
  "recommended_actions": ["string", "..."],
  "provenance_note": "string — model-generated; grounded on structured output and Trends; synthesis is not live social/news scraping"
}}

Rules:
- UK English. Luxury, calm, transparent. No invented revenue or rank numbers.
- recommended_actions: 6–10 bullets, distinct from but complementary to structured recommended_actions where possible.
- If benchmark module: tie recommendations to initiatives and benchmark_dashboard gaps; name peers explicitly where useful."""

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": "Return strictly valid JSON only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.28,
        max_tokens=8192,
    )
    text = response.choices[0].message.content
    if not text:
        raise RuntimeError("Empty OpenAI response")
    return json.loads(text.strip())


def probe_openai_minimal() -> tuple[bool, str | None]:
    """
    One minimal chat completion to verify API key, model access, and network.
    Returns (success, error_message).
    """
    client = get_openai_client()
    if not client:
        return False, "OPENAI_API_KEY not set or client init failed"
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "Reply with the single word: pong"},
                {"role": "user", "content": "ping"},
            ],
            max_tokens=8,
            temperature=0,
        )
        text = (response.choices[0].message.content or "").strip().lower()
        if not text:
            return False, "Empty completion content"
        return True, None
    except Exception as exc:  # noqa: BLE001 — surface provider errors to health probe
        return False, str(exc)
