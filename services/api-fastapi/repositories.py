from __future__ import annotations

import base64
import hashlib
import hmac
import secrets

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

from config import settings


def get_conn():
    return psycopg.connect(settings.database_url, row_factory=dict_row)


def _hash_password(password: str, salt_b64: str) -> str:
    salt = base64.b64decode(salt_b64.encode("utf-8"))
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return base64.b64encode(digest).decode("utf-8")


def ensure_action_tables() -> None:
    ddl = """
    CREATE TABLE IF NOT EXISTS action_item (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      expected_impact TEXT NOT NULL,
      effort TEXT NOT NULL,
      priority TEXT NOT NULL,
      owner TEXT NOT NULL,
      due_date TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS action_item_history (
      id BIGSERIAL PRIMARY KEY,
      action_id TEXT NOT NULL REFERENCES action_item(id),
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
    except Exception:
        return


def list_actions() -> list[dict]:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, title, expected_impact, effort, priority, owner, due_date::text, status
                    FROM action_item
                    ORDER BY updated_at DESC
                    """
                )
                return cur.fetchall()
    except Exception:
        return []


def seed_actions(actions: list[dict]) -> None:
    if not actions:
        return
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS count FROM action_item")
                count = int(cur.fetchone()["count"])
                if count > 0:
                    return
                for item in actions:
                    cur.execute(
                        """
                        INSERT INTO action_item (id, title, expected_impact, effort, priority, owner, due_date, status)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (id) DO NOTHING
                        """,
                        (
                            item["id"],
                            item["title"],
                            item["expected_impact"],
                            item["effort"],
                            item["priority"],
                            item["owner"],
                            item["due_date"],
                            item["status"],
                        ),
                    )
    except Exception:
        return


def update_action_status(action_id: str, status: str) -> dict | None:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT status FROM action_item WHERE id=%s", (action_id,))
                row = cur.fetchone()
                if not row:
                    return None
                from_status = row["status"]
                cur.execute(
                    """
                    UPDATE action_item
                    SET status=%s, updated_at=NOW()
                    WHERE id=%s
                    RETURNING id, title, expected_impact, effort, priority, owner, due_date::text, status
                    """,
                    (status, action_id),
                )
                updated = cur.fetchone()
                cur.execute(
                    """
                    INSERT INTO action_item_history (action_id, from_status, to_status)
                    VALUES (%s,%s,%s)
                    """,
                    (action_id, from_status, status),
                )
                return updated
    except Exception:
        return None


def kpi_summary_from_snapshots() -> dict:
    rows = {}
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT metric_name, AVG(metric_value)::float AS avg_value
                    FROM observation_snapshot
                    WHERE observed_at >= NOW() - INTERVAL '30 days'
                    GROUP BY metric_name
                    """
                )
                rows = {r["metric_name"]: r["avg_value"] for r in cur.fetchall()}
    except Exception:
        rows = {}
    return {
        "consultation_intent_score": round(rows.get("consultation_intent", 84.0), 2),
        "organic_growth_percent": round(rows.get("organic_growth", 19.4), 2),
        "engagement_quality_score": round(rows.get("engagement_rate", 78.0), 2),
        "avg_rank_position": round(rows.get("avg_position", 13.2), 2),
    }


def recent_vs_historical_from_snapshots() -> dict:
    row = {}
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                      AVG(CASE WHEN observed_at >= NOW() - INTERVAL '7 days' AND metric_name='engagement_rate' THEN metric_value END)::float AS recent_engagement,
                      AVG(CASE WHEN observed_at < NOW() - INTERVAL '7 days' AND observed_at >= NOW() - INTERVAL '30 days' AND metric_name='engagement_rate' THEN metric_value END)::float AS historical_engagement,
                      AVG(CASE WHEN observed_at >= NOW() - INTERVAL '7 days' AND metric_name='avg_position' THEN metric_value END)::float AS recent_rank,
                      AVG(CASE WHEN observed_at < NOW() - INTERVAL '7 days' AND observed_at >= NOW() - INTERVAL '30 days' AND metric_name='avg_position' THEN metric_value END)::float AS historical_rank
                    FROM observation_snapshot
                    """
                )
                row = cur.fetchone() or {}
    except Exception:
        row = {}
    recent_eng = float(row["recent_engagement"] or 7.9)
    hist_eng = float(row["historical_engagement"] or 6.8)
    recent_rank = float(row["recent_rank"] or 13.2)
    hist_rank = float(row["historical_rank"] or 17.8)
    return {
        "recent": {"windowDays": 7, "avgEngagement": round(recent_eng, 2), "avgSeoPosition": round(recent_rank, 2)},
        "historical": {"windowDays": 30, "avgEngagement": round(hist_eng, 2), "avgSeoPosition": round(hist_rank, 2)},
        "deltas": {
            "engagementLiftPercent": round(((recent_eng - hist_eng) / max(hist_eng, 0.1)) * 100, 2),
            "seoImprovementPercent": round(((hist_rank - recent_rank) / max(hist_rank, 0.1)) * 100, 2),
        },
    }


