from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

import redis
from fastapi import Body, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from models import (
    ActionListResponse,
    AgentRunRequest,
    AgentRunResponse,
    AgentRunDetailedResponse,
    FullAnalysisRequest,
    AgentRunListResponse,
    AgentRunRecord,
    AgentRunSelectRequest,
    AgentDetailResponse,
    DeepDiveRequest,
    DeepDiveResponse,
    ModuleDeepDiveResponse,
    DrilldownResponse,
    ActionStatusPatchRequest,
    AgentCatalogResponse,
    EnterpriseDashboardResponse,
    HealthResponse,
    ModuleKeysHealthResponse,
    OpenAiHealthResponse,
    ModuleLandingResponse,
    SessionBootstrapResponse,
    RecentVsHistoricalResponse,
    ReportCenterResponse,
    SeoImplementationResponse,
    SystemStatusResponse,
    WebsiteAnalysisResponse,
    AuthSetupRequest,
    AuthLoginRequest,
    AuthUserResponse,
    AuthConfiguredResponse,
)
import repositories as repo
import services
import agents
import intelligence_service
from openai_client import (
    generate_agent_deep_dive_json,
    generate_module_deep_dive_json,
    get_openai_client,
    probe_openai_minimal,
)

_log = logging.getLogger(__name__)

app = FastAPI(title="Harmony FastAPI", version="0.1.0")
# Explicit origins come from settings; regex covers any dev port on localhost (3000, 3001, …)
# so the browser gets Access-Control-Allow-Origin even if FASTAPI_CORS_ORIGINS is outdated.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


IN_MEMORY_ACTIONS: dict[str, dict] = {}
USE_IN_MEMORY_ACTION_FALLBACK = os.getenv("VERCEL") is None
SESSION_COOKIE_NAME = "hj_session"
_AUTH_PUBLIC_PREFIXES = (
    "/health",
    "/health/openai",
    "/health/modules",
    "/openapi.json",
    "/docs",
    "/docs/",
    "/redoc",
    "/auth/config",
    "/auth/setup",
    "/auth/login",
)


@app.on_event("startup")
def startup() -> None:
    keys = sorted(intelligence_service.MODULE_KEYS)
    _log.info("MODULE_KEYS (%d): %s", len(keys), keys)
    fallback = agents.fallback_actions()
    for item in fallback:
        IN_MEMORY_ACTIONS[item["id"]] = item
    try:
        repo.ensure_action_tables()
        repo.ensure_auth_tables()
        repo.ensure_agent_run_tables()
        repo.ensure_hybrid_snapshot_table()
        repo.seed_actions(fallback)
    except Exception:
        return


@app.middleware("http")
async def auth_session_guard(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path or "/"
    if not repo.auth_is_configured():
        response = await call_next(request)
        token = getattr(request.state, "session_token", None)
        if token:
            response.set_cookie(
                key=SESSION_COOKIE_NAME,
                value=str(token),
                httponly=True,
                secure=request.url.scheme == "https",
                samesite="lax",
                path="/",
                max_age=60 * 60 * 24 * 365 * 10,
            )
        if getattr(request.state, "clear_session_cookie", False):
            response.delete_cookie(SESSION_COOKIE_NAME, path="/")
        return response

    requires_auth = not any(path == p or path.startswith(f"{p}/") for p in _AUTH_PUBLIC_PREFIXES)
    if requires_auth:
        token = request.cookies.get(SESSION_COOKIE_NAME, "")
        user = repo.auth_get_user_by_session(token) if token else None
        if not user:
            return JSONResponse({"detail": "Authentication required."}, status_code=401)
        request.state.auth_user = user

    response = await call_next(request)

    token = getattr(request.state, "session_token", None)
    if token:
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=str(token),
            httponly=True,
            secure=request.url.scheme == "https",
            samesite="lax",
            path="/",
            max_age=60 * 60 * 24 * 365 * 10,
        )
    if getattr(request.state, "clear_session_cookie", False):
        response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return response


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True, service=settings.app_name, ts=datetime.now(timezone.utc).isoformat())


@app.get("/health/openai", response_model=OpenAiHealthResponse)
def health_openai(probe: bool = False) -> OpenAiHealthResponse:
    """OpenAI status. Pass probe=true to run a minimal live completion (uses a few tokens)."""
    configured = bool(settings.openai_api_key and get_openai_client())
    if not probe:
        return OpenAiHealthResponse(
            configured=configured,
            model=settings.openai_model,
            probe="skipped",
            detail=None,
        )
    ok, err = probe_openai_minimal()
    return OpenAiHealthResponse(
        configured=configured,
        model=settings.openai_model,
        probe="ok" if ok else "error",
        detail=err,
    )


@app.get("/auth/config", response_model=AuthConfiguredResponse)
def auth_config() -> AuthConfiguredResponse:
    return AuthConfiguredResponse(configured=repo.auth_is_configured())


