"""Smoke tests for click-to-run intelligence (no network)."""

import unittest
from unittest.mock import patch


class TestIntelligenceNormalize(unittest.TestCase):
    def test_module_keys(self) -> None:
        from intelligence_service import MODULE_KEYS, normalize_intelligence_key
        from module_sections_market import MARKET_MODULES

        self.assertEqual(MODULE_KEYS, frozenset(m["key"] for m in MARKET_MODULES))
        self.assertEqual(normalize_intelligence_key("trend"), "trend")
        self.assertEqual(normalize_intelligence_key("brand_benchmark"), "brand_benchmark")
        self.assertEqual(normalize_intelligence_key("seo_organic_strategy_agent"), "seo")
        self.assertIsNone(normalize_intelligence_key("unknown_agent"))


class TestHealthModulesEndpoint(unittest.TestCase):
    def test_get_health_modules_lists_brand_benchmark(self) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.get("/health/modules")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertTrue(body.get("brand_benchmark_registered"))
        self.assertIn("brand_benchmark", body.get("module_keys") or [])


class TestTrendsKeywords(unittest.TestCase):
    def test_module_has_keywords(self) -> None:
        from trends_google import MODULE_TREND_KEYWORDS

        self.assertIn("trend", MODULE_TREND_KEYWORDS)
        self.assertIn("brand_benchmark", MODULE_TREND_KEYWORDS)
        self.assertTrue(len(MODULE_TREND_KEYWORDS["seo"]) >= 1)


def _fake_full_run_row() -> dict:
    return {
        "run_id": "test-run-full-1",
        "agent_id": "trend",
        "status": "completed",
        "started_at": "2025-01-01T00:00:00+00:00",
        "completed_at": "2025-01-01T00:01:00+00:00",
        "message": None,
        "source_meta": {"geo": "GB"},
        "output": {
            "structured": {"executive_summary": "Structured summary."},
            "narrative_brief": {"executive_summary": "Narrative summary."},
            "provenance_banner": "Test provenance",
        },
        "selected_for_dashboard": True,
    }


class TestRunFullAnalysisEndpoint(unittest.TestCase):
    @patch("main.repo.auth_is_configured", return_value=False)
    @patch("intelligence_service.run_full_module_analysis", return_value=_fake_full_run_row())
    def test_post_run_full_analysis_returns_200(self, _mock: object, _auth: object) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.post("/agents/trend/run-full-analysis", json={"objective": "optional focus"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("run", body)
        self.assertEqual(body["run"]["status"], "completed")
        out = body["run"].get("output") or {}
        self.assertIn("structured", out)
        self.assertIn("narrative_brief", out)


class TestRunFullAnalysisBrandBenchmark(unittest.TestCase):
    @patch("main.repo.auth_is_configured", return_value=False)
    @patch("intelligence_service.run_full_module_analysis", return_value=_fake_full_run_row())
    def test_post_run_full_analysis_brand_benchmark_returns_200(self, _mock: object, _auth: object) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.post("/agents/brand_benchmark/run-full-analysis", json={"objective": "Q2 focus"})
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn("run", body)
        self.assertEqual(body["run"]["status"], "completed")


class TestSessionBootstrapRefreshEndpoint(unittest.TestCase):
    @patch("main.repo.auth_is_configured", return_value=False)
    @patch(
        "main.services.recompute_hybrid_intelligence",
        return_value={"status": "recomputed", "generated_at": "2026-01-01T00:00:00+00:00", "source_mode": "hybrid_no_external_api"},
    )
    def test_post_session_bootstrap_refresh_returns_200(self, _mock: object, _auth: object) -> None:
        from fastapi.testclient import TestClient

        from main import app

        client = TestClient(app)
        res = client.post("/session/bootstrap-refresh")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["status"], "recomputed")
        self.assertEqual(body["source_mode"], "hybrid_no_external_api")


if __name__ == "__main__":
    unittest.main()
