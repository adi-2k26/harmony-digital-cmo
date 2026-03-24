"""Static research framing for intelligence prompts (no live APIs beyond Google Trends in v1)."""

from __future__ import annotations

from typing import Any


PROVENANCE_BANNER = (
    "Live data in this run comes from Google Trends (UK) and your module snapshot where noted. "
    "Separate paragraphs labelled as analytical synthesis describe how search, social, trade, and news "
    "angles *typically* apply in UK luxury jewellery—they are reasoned interpretation, not scraped feeds."
)

BENCHMARK_PROVENANCE_BANNER = (
    "This competitive benchmark compares Harmony Jewels with Queensmith, Flawless Fine Jewellery, and 77 Diamonds. "
    "Live search-interest context comes from Google Trends (UK) where available. "
    "Brand-by-brand scores and peer notes are model synthesis grounded on public positioning patterns—"
    "not a live crawl of competitor sites or ad accounts. Validate priorities with your analytics, "
    "Search Console, and first-party research."
)


def build_research_context(module_key: str) -> dict[str, Any]:
    """
    Returns metadata used in prompts only (no external calls).
    """
    if module_key == "brand_benchmark":
        return {
            "module_key": module_key,
            "provenance_banner": BENCHMARK_PROVENANCE_BANNER,
            "synthesis_guidance": (
                "Compare the four named UK jewellery brands using CMO-relevant lenses. "
                "Do not claim secret metrics, revenue, or live rankings. "
                "Where you infer from typical market behaviour, label it as synthesis. "
                "Highlight differentiation opportunities for Harmony Jewels without defaming competitors."
            ),
        }
    return {
        "module_key": module_key,
        "provenance_banner": PROVENANCE_BANNER,
        "synthesis_guidance": (
            "For each of search, organic social, trade/industry, and mainstream news: explain what kinds of "
            "signals marketers usually watch in UK luxury jewellery, how they complement Google Trends, and "
            "what cannot be inferred without first-party or paid tools. Never imply real-time access to those feeds."
        ),
    }