def decision_logs() -> list[dict]:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT action_id AS id,
                           CONCAT('Status changed to ', to_status) AS decision,
                           'marketing_ops'::text AS owner,
                           changed_at::text AS created_at
                    FROM action_item_history
                    ORDER BY changed_at DESC
                    LIMIT 25
                    """
                )
                return cur.fetchall()
    except Exception:
        return []


# --- Agent intelligence runs (click-to-run); memory fallback when DB unavailable ---

_AGENT_RUNS_MEMORY: list[dict] = []


def ensure_agent_run_tables() -> None:
    ddl = """
    CREATE TABLE IF NOT EXISTS agent_intelligence_run (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      completed_at TIMESTAMPTZ,
      message TEXT,
      source_meta JSONB,
      output JSONB,
      selected_for_dashboard BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE INDEX IF NOT EXISTS idx_agent_intelligence_run_agent ON agent_intelligence_run(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agent_intelligence_run_started ON agent_intelligence_run(started_at DESC);
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
    except Exception:
        return


def ensure_hybrid_snapshot_table() -> None:
    ddl = """
    CREATE TABLE IF NOT EXISTS hybrid_dashboard_snapshot (
      id SMALLINT PRIMARY KEY DEFAULT 1,
      payload JSONB NOT NULL,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
    except Exception:
        return


_HYBRID_SNAPSHOT_MEMORY: dict | None = None


def save_hybrid_dashboard_snapshot(payload: dict) -> None:
    global _HYBRID_SNAPSHOT_MEMORY
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO hybrid_dashboard_snapshot (id, payload, generated_at)
                    VALUES (1, %s, NOW())
                    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, generated_at = NOW()
                    """,
                    (Json(payload),),
                )
        return
    except Exception:
        _HYBRID_SNAPSHOT_MEMORY = payload


def load_hybrid_dashboard_snapshot() -> dict | None:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT payload
                    FROM hybrid_dashboard_snapshot
                    WHERE id = 1
                    """
                )
                row = cur.fetchone()
                if row and isinstance(row.get("payload"), dict):
                    return row["payload"]
    except Exception:
        pass
    return _HYBRID_SNAPSHOT_MEMORY


def _row_to_api(row: dict) -> dict:
    return {
        "run_id": row["id"],
        "agent_id": row["agent_id"],
        "status": row["status"],
        "started_at": row["started_at"] if isinstance(row["started_at"], str) else str(row["started_at"]),
        "completed_at": row.get("completed_at"),
        "message": row.get("message"),
        "source_meta": row.get("source_meta"),
        "output": row.get("output"),
        "selected_for_dashboard": bool(row.get("selected_for_dashboard", True)),
    }


def insert_agent_run_pending(*, run_id: str, agent_id: str, started_at: str) -> None:
    row = {
        "id": run_id,
        "agent_id": agent_id,
        "status": "pending",
        "started_at": started_at,
        "completed_at": None,
        "message": None,
        "source_meta": None,
        "output": None,
        "selected_for_dashboard": True,
    }
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO agent_intelligence_run
                    (id, agent_id, status, started_at, completed_at, message, source_meta, output, selected_for_dashboard)
                    VALUES (%s,%s,%s,%s::timestamptz,%s,%s,%s::jsonb,%s::jsonb,%s)
                    """,
                    (
                        run_id,
                        agent_id,
                        "pending",
                        started_at,
                        None,
                        None,
                        None,
                        None,
                        True,
                    ),
                )
        return
    except Exception:
        _AGENT_RUNS_MEMORY.insert(0, row)


