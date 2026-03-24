# Harmony Jewels Digital CMO Platform

Hybrid multi-agent platform for UK luxury jewellery growth intelligence and execution.

## Monorepo Structure

- `apps/web` - Executive dashboard (Next.js).
- `apps/api` - Orchestration and API layer (NestJS-style TypeScript service).
- `services/api-fastapi` - Enterprise API backend (FastAPI).
- `services/ai-workers` - Python workers for AI and data processing.
- `packages/schemas` - Shared data contracts and taxonomy.
- `infra` - Local infrastructure (PostgreSQL, Redis, observability).

## Core Pipeline

`collect -> validate -> filter -> analyze -> store -> publish`

## Getting Started

1. Install dependencies from repo root:
   - `npm install`
   - Python (FastAPI): `pip install -r services/api-fastapi/requirements.txt` for the same interpreter you use with `npm run dev:api-fastapi` (needs `openai` and `python-dotenv`).
2. Start infra:
   - `docker compose -f infra/docker-compose.yml up -d`
3. Start apps:
   - `npm run dev:api-fastapi` — runs **from `services/api-fastapi`** so `main.py` is unambiguous (do not point uvicorn at another repo’s `main:app`).
   - `npm run dev:web`
   - `npm run dev:workers`
4. After FastAPI is listening, verify the correct app is on port **8001**:
   - `npm run smoke:api-fastapi` — fails if `/agents/{agent_id}/run-full-analysis` is missing (usually means a **stale** or **wrong** Python process still bound to `8001`; stop those processes and start again).

## Notes

- All content and intelligence are filtered for UK jewellery relevance.
- Brand DNA guardrails enforce Harmony Jewels luxury tone.
- Single-provider mode supported via one OpenAI API key (`OPENAI_API_KEY`).
- Frontend defaults to FastAPI at `http://localhost:8001` unless `NEXT_PUBLIC_API_BASE_URL` is overridden.

## Vercel hosting (web + Python full parity)

This repo can run as a single Vercel project:

- Next.js app from `apps/web`
- Python FastAPI function at `api/harmony/[...path].py`
- `vercel.json` rewrite: `/harmony-api/*` -> `/api/harmony/*`

### Required Vercel environment variables

- `DATABASE_URL` (managed Postgres; required for persisted runs/actions parity)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional override)
- `REDIS_URL` (optional; only if `ENABLE_BACKGROUND_JOBS=true`)
- `ENABLE_BACKGROUND_JOBS` (`false` by default)
- `RUN_FULL_ANALYSIS_TIMEOUT_MS` (default `280000`)
- `NEXT_PUBLIC_API_BASE_URL` and `API_INTERNAL_URL` are optional when using in-project `/harmony-api` rewrite

### Behavior parity notes

- `actions` and `agent_intelligence_run` are DB-authoritative in hosted/serverless runtime.
- In-memory action fallback remains for local development only.
- `POST /api/agents/{id}/run-full-analysis` includes timeout-safe 504 messaging for serverless limits.

### Vercel parity validation checklist

After deploy (Preview first), verify:

1. Endpoint parity
   - `GET /harmony-api/health`
   - `GET /harmony-api/health/modules`
   - `GET /harmony-api/openapi.json` includes `/agents/{agent_id}/run-full-analysis`
2. Run lifecycle parity
   - Run full analysis for `trend`, `seo`, `brand_benchmark`
   - `GET /harmony-api/agents/runs` returns persisted rows
   - `PATCH /harmony-api/agents/runs/{run_id}/select` updates dashboard inclusion
3. UI parity
   - Home shows all module cards in expected order
   - Competitive benchmark page renders charts and allows PDF/PNG export
   - Dashboard selected-runs panel reflects select/deselect changes

## FastAPI endpoints (primary backend)

