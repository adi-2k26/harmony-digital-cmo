from __future__ import annotations

import unittest
from unittest.mock import patch


class TestAuthEndpoints(unittest.TestCase):
    @patch("main.repo.auth_is_configured", return_value=False)
    def test_auth_config_endpoint(self, _mock: object) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.get("/auth/config")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["configured"], False)

    @patch("main.repo.auth_verify_credentials", return_value={"id": 1, "username": "admin"})
    @patch("main.repo.auth_create_session", return_value="test-token")
    def test_login_sets_cookie(self, _s: object, _v: object) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.post("/auth/login", json={"username": "admin", "password": "password123"})
        self.assertEqual(res.status_code, 200)
        set_cookie = res.headers.get("set-cookie", "")
        self.assertIn("hj_session=", set_cookie)

    @patch("main.repo.auth_is_configured", return_value=True)
    @patch("main.repo.auth_get_user_by_session", return_value=None)
    def test_guard_blocks_protected_when_not_logged_in(self, _m: object, _c: object) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.get("/actions")
        self.assertEqual(res.status_code, 401)

