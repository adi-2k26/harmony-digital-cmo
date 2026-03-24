import type { QualityScore, SourceSystem } from "@harmony/schemas";
import type { ObservationSnapshot } from "@harmony/schemas";

export type CollectedRecord = {
  source: SourceSystem;
  snapshot: ObservationSnapshot;
  quality: QualityScore;
};

function nowIso() {
  return new Date().toISOString();
}

export async function collectFromSource(sourceName: string): Promise<CollectedRecord> {
  const source: SourceSystem = {
    source_id: `${sourceName}-id`,
    name: sourceName,
    channel:
      sourceName === "tiktok_trends"
        ? "tiktok"
        : sourceName === "meta_insights"
          ? "instagram"
          : sourceName === "google_seo"
            ? "search_console"
            : "competitor_web",
    api_version: "v1"
  };

  const snapshot: ObservationSnapshot = {
    snapshot_id: `${sourceName}-${Date.now()}`,
    entity_id: `entity-${sourceName}`,
    source_id: source.source_id,
    metric_name: sourceName === "google_seo" ? "avg_position" : "engagement_rate",
    metric_value: sourceName === "google_seo" ? 13.1 : 7.8,
    metric_unit: sourceName === "google_seo" ? "rank" : "percent",
    observed_at: nowIso(),
    collected_at: nowIso(),
    processed_at: nowIso(),
    topic_text:
      "Bespoke engagement ring trend signal from UK jewellery audience in Hatton Garden"
  };

  const quality: QualityScore = {
    snapshot_id: snapshot.snapshot_id,
    source_authority_score: 80,
    relevance_score: 89,
    freshness_score: 93,
    anomaly_score: 7,
    confidence_score: 85
  };

  return { source, snapshot, quality };
}