- `GET /health` — liveness
- `GET /health/modules` — lists `module_keys` accepted by `POST /agents/{agent_id}/run-full-analysis` (derived from `MARKET_MODULES`); check `brand_benchmark_registered` is true if Competitive benchmark fails with “Unknown intelligence agent”
- `GET /health/openai` — whether `OPENAI_API_KEY` is loaded; add `?probe=true` for a minimal live OpenAI call (few tokens)
- `GET /system/status` — DB / queue / workers
- `GET /dashboards/enterprise` — KPIs, module sections, actions, plus optional narrative fields:
  - **`kpi_explanations`** — plain-language strings for `consultation_intent_score`, `organic_growth_percent`, `engagement_quality_score`, `avg_rank_position`
  - **`dashboard_intro`** — intro copy for the dashboard UI (neutral UK market + search / peer lens, not retailer-specific)
  - **`dashboard_chart_captions`** — how to read the engagement, SEO, and platform charts
  - **`data_scope_banner`** — clarifies that headline KPIs may blend UK market/category proxies with your observation snapshots when DB data exists
  - **`uk_market_search_overview`** — executive paragraph: UK generic search and market intent across modules (aggregated, deterministic from module payloads)
  - **`uk_market_search_by_module`** — list of `{ module_key, title, insight }` — per-module UK search / SERP / intent angle for the dashboard report
  - **`selected_intelligence_runs`** — completed click-to-run intelligence outputs **selected for the dashboard** (see routes below)
  - **`generated_at`** — ISO timestamp when the dashboard payload was assembled (for “Last updated” in the UI)
  - **`module_sections[]`** — each module may include **`purpose_note`**, **`detailed_insights`**, **`metric_explanations`**, **`research_sources`** (`label`, `scope`, `kind`, optional `detail`), and **`application_note`** (how to apply insights to your brand)
- `GET /dashboards/recent-vs-new`, `GET /dashboards/drilldown`
- `GET /modules/{module_key}` — same curated module object as in `module_sections` (includes purpose note, insights, metric explanations, optional `metric_display_name` for UI labels)
- `POST /modules/{module_key}/deep-dive` — **on-demand** OpenAI long-form analysis of a module (JSON body optional `{ "objective": "..." }`); same env as agent deep dives. One request per click (no auto-run on page load). Response shape: `available`, `source`, `content` (sections such as `executive_summary`, `detailed_analysis`, `peer_or_market_notes`, `risks_and_limitations`, `recommended_actions`, `provenance_note`), or `message` on failure / when `OPENAI_API_KEY` is unset
- The Next.js app exposes **`POST /api/modules/{module_key}/deep-dive`**, which **proxies** to the FastAPI route above (same JSON). Use this from the browser so the request always reaches FastAPI via the server; set `NEXT_PUBLIC_API_BASE_URL` (and in Docker optionally **`API_INTERNAL_URL`**) to the FastAPI origin.
- **Primary flow:** **`POST /api/agents/{agent_id}/run-full-analysis`** → FastAPI **`POST /agents/{agent_id}/run-full-analysis`** with optional JSON `{ "objective": "..." }`. One click runs **Google Trends + structured intelligence + long-form narrative** in a single agent run. Output is stored as `{ "structured", "narrative_brief", "provenance_banner" }` (search/social/trade/news “layers” in copy are **model synthesis** with a fixed disclaimer—not live scraped feeds—unless you add connectors later).
- **Legacy:** **`POST /api/agents/{agent_id}/run-detailed`** → **`POST /agents/{agent_id}/run-detailed`** (structured only) and **`POST /modules/{module_key}/deep-dive`** still exist for tests or older clients.
- `GET /agents/catalog` — seven agents (full curated fields)
- `GET /agents/runs` — list logged **click-to-run market intelligence** executions (`?selected_only=true` for dashboard-selected completed runs). Register this route **before** `/agents/{agent_id}` in clients that enumerate paths.
- `PATCH /agents/runs/{run_id}/select` — body `{ "selected": true|false }` to show/hide a run on the dashboard
- `POST /agents/{agent_id}/run-full-analysis` — **recommended** full run: same `agent_id` rules as below; **Trends → structured JSON → narrative brief** in one persisted run. Optional body `{ "objective": "..." }` steers the narrative. Requires `OPENAI_API_KEY`.
- `POST /agents/{agent_id}/run-detailed` — **structured-only** market intelligence run: `agent_id` is a **module key** (`trend`, `audience`, `content`, `competitor`, `opportunity`, `seo`) or mapped catalog id (`seo_organic_strategy_agent` → `seo`, `trend_analysis_agent` → `trend`, `content_generation_agent` → `content`). Fetches **Google Trends** (GB) + module payload, then OpenAI structured JSON (category-wide; **SEO** adds Harmony-specific fields using prior selected runs when available). Requires `OPENAI_API_KEY`.
- `GET /agents/{agent_id}` — single agent documentation
- `POST /agents/{agent_id}/deep-dive` — optional OpenAI deep dive (requires `OPENAI_API_KEY` in the API process env)
- `GET /seo/implementation-engine`, `GET /reports/center`, `GET /website/analysis`, `GET /actions`, `PATCH /actions/{id}/status`

