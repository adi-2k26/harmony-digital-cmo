"""
Vercel Python function entrypoint for FastAPI.

This keeps existing FastAPI routes unchanged while allowing the web app to
proxy `/harmony-api/*` to this function via `vercel.json`.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Callable


REPO_ROOT = Path(__file__).resolve().parents[2]
FASTAPI_DIR = REPO_ROOT / "services" / "api-fastapi"
if str(FASTAPI_DIR) not in sys.path:
    sys.path.insert(0, str(FASTAPI_DIR))

from main import app as fastapi_app  # noqa: E402


class _PrefixStripper:
    """Strip Vercel function route prefix so FastAPI sees canonical paths."""

    def __init__(self, app: Callable):
        self._app = app

    async def __call__(self, scope, receive, send):  # type: ignore[no-untyped-def]
        if scope.get("type") != "http":
            await self._app(scope, receive, send)
            return
        path = scope.get("path", "")
        for prefix in ("/api/harmony", "/harmony-api"):
            if path == prefix or path.startswith(f"{prefix}/"):
                new_scope = dict(scope)
                new_path = path[len(prefix) :] or "/"
                new_scope["path"] = new_path
                await self._app(new_scope, receive, send)
                return
        await self._app(scope, receive, send)


app = _PrefixStripper(fastapi_app)
