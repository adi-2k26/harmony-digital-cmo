from datetime import datetime, timezone
from .models import ObservationSnapshot, QualityScore


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def collect_tiktok_trends() -> tuple[ObservationSnapshot, QualityScore]:
    snapshot = ObservationSnapshot(
        snapshot_id="ttk-001",
        entity_id="uk-engagement-ring-trend",
        source_id="tiktok-api",
        metric_name="engagement_rate",
        metric_value=8.4,
        metric_unit="percent",
        observed_at=_now(),
        collected_at=_now(),
        processed_at=_now(),
        topic_text="Bespoke engagement ring reveal in Hatton Garden",
    )
    quality = QualityScore(
        snapshot_id=snapshot.snapshot_id,
        source_authority_score=78,
        relevance_score=91,
        freshness_score=95,
        anomaly_score=10,
        confidence_score=86,
    )
    return snapshot, quality


def collect_meta_insights() -> tuple[ObservationSnapshot, QualityScore]:
    snapshot = ObservationSnapshot(
        snapshot_id="meta-001",
        entity_id="ig-wedding-band-content",
        source_id="meta-graph",
        metric_name="save_rate",
        metric_value=6.1,
        metric_unit="percent",
        observed_at=_now(),
        collected_at=_now(),
        processed_at=_now(),
        topic_text="Wedding band consultation clips and bespoke craftsmanship stories",
    )
    quality = QualityScore(
        snapshot_id=snapshot.snapshot_id,
        source_authority_score=80,
        relevance_score=89,
        freshness_score=93,
        anomaly_score=8,
        confidence_score=84,
    )
    return snapshot, quality


def collect_google_seo() -> tuple[ObservationSnapshot, QualityScore]:
    snapshot = ObservationSnapshot(
        snapshot_id="seo-001",
        entity_id="keyword-engagement-rings-london",
        source_id="search-console",
        metric_name="avg_position",
        metric_value=13.2,
        metric_unit="rank",
        observed_at=_now(),
        collected_at=_now(),
        processed_at=_now(),
        topic_text="Engagement rings London bespoke and lab-grown diamond demand",
    )
    quality = QualityScore(
        snapshot_id=snapshot.snapshot_id,
        source_authority_score=92,
        relevance_score=94,
        freshness_score=90,
        anomaly_score=5,
        confidence_score=90,
    )
    return snapshot, quality
