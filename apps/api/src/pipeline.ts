import type {
  ObservationSnapshot,
  SourceSystem,
  QualityScore
} from "@harmony/schemas";
import { observationSnapshotSchema } from "@harmony/schemas";
import { logger } from "./logger";

const allowedJewelleryKeywords = [
  "engagement ring",
  "wedding band",
  "diamond",
  "hatton garden",
  "bespoke jewellery",
  "lab-grown"
];

export function validateSnapshot(payload: unknown): ObservationSnapshot {
  return observationSnapshotSchema.parse(payload);
}

export function credibilityFilter(score: QualityScore): boolean {
  return score.confidence_score >= 70 && score.source_authority_score >= 65;
}

export function jewelleryNicheFilter(text: string): boolean {
  const normalized = text.toLowerCase();
  return allowedJewelleryKeywords.some((k) => normalized.includes(k));
}

export function recentWindowFilter(observedAt: string, days = 30): boolean {
  const observed = new Date(observedAt).getTime();
  const oldest = Date.now() - days * 24 * 60 * 60 * 1000;
  return observed >= oldest;
}

export async function processCollection(
  source: SourceSystem,
  payload: unknown,
  quality: QualityScore
) {
  const snapshot = validateSnapshot(payload);
  if (!recentWindowFilter(snapshot.observed_at)) {
    logger.info({ source: source.name }, "Rejected stale snapshot");
    return { accepted: false, reason: "stale" as const };
  }
  if (!credibilityFilter(quality)) {
    return { accepted: false, reason: "low_confidence" as const };
  }
  if (!jewelleryNicheFilter(snapshot.topic_text)) {
    return { accepted: false, reason: "out_of_scope" as const };
  }
  return { accepted: true, snapshot };
}