@app.post("/auth/setup", response_model=AuthUserResponse)
def auth_setup(payload: AuthSetupRequest) -> AuthUserResponse:
    if repo.auth_is_configured():
        raise HTTPException(status_code=409, detail="Admin credentials were already configured.")
    created = repo.auth_setup_once(payload.username, payload.password)
    if not created:
        raise HTTPException(status_code=500, detail="Could not persist admin credentials.")
    return AuthUserResponse(username=payload.username.strip(), configured=True)


@app.post("/auth/login", response_model=AuthUserResponse)
def auth_login(payload: AuthLoginRequest, request: Request) -> AuthUserResponse:
    user = repo.auth_verify_credentials(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    token = repo.auth_create_session(user["id"])
    if not token:
        raise HTTPException(status_code=500, detail="Could not create login session.")
    request.state.session_token = token
    return AuthUserResponse(username=str(user["username"]), configured=True)


@app.post("/auth/logout")
def auth_logout(request: Request) -> dict:
    token = request.cookies.get(SESSION_COOKIE_NAME, "")
    if token:
        repo.auth_revoke_session(token)
    request.state.clear_session_cookie = True
    return {"ok": True}


@app.get("/auth/me", response_model=AuthUserResponse)
def auth_me(request: Request) -> AuthUserResponse:
    token = request.cookies.get(SESSION_COOKIE_NAME, "")
    user = repo.auth_get_user_by_session(token) if token else None
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return AuthUserResponse(username=str(user["username"]), configured=True)


@app.get("/health/modules", response_model=ModuleKeysHealthResponse)
def health_modules() -> ModuleKeysHealthResponse:
    """Confirm which module keys accept POST /agents/{agent_id}/run-full-analysis (includes brand_benchmark)."""
    keys = sorted(intelligence_service.MODULE_KEYS)
    return ModuleKeysHealthResponse(
        module_keys=keys,
        brand_benchmark_registered="brand_benchmark" in intelligence_service.MODULE_KEYS,
    )


@app.get("/system/status", response_model=SystemStatusResponse)
def system_status() -> SystemStatusResponse:
    db_state = "up"
    try:
        repo.kpi_summary_from_snapshots()
    except Exception:
        db_state = "down"

    queue_state = "disabled"
    workers_state = "disabled"
    redis_version = None
    if settings.enable_background_jobs:
        try:
            client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
            info = client.info("server")
            redis_version = info.get("redis_version")
            major = int((redis_version or "0").split(".")[0])
            if major < 5:
                queue_state = "incompatible"
                workers_state = "incompatible"
            else:
                queue_state = "up"
                workers_state = "up"
        except Exception:
            queue_state = "down"
            workers_state = "down"

    return SystemStatusResponse(
        db=db_state,
        background_jobs=settings.enable_background_jobs,
        queue=queue_state,  # type: ignore[arg-type]
        workers=workers_state,  # type: ignore[arg-type]
        redis_version=redis_version,
    )


@app.get("/dashboards/enterprise", response_model=EnterpriseDashboardResponse)
def dashboard_enterprise() -> EnterpriseDashboardResponse:
    return EnterpriseDashboardResponse(**services.build_enterprise_dashboard())


@app.get("/dashboards/recent-vs-new", response_model=RecentVsHistoricalResponse)
def dashboard_recent_vs_new() -> RecentVsHistoricalResponse:
    return RecentVsHistoricalResponse(**services.build_recent_vs_historical())


@app.get("/dashboards/drilldown", response_model=DrilldownResponse)
def dashboard_drilldown(metric: str = "engagement") -> DrilldownResponse:
    return DrilldownResponse(
        metric=metric,
        narrative=f"Drilldown for {metric} indicates strongest gains from bespoke proposal journey content and local search intent.",
        recommendations=[
            "Prioritise high-intent engagement ring storyline posts",
            "Expand local SEO content around London consultation journeys",
            "Refresh creative weekly using top-performing message hooks",
        ],
    )


@app.get("/website/analysis", response_model=WebsiteAnalysisResponse)
def website_analysis() -> WebsiteAnalysisResponse:
    return WebsiteAnalysisResponse(**agents.website_analysis())


@app.get("/seo/implementation-engine", response_model=SeoImplementationResponse)
def seo_engine() -> SeoImplementationResponse:
    return SeoImplementationResponse(**agents.seo_implementation())


@app.get("/reports/center", response_model=ReportCenterResponse)
def reports_center() -> ReportCenterResponse:
    return ReportCenterResponse(**services.build_report_center())


@app.get("/actions", response_model=ActionListResponse)
def list_actions() -> ActionListResponse:
    db_actions = repo.list_actions()
    if db_actions:
        return ActionListResponse(actions=db_actions)
    if not USE_IN_MEMORY_ACTION_FALLBACK:
        return ActionListResponse(actions=[])
    return ActionListResponse(actions=list(IN_MEMORY_ACTIONS.values()))


@app.patch("/actions/{action_id}/status", response_model=dict)
def patch_action_status(action_id: str, payload: ActionStatusPatchRequest) -> dict:
    updated = repo.update_action_status(action_id, payload.status)
    if not updated and USE_IN_MEMORY_ACTION_FALLBACK and action_id in IN_MEMORY_ACTIONS:
        IN_MEMORY_ACTIONS[action_id]["status"] = payload.status
        updated = IN_MEMORY_ACTIONS[action_id]
    if not updated:
        raise HTTPException(status_code=404, detail="Action not found")
    return {"action": updated}


@app.get("/agents/catalog", response_model=AgentCatalogResponse)
def agents_catalog() -> AgentCatalogResponse:
    return AgentCatalogResponse(**agents.agent_catalog())


@app.post("/session/bootstrap-refresh", response_model=SessionBootstrapResponse)
def session_bootstrap_refresh() -> SessionBootstrapResponse:
    result = services.recompute_hybrid_intelligence(force=False)
    return SessionBootstrapResponse(**result)


@app.get("/agents/runs", response_model=AgentRunListResponse)
def list_agent_runs_endpoint(selected_only: bool = False) -> AgentRunListResponse:
    """List click-to-run intelligence executions (newest first)."""
    raw = repo.list_agent_runs(selected_only=selected_only, limit=100)
    return AgentRunListResponse(runs=[AgentRunRecord(**r) for r in raw])


@app.patch("/agents/runs/{run_id}/select", response_model=AgentRunRecord)
def patch_agent_run_select(run_id: str, payload: AgentRunSelectRequest) -> AgentRunRecord:
    """Toggle whether a run appears on the dashboard."""
    row = repo.patch_agent_run_selected(run_id, payload.selected)
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    return AgentRunRecord(**row)


@app.post("/agents/{agent_id}/run-detailed", response_model=AgentRunDetailedResponse)
def run_agent_detailed(agent_id: str) -> AgentRunDetailedResponse:
    """Run full market intelligence for a module key (trend, audience, …) or mapped catalog id."""
    try:
        row = intelligence_service.run_detailed_intelligence(agent_id)
        return AgentRunDetailedResponse(run=AgentRunRecord(**row))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/agents/{agent_id}/run-full-analysis", response_model=AgentRunDetailedResponse)
def run_agent_full_analysis(
    agent_id: str,
    payload: FullAnalysisRequest = Body(default_factory=FullAnalysisRequest),
) -> AgentRunDetailedResponse:
    """Structured UK intelligence (Trends + OpenAI) plus long-form narrative in one run."""
    try:
        row = intelligence_service.run_full_module_analysis(agent_id, payload.objective)
        return AgentRunDetailedResponse(run=AgentRunRecord(**row))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/agents/{agent_id}", response_model=AgentDetailResponse)
def agent_detail(agent_id: str) -> AgentDetailResponse:
    detail = agents.get_agent_detail(agent_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AgentDetailResponse(agent=detail)


@app.post("/agents/{agent_id}/deep-dive", response_model=DeepDiveResponse)
def agent_deep_dive(
    agent_id: str,
    payload: DeepDiveRequest = Body(default_factory=DeepDiveRequest),
) -> DeepDiveResponse:
    detail = agents.get_agent_detail(agent_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Agent not found")
    if not get_openai_client():
        return DeepDiveResponse(
            available=False,
            source="unavailable",
            content=None,
            message="OpenAI API key not configured. Set OPENAI_API_KEY to enable generated deep dives.",
        )
    try:
        content = generate_agent_deep_dive_json(
            agent_id,
            str(detail.get("name", agent_id)),
            payload.objective,
        )
        return DeepDiveResponse(available=True, source="openai", content=content, message=None)
    except Exception as exc:
        return DeepDiveResponse(
            available=False,
            source="unavailable",
            content=None,
            message=f"Deep dive generation failed: {exc}",
        )


@app.get("/modules/{module_key}", response_model=ModuleLandingResponse)
def module_landing(module_key: str) -> ModuleLandingResponse:
    mod = agents.get_module_landing(module_key)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    return ModuleLandingResponse(module=mod)


@app.post("/modules/{module_key}/deep-dive", response_model=ModuleDeepDiveResponse)
def module_deep_dive(
    module_key: str,
    payload: DeepDiveRequest = Body(default_factory=DeepDiveRequest),
) -> ModuleDeepDiveResponse:
    """On-demand long-form OpenAI analysis of a UK market intelligence module."""
    mod = agents.get_module_landing(module_key)
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    if not get_openai_client():
        return ModuleDeepDiveResponse(
            available=False,
            source="unavailable",
            content=None,
            message="OpenAI API key not configured. Set OPENAI_API_KEY to enable generated deep dives.",
        )
    try:
        content = generate_module_deep_dive_json(module_key, mod, payload.objective)
        return ModuleDeepDiveResponse(available=True, source="openai", content=content, message=None)
    except Exception as exc:
        return ModuleDeepDiveResponse(
            available=False,
            source="unavailable",
            content=None,
            message=f"Module deep dive generation failed: {exc}",
        )


@app.post("/agents/run", response_model=AgentRunResponse)
def agents_run(payload: AgentRunRequest) -> AgentRunResponse:
    return AgentRunResponse(**agents.run_agent(payload.agent_id, payload.objective, payload.context))