def complete_agent_run(run_id: str, *, source_meta: dict, output: dict) -> None:
    from datetime import datetime, timezone

    completed = datetime.now(timezone.utc).isoformat()
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE agent_intelligence_run
                    SET status=%s, completed_at=%s::timestamptz, source_meta=%s, output=%s, message=NULL
                    WHERE id=%s
                    """,
                    ("completed", completed, Json(source_meta), Json(output), run_id),
                )
        return
    except Exception:
        for r in _AGENT_RUNS_MEMORY:
            if r["id"] == run_id:
                r["status"] = "completed"
                r["completed_at"] = completed
                r["source_meta"] = source_meta
                r["output"] = output
                r["message"] = None
                return


def fail_agent_run(run_id: str, message: str) -> None:
    from datetime import datetime, timezone

    completed = datetime.now(timezone.utc).isoformat()
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE agent_intelligence_run
                    SET status=%s, completed_at=%s::timestamptz, message=%s
                    WHERE id=%s
                    """,
                    ("failed", completed, message, run_id),
                )
        return
    except Exception:
        for r in _AGENT_RUNS_MEMORY:
            if r["id"] == run_id:
                r["status"] = "failed"
                r["completed_at"] = completed
                r["message"] = message
                return


def get_agent_run(run_id: str) -> dict | None:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, agent_id, status, started_at::text, completed_at::text, message,
                           source_meta, output, selected_for_dashboard
                    FROM agent_intelligence_run WHERE id=%s
                    """,
                    (run_id,),
                )
                row = cur.fetchone()
                if row:
                    return _row_to_api(dict(row))
    except Exception:
        pass
    for r in _AGENT_RUNS_MEMORY:
        if r["id"] == run_id:
            return _row_to_api(dict(r))
    return None


def list_agent_runs(*, selected_only: bool = False, limit: int = 50) -> list[dict]:
    rows: list[dict] = []
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                if selected_only:
                    cur.execute(
                        """
                        SELECT id, agent_id, status, started_at::text, completed_at::text, message,
                               source_meta, output, selected_for_dashboard
                        FROM agent_intelligence_run
                        WHERE selected_for_dashboard = TRUE AND status = 'completed'
                        ORDER BY started_at DESC
                        LIMIT %s
                        """,
                        (limit,),
                    )
                else:
                    cur.execute(
                        """
                        SELECT id, agent_id, status, started_at::text, completed_at::text, message,
                               source_meta, output, selected_for_dashboard
                        FROM agent_intelligence_run
                        ORDER BY started_at DESC
                        LIMIT %s
                        """,
                        (limit,),
                    )
                rows = [_row_to_api(dict(r)) for r in cur.fetchall()]
    except Exception:
        rows = []
    if not rows and _AGENT_RUNS_MEMORY:
        mem = [dict(r) for r in _AGENT_RUNS_MEMORY]
        if selected_only:
            mem = [m for m in mem if m.get("selected_for_dashboard") and m.get("status") == "completed"]
        mem.sort(key=lambda x: x.get("started_at", ""), reverse=True)
        rows = [_row_to_api(m) for m in mem[:limit]]
    return rows


def list_latest_selected_outputs_excluding_seo() -> list[dict]:
    """Latest completed selected output per non-seo module (for SEO agent context)."""
    runs = list_agent_runs(selected_only=True, limit=200)
    by_agent: dict[str, dict] = {}
    for r in runs:
        aid = r["agent_id"]
        if aid == "seo":
            continue
        if aid not in by_agent:
            by_agent[aid] = r
    return [{"agent_id": k, "output": v.get("output"), "run_id": v["run_id"]} for k, v in by_agent.items()]


def patch_agent_run_selected(run_id: str, selected: bool) -> dict | None:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE agent_intelligence_run SET selected_for_dashboard=%s WHERE id=%s
                    RETURNING id, agent_id, status, started_at::text, completed_at::text, message,
                              source_meta, output, selected_for_dashboard
                    """,
                    (selected, run_id),
                )
                row = cur.fetchone()
                if row:
                    return _row_to_api(dict(row))
    except Exception:
        pass
    for r in _AGENT_RUNS_MEMORY:
        if r["id"] == run_id:
            r["selected_for_dashboard"] = selected
            return _row_to_api(dict(r))
    return None


