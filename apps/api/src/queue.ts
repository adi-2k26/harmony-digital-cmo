import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "./config";
import { logger } from "./logger";

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  lazyConnect: true
});
connection.on("error", (err) => {
  logger.warn({ err: String(err) }, "Redis unavailable; queue features degraded");
});

const defaultJobOptions = {
  attempts: 3,
  removeOnComplete: 1000,
  backoff: { type: "exponential" as const, delay: 2000 }
};

export const ingestQueue = new Queue("ingest-queue", { connection, defaultJobOptions });
export const analyzeQueue = new Queue("analyze-queue", { connection, defaultJobOptions });
export const dlqQueue = new Queue("pipeline-dlq", { connection, defaultJobOptions });

for (const q of [ingestQueue, analyzeQueue, dlqQueue]) {
  q.on("error", (err) => {
    logger.warn({ err: String(err), queue: q.name }, "Queue unavailable; background jobs paused");
  });
}