Put `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in the repo root `.env` — FastAPI loads it automatically — or export them in the shell before `npm run dev:api-fastapi` so **agent** (`POST /agents/{id}/deep-dive`) and **module** (`POST /modules/{module_key}/deep-dive`) deep dives can generate.

### Exporting PDFs and charts (web)

- After a **completed** full analysis, each module’s **Your analysis** section includes **Download colorful PDF** (structured + narrative text).
- **Competitive benchmark** (`/brand-benchmark`): the PDF **adds extra pages at the end** with the three ECharts figures (radar, grouped bar, heatmap) embedded as images. Use **Download charts (PNG)** to save each graph as its own PNG file (your browser may ask to allow multiple downloads).

### If Competitive benchmark shows “Unknown intelligence agent: brand_benchmark”

1. Call **`GET http://localhost:8001/health/modules`**. You should see **`"brand_benchmark_registered": true`** and **`brand_benchmark`** in **`module_keys`**. If you get **404** or **`"brand_benchmark_registered": false`**, the process bound to **8001** is an **old or wrong** FastAPI — stop every listener on that port (see `netstat -ano | findstr :8001`), then start **`npm run dev:api-fastapi`** once from the repo root.
2. After changing `.env`, restart **Next.js** so server-side proxy picks up **`NEXT_PUBLIC_API_BASE_URL`** / **`API_INTERNAL_URL`** (see [`apps/web/lib/backendBaseUrl.ts`](apps/web/lib/backendBaseUrl.ts)).

### If the UI still looks unchanged

1. Restart **FastAPI** (`npm run dev:api-fastapi`) so it loads `module_sections_market.py`.
2. Clear Next.js cache and restart the web app: `npm run clean --workspace apps/web` then `npm run dev:web`.
3. Hard-refresh the browser (Ctrl+Shift+R). Ensure `NEXT_PUBLIC_API_BASE_URL` points at the API you restarted (default `http://localhost:8001`).

### If the **dashboard** shows “We couldn’t load this page” and empty KPIs

The Next.js app proxies API calls through **`/harmony-api/*`** (see `next.config.mjs` rewrites) so the **browser** talks to the same origin as the page—**no CORS** to configure for normal UI loads. Ensure **`npm run dev:api-fastapi`** is running and `GET http://localhost:8001/health` returns JSON.

If you deploy with Docker, set **`API_INTERNAL_URL`** (or **`NEXT_PUBLIC_API_BASE_URL`**) to the FastAPI origin so rewrites reach the correct host.

### If **Run full analysis** shows “Not Found” or never completes

1. The Next.js route proxies to **Harmony FastAPI** only — not the NestJS `apps/api` service. Use **`http://localhost:8001`** (or set `NEXT_PUBLIC_API_BASE_URL` / Docker `API_INTERNAL_URL` to your FastAPI container URL), then **restart the web app** so server-side proxy env picks up changes.
2. Run **`npm run dev:api-fastapi`** from the repo root and leave it running; an older or stopped process will return **404** for `POST /agents/{id}/run-full-analysis`.
3. Quick check: open `http://localhost:8001/docs` and confirm **run-full-analysis** appears under `/agents/{agent_id}/`.

### Methodology & future connectors

- Module copy is **UK market–first** (trends, peer SEO, category signals). Indices are **directional** unless you connect first-party exports (Search Console, ad platforms, social) and ingestion jobs.
- **Future connectors** (not in this repo by default): Google Search Console API, Trends or third-party keyword APIs, social listening exports, scheduled competitor URL monitors. Those would ground scores in live data instead of illustrative composites.

## Web app routes

- `/` — command centre (data-backed module cards)
- `/dashboard` — UK market intelligence (neutral copy), aggregated **UK search & market intelligence** from all modules, **selected click-to-run intelligence runs**, charts, drilldown, exports
- `/trend`, `/audience`, `/content`, `/competitor`, `/opportunity`, `/seo` — module pages
- `/how-it-works` — pipeline overview
- `/agents`, `/agents/[id]` — catalog and per-agent documentation + optional **Run full analysis** (same endpoint as module pages)
- `/report-center` — reporting