def ensure_auth_tables() -> None:
    ddl = """
    CREATE TABLE IF NOT EXISTS auth_user (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS auth_session (
      token TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked BOOLEAN NOT NULL DEFAULT FALSE
    );
    CREATE INDEX IF NOT EXISTS idx_auth_session_user_id ON auth_session(user_id);
    """
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
    except Exception:
        return


def auth_is_configured() -> bool:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS count FROM auth_user")
                row = cur.fetchone()
                return bool(row and int(row["count"]) > 0)
    except Exception:
        return False


def auth_setup_once(username: str, password: str) -> bool:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) AS count FROM auth_user")
                row = cur.fetchone()
                if row and int(row["count"]) > 0:
                    return False
                salt_b64 = base64.b64encode(secrets.token_bytes(16)).decode("utf-8")
                hash_b64 = _hash_password(password, salt_b64)
                cur.execute(
                    """
                    INSERT INTO auth_user (username, password_salt, password_hash)
                    VALUES (%s, %s, %s)
                    """,
                    (username.strip(), salt_b64, hash_b64),
                )
                return True
    except Exception:
        return False


def auth_verify_credentials(username: str, password: str) -> dict | None:
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, username, password_salt, password_hash
                    FROM auth_user
                    WHERE username=%s
                    LIMIT 1
                    """,
                    (username.strip(),),
                )
                row = cur.fetchone()
                if not row:
                    return None
                expected = str(row["password_hash"])
                supplied = _hash_password(password, str(row["password_salt"]))
                if not hmac.compare_digest(expected, supplied):
                    return None
                return {"id": int(row["id"]), "username": str(row["username"])}
    except Exception:
        return None


def auth_create_session(user_id: int) -> str | None:
    token = secrets.token_urlsafe(48)
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO auth_session (token, user_id)
                    VALUES (%s, %s)
                    """,
                    (token, user_id),
                )
                return token
    except Exception:
        return None


def auth_get_user_by_session(token: str) -> dict | None:
    if not token:
        return None
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT u.id, u.username
                    FROM auth_session s
                    JOIN auth_user u ON u.id = s.user_id
                    WHERE s.token=%s AND s.revoked=FALSE
                    LIMIT 1
                    """,
                    (token,),
                )
                row = cur.fetchone()
                if not row:
                    return None
                cur.execute(
                    "UPDATE auth_session SET last_seen_at=NOW() WHERE token=%s",
                    (token,),
                )
                return {"id": int(row["id"]), "username": str(row["username"])}
    except Exception:
        return None


def auth_revoke_session(token: str) -> None:
    if not token:
        return
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("UPDATE auth_session SET revoked=TRUE WHERE token=%s", (token,))
    except Exception:
        return
