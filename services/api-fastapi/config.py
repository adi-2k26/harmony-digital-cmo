from __future__ import annotations

import os
from dataclasses import dataclass
from dataclasses import field
from pathlib import Path

from dotenv import load_dotenv

# Repo root: services/api-fastapi/config.py -> parents[2]
_REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_REPO_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    app_name: str = "harmony-fastapi"
    port: int = int(os.getenv("FASTAPI_PORT", "8001"))
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql://harmony:harmony@localhost:5432/harmony_cmo"
    )
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    enable_background_jobs: bool = os.getenv("ENABLE_BACKGROUND_JOBS", "false").lower() == "true"
    cors_origins: list[str] = field(
        default_factory=lambda: [
            o.strip()
            for o in os.getenv(
                "FASTAPI_CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000,"
                "http://localhost:3001,http://127.0.0.1:3001",
            ).split(",")
            if o.strip()
        ]
    )


settings = Settings()
