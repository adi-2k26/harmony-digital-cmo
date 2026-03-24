import json
import os
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from .connectors import collect_google_seo, collect_meta_insights, collect_tiktok_trends
from .orchestrator import build_agent_graph

logger = structlog.get_logger("harmony-workers")


def _credibility_filter(quality: dict) -> bool:
    return (
        quality["confidence_score"] >= 70
        and quality["source_authority_score"] >= 65
        and quality["relevance_score"] >= 70
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=12))
def run_pipeline() -> dict:
    collected = []
    for collector in (collect_tiktok_trends, collect_meta_insights, collect_google_seo):
        snapshot, quality = collector()
        if _credibility_filter(quality.model_dump()):
            collected.append(snapshot.model_dump())

    graph = build_agent_graph()
    output = graph.invoke({"snapshots": collected})
    return output


def main() -> None:
    result = run_pipeline()
    # Placeholder publish sink until API integration endpoint is wired.
    logger.info("pipeline_run_complete", result=json.dumps(result))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    os.environ.setdefault("PYTHONUTF8", "1")
    main()
