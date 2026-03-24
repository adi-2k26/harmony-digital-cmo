"""Action endpoint behavior should remain DB-authoritative in hosted/serverless envs."""

from __future__ import annotations

import unittest
from unittest.mock import patch


class TestActionsPersistenceParity(unittest.TestCase):
    @patch("main.repo.auth_is_configured", return_value=False)
    @patch("main.repo.list_actions", return_value=[{"id": "a1", "title": "T", "expected_impact": "H", "effort": "medium", "priority": "high", "owner": "Ops", "due_date": "2026-01-01T00:00:00+00:00", "status": "draft"}])
    def test_actions_prefers_database_rows(self, _mock: object, _auth: object) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.get("/actions")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(len(body.get("actions", [])), 1)
        self.assertEqual(body["actions"][0]["id"], "a1")

    @patch("main.repo.auth_is_configured", return_value=False)
    @patch("main.repo.list_actions", return_value=[])
    @patch("main.USE_IN_MEMORY_ACTION_FALLBACK", False)
    def test_actions_returns_empty_when_db_unavailable_on_hosted_env(self, _mock: object, _auth: object) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.get("/actions")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body.get("actions"), [])

