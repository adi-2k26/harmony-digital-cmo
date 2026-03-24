import { z } from "zod";

export const sourceSystemSchema = z.object({
  source_id: z.string(),
  name: z.string(),
  channel: z.enum([
    "tiktok",
    "instagram",
    "facebook",
    "google_trends",
    "search_console",
    "seo_provider",
    "competitor_web"
  ]),
  api_version: z.string()
});

export const observationSnapshotSchema = z.object({
  snapshot_id: z.string(),
  entity_id: z.string(),
  source_id: z.string(),
  metric_name: z.string(),
  metric_value: z.number(),
  metric_unit: z.string(),
  observed_at: z.string(),
  collected_at: z.string(),
  processed_at: z.string(),
  topic_text: z.string()
});

export const qualityScoreSchema = z.object({
  snapshot_id: z.string(),
  source_authority_score: z.number(),
  relevance_score: z.number(),
  freshness_score: z.number(),
  anomaly_score: z.number(),
  confidence_score: z.number()
});

export const recommendationSchema = z.object({
  id: z.string(),
  channel: z.enum(["tiktok", "instagram", "meta_ads", "google_ads", "seo"]),
  title: z.string(),
  summary: z.string(),
  expected_impact: z.string(),
  confidence: z.number(),
  created_at: z.string()
});

export const confidenceAndProvenanceSchema = z.object({
  confidence: z.number(),
  source: z.string(),
  collected_at: z.string(),
  refreshed_at: z.string(),
  freshness_sla: z.string()
});

export const kpiSummarySchema = z.object({
  consultation_intent_score: z.number(),
  organic_growth_percent: z.number(),
  engagement_quality_score: z.number(),
  avg_rank_position: z.number()
});

export const moduleSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  narrative: z.string(),
  primary_metric: z.string(),
  value: z.number(),
  trend_percent: z.number()
});

export const drilldownPayloadSchema = z.object({
  level: z.enum(["kpi", "channel", "cluster", "item"]),
  path: z.array(z.string()),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.number()
    })
  )
});

export const actionRecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  expected_impact: z.string(),
  effort: z.enum(["low", "medium", "high"]),
  priority: z.enum(["low", "medium", "high"]),
  owner: z.string(),
  due_date: z.string(),
  status: z.enum(["draft", "ready_for_review", "approved", "rejected"])
});

export const enterpriseDashboardSchema = z.object({
  kpi_summary: kpiSummarySchema,
  module_sections: z.array(moduleSectionSchema),
  confidence_and_provenance: z.array(confidenceAndProvenanceSchema),
  action_recommendations: z.array(actionRecommendationSchema)
});

export type SourceSystem = z.infer<typeof sourceSystemSchema>;
export type ObservationSnapshot = z.infer<typeof observationSnapshotSchema>;
export type QualityScore = z.infer<typeof qualityScoreSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type EnterpriseDashboard = z.infer<typeof enterpriseDashboardSchema>;
export type ActionRecommendation = z.infer<typeof actionRecommendationSchema>;
export type DrilldownPayload = z.infer<typeof drilldownPayloadSchema>;
