#!/usr/bin/env python3
"""Quick check that the running FastAPI exposes unified analysis routes (run from repo after starting the API)."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.getenv("FASTAPI_SMOKE_URL", "http://127.0.0.1:8001").rstrip("/")
REQUIRED_PATHS = (
    "/agents/{agent_id}/run-full-analysis",
    "/agents/{agent_id}/run-detailed",
    "/agents/runs",
)


def main() -> int:
    url = f"{BASE}/openapi.json"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        print(f"FAIL: could not GET {url}: {e}", file=sys.stderr)
        print("Start FastAPI first: npm run dev:api-fastapi (from repo root)", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"FAIL: {e}", file=sys.stderr)
        return 1

    paths = set((data.get("paths") or {}).keys())
    missing = [p for p in REQUIRED_PATHS if p not in paths]
    if missing:
        print("FAIL: OpenAPI is missing expected routes:", file=sys.stderr)
        for p in missing:
            print(f"  - {p}", file=sys.stderr)
        print(f"Served paths sample: {sorted(paths)[:12]}...", file=sys.stderr)
        print(
            "Wrong app on this port? Stop other Python servers and run from services/api-fastapi only.",
            file=sys.stderr,
        )
        return 1

    print(f"OK: {BASE} exposes run-full-analysis and related routes.")

    mod_url = f"{BASE}/health/modules"
    try:
        with urllib.request.urlopen(mod_url, timeout=10) as resp:
            mod = json.loads(resp.read().decode())
    except urllib.error.URLError as e:
        print(f"FAIL: could not GET {mod_url}: {e}", file=sys.stderr)
        return 1
    if not mod.get("brand_benchmark_registered"):
        print("FAIL: /health/modules reports brand_benchmark_registered=false — wrong or stale FastAPI.", file=sys.stderr)
        print(f"  module_keys: {mod.get('module_keys')}", file=sys.stderr)
        return 1

    print(f"OK: {BASE}/health/modules includes brand_benchmark (run-full-analysis will accept it).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
