"""Google Trends (pytrends) adapter — UK geo, manual runs only."""

from __future__ import annotations

import json
from datetime import datetime, timezone
import time
from typing import Any


# Curated UK search terms per module (jewellery category)
MODULE_TREND_KEYWORDS: dict[str, list[str]] = {
    "trend": ["engagement ring", "bespoke jewellery", "diamond ring UK"],
    "audience": ["engagement rings London", "jewellery shop appointment"],
    "content": ["proposal ring ideas", "wedding band styles"],
    "competitor": ["Hatton Garden jeweller", "luxury jewellery UK"],
    "opportunity": ["engagement rings near me", "custom engagement ring"],
    "seo": ["engagement rings London", "bespoke engagement ring", "lab grown diamond ring"],
    "brand_benchmark": [
        "Queensmith jewellery",
        "77 Diamonds",
        "Flawless Fine Jewellery",
        "Hatton Garden bespoke ring",
    ],
}

_CACHE_TTL_SECONDS = 300.0
_MAX_ATTEMPTS = 3
_BACKOFF_SECONDS = (0.8, 1.6)
_TRENDS_CACHE: dict[str, dict[str, Any]] = {}


def _copy_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return json.loads(json.dumps(payload))


def _cache_get(module_key: str) -> dict[str, Any] | None:
    rec = _TRENDS_CACHE.get(module_key)
    if not rec:
        return None
    expires_at = float(rec.get("expires_at", 0.0))
    if time.time() >= expires_at:
        _TRENDS_CACHE.pop(module_key, None)
        return None
    payload = rec.get("payload")
    if not isinstance(payload, dict):
        return None
    return _copy_payload(payload)


def _cache_set(module_key: str, payload: dict[str, Any]) -> None:
    _TRENDS_CACHE[module_key] = {
        "expires_at": time.time() + _CACHE_TTL_SECONDS,
        "payload": _copy_payload(payload),
    }


def fetch_google_trends_payload(module_key: str) -> dict[str, Any]:
    """
    Returns interest-over-time style data for GB. On failure, returns structured
    fallback with source=unavailable so callers never crash.
    """
    keywords = MODULE_TREND_KEYWORDS.get(module_key, ["jewellery UK", "engagement ring"])
    collected_at = datetime.now(timezone.utc).isoformat()
    out: dict[str, Any] = {
        "source": "google_trends",
        "geo": "GB",
        "keywords": keywords,
        "timeframe": "now 7-d",
        "collected_at": collected_at,
        "interest_over_time": None,
        "related_queries": None,
        "error": None,
    }
    attempts = 0
    last_error = ""
    while attempts < _MAX_ATTEMPTS:
        attempts += 1
        try:
            from pytrends.request import TrendReq  # type: ignore

            pytrends = TrendReq(hl="en-GB", tz=0)
            pytrends.build_payload(keywords[:5], cat=0, timeframe="now 7-d", geo="GB", gprop="")
            iot = pytrends.interest_over_time()
            if iot is not None and not iot.empty:
                # compact serialisable summary
                out["interest_over_time"] = json.loads(iot.tail(14).to_json(orient="split", date_format="iso"))
            try:
                rq = pytrends.related_queries()
                if isinstance(rq, dict):
                    simplified: dict[str, Any] = {}
                    for kw, block in rq.items():
                        if isinstance(block, dict) and block.get("top") is not None:
                            df = block["top"]
                            simplified[str(kw)] = df.head(5).to_dict("records") if hasattr(df, "head") else None
                    out["related_queries"] = simplified or None
            except Exception:
                out["related_queries"] = None
            out["attempts"] = attempts
            if out.get("interest_over_time") is not None:
                _cache_set(module_key, out)
            return out
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
            if attempts < _MAX_ATTEMPTS:
                time.sleep(_BACKOFF_SECONDS[min(attempts - 1, len(_BACKOFF_SECONDS) - 1)])

    cached = _cache_get(module_key)
    if cached:
        cached["source"] = "google_trends_cached_fallback"
        cached["collected_at"] = collected_at
        cached["error"] = last_error
        cached["cache_status"] = "hit"
        cached["notice"] = "Live Trends temporarily rate-limited, using latest cached snapshot."
        cached["attempts"] = attempts
        return cached

    out["source"] = "google_trends_unavailable"
    out["error"] = last_error or "Unknown Trends error"
    out["attempts"] = attempts
    out["cache_status"] = "miss"
    return out
