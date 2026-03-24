import { Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config";
import { logger } from "./logger";
import { collectFromSource } from "./sources";
import { processCollection } from "./pipeline";
import { saveCollected, saveProvenance } from "./repository";
import { analyzeQueue, dlqQueue } from "./queue";

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true
});
connection.on("error", (err) => {
  logger.warn({ err: String(err) }, "Worker Redis connection unavailable");
});

export function startWorkers() {
  const ingestWorker = new Worker(
    "ingest-queue",
    async (job) => {
      const sourceName = String(job.data.source ?? "google_seo");
      const record = await collectFromSource(sourceName);
      const result = await processCollection(record.source, record.snapshot, record.quality);
      if (!result.accepted) {
        logger.warn({ sourceName, reason: result.reason }, "Collection filtered");
        return result;
      }
      await saveCollected(record.source, record.snapshot, record.quality);
      await saveProvenance({
        snapshotId: record.snapshot.snapshot_id,
        ingestionJobId: String(job.id),
        apiEndpoint: sourceName,
        requestId: `${sourceName}-${Date.now()}`,
        transformationVersion: "v1"
      });
      await analyzeQueue.add("analyze-snapshot", { snapshotId: record.snapshot.snapshot_id });
      return { accepted: true };
    },
    {
      connection,
      concurrency: 4,
      lockDuration: 30000
    }
  );

  ingestWorker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Ingest job failed");
    if (job) {
      void dlqQueue.add("ingest-failed", {
        originalJobId: job.id,
        payload: job.data,
        error: String(err)
      });
    }
  });
}
