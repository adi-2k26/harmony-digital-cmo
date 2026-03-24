import unittest
from unittest.mock import patch


class TestHybridFallbackDeterminism(unittest.TestCase):
    def test_fallback_kpi_is_stable_for_same_inputs(self) -> None:
        from hybrid_fallback import build_fallback_kpi

        seed = {
            "consultation_intent_score": 84.0,
            "organic_growth_percent": 19.4,
            "engagement_quality_score": 78.0,
            "avg_rank_position": 13.2,
        }
        a = build_fallback_kpi(seed, "scope-a")
        b = build_fallback_kpi(seed, "scope-a")
        self.assertEqual(a, b)


class TestHybridRecomputeIdempotency(unittest.TestCase):
    @patch("services.repo.save_hybrid_dashboard_snapshot")
    @patch("services.repo.kpi_summary_from_snapshots")
    @patch("services.agents.module_sections")
    def test_recompute_skips_inside_ttl(
        self,
        module_sections_mock: object,
        kpi_mock: object,
        _save_mock: object,
    ) -> None:
        import services

        module_sections_mock.return_value = []
        kpi_mock.return_value = {
            "consultation_intent_score": 84.0,
            "organic_growth_percent": 19.4,
            "engagement_quality_score": 78.0,
            "avg_rank_position": 13.2,
        }
        with patch("services.repo.load_hybrid_dashboard_snapshot") as load_mock:
            load_mock.return_value = {
                "generated_at": "2026-01-01T00:00:00+00:00",
                "source_mode": "hybrid_no_external_api",
            }
            first = services.recompute_hybrid_intelligence(force=True)
            second = services.recompute_hybrid_intelligence(force=False)
            self.assertEqual(first["status"], "recomputed")
            self.assertIn(second["status"], {"recomputed", "skipped"})


if __name__ == "__main__":
    unittest.main()
