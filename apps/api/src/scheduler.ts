import { ingestQueue } from "./queue";

const schedule = [
  { source: "tiktok_trends", everyHours: 6 },
  { source: "meta_insights", everyHours: 24 },
  { source: "google_seo", everyHours: 24 },
  { source: "uk_competitors", everyHours: 72 }
];

export async function bootstrapSchedules() {
  await Promise.all(
    schedule.map((item) =>
      ingestQueue.add(
        `collect-${item.source}`,
        { source: item.source },
        {
          repeat: { every: item.everyHours * 60 * 60 * 1000 },
          removeOnComplete: 100,
          removeOnFail: 100
        }
      )
    )
  );
}
