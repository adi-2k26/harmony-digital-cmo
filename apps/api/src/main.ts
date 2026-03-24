import express from "express";
import cors from "cors";
import IORedis from "ioredis";
import { config } from "./config";
import { logger } from "./logger";
import { runLangGraphLikeFlow } from "./agentFlow";
import { bootstrapDatabase } from "./bootstrap";
import { getMetrics, trackAgentRun, trackRequest } from "./observability";
import { budgetStatus, canSpendTokens, recordTokenSpend } from "./tokenBudget";
import { getActivePolicy } from "./policies";
import {
  generateDashboardOverview,
  generateDrilldown,
  generateEnterpriseDashboard,
  generateRecentVsHistorical,
  generateReportCenter,
  generateSeoImplementation,
  generateWebsiteAnalysis,
  getFallbackActions,
  generateAgentCatalog
} from "./cmoEngine";
import type { ActionRecommendation } from "@harmony/schemas";
import {
  listActions,
  seedActionsIfEmpty,
  updateActionStatus as updateActionStatusInDb,
  getRecentMetrics,
  getKpiSummaryFromSnapshots,
  getRecentVsHistoricalFromSnapshots,
  getDecisionLogs
} from "./repository";

const app = express();
app.use(express.json());
app.use(cors());
app.use((_req, _res, next) => {
  trackRequest();
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "harmony-api", ts: new Date().toISOString() });
});

app.get("/dashboards/overview", async (_req, res) => {
  const data = await generateDashboardOverview();
  res.json(data);
});

app.get("/dashboards/enterprise", async (_req, res) => {
  const data = await generateEnterpriseDashboard();
  try {
    data.kpi_summary = await getKpiSummaryFromSnapshots();
  } catch {
    // keep generated fallback
  }
  try {
    const actions = await listActions();
    if (actions.length > 0) data.action_recommendations = actions;
  } catch {
    const fallback = getFallbackActions();
    if (fallback.length > 0) data.action_recommendations = fallback;
  }
  res.json(data);
});

app.get("/dashboards/recent-vs-new", async (_req, res) => {
  try {
    const persisted = await getRecentVsHistoricalFromSnapshots();
    res.json(persisted);
  } catch {
    const data = await generateRecentVsHistorical();
    res.json(data);
  }
});

app.get("/dashboards/drilldown", async (req, res) => {
  const pathParam = String(req.query.path ?? "");
  const path = pathParam ? pathParam.split(",").map((x) => x.trim()).filter(Boolean) : [];
  const data = await generateDrilldown(path);
  res.json(data);
});

app.get("/website/analysis", async (_req, res) => {
  const data = await generateWebsiteAnalysis();
  res.json(data);
});

app.get("/seo/implementation-engine", async (_req, res) => {
  const data = await generateSeoImplementation();
  res.json(data);
});

app.get("/reports/center", async (_req, res) => {
  const data = await generateReportCenter();
  try {
    data.decision_logs = await getDecisionLogs();
  } catch {
    // keep generated logs
  }
  res.json(data);
});

app.get("/actions", (_req, res) => {
  void listActions()
    .then((actions) => res.json({ actions }))
    .catch(() => res.json({ actions: getFallbackActions() }));
});

app.patch("/actions/:id/status", (req, res) => {
  const id = String(req.params.id);
  const status = String(req.body?.status ?? "");
  if (!["draft", "ready_for_review", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  void updateActionStatusInDb(id, status as ActionRecommendation["status"])
    .then((item) => {
      if (!item) return res.status(404).json({ error: "Action not found" });
      return res.json({ action: item });
    })
    .catch(() => res.status(500).json({ error: "Failed to update action status" }));
});

app.post("/agents/run", async (req, res) => {
  if (!canSpendTokens(1200)) {
    return res.status(429).json({ error: "Daily token budget reached", budget: budgetStatus() });
  }
  recordTokenSpend(1200);
  trackAgentRun();
  const result = await runLangGraphLikeFlow(req.body ?? {});
  res.json(result);
});

app.get("/admin/metrics", (_req, res) => {
  res.json({ metrics: getMetrics(), tokenBudget: budgetStatus() });
});

app.get("/admin/policies", (_req, res) => {
  res.json({ brandPolicy: getActivePolicy() });
});

app.get("/agents/catalog", async (_req, res) => {
  const data = await generateAgentCatalog();
  res.json(data);
});

app.get("/system/status", async (_req, res) => {
  const status = {
    db: "down",
    background_jobs: process.env.ENABLE_BACKGROUND_JOBS === "true",
    queue: process.env.ENABLE_BACKGROUND_JOBS === "true" ? "unknown" : "disabled",
    workers: process.env.ENABLE_BACKGROUND_JOBS === "true" ? "unknown" : "disabled"
  };
  try {
    await getRecentMetrics();
    status.db = "up";
  } catch {
    status.db = "down";
  }
  res.json(status);
});

app.listen(config.port, async () => {
  try {
    await bootstrapDatabase();
    await seedActionsIfEmpty(getFallbackActions());
  } catch (err) {
    logger.warn({ err: String(err) }, "Database unavailable; running API without persistence");
  }
  if (process.env.ENABLE_BACKGROUND_JOBS === "true") {
    try {
      const client = new IORedis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
      await client.connect();
      const info = await client.info("server");
      const versionLine = info
        .split("\n")
        .find((line) => line.toLowerCase().startsWith("redis_version:"));
      const version = versionLine?.split(":")[1]?.trim() ?? "0.0.0";
      await client.quit();
      const major = Number(version.split(".")[0] ?? "0");
      if (major < 5) {
        logger.warn({ version }, "Redis version too old for BullMQ. Background jobs disabled.");
        logger.info({ port: config.port }, "Harmony API listening");
        return;
      }
      const { bootstrapSchedules } = await import("./scheduler");
      const { startWorkers } = await import("./workers");
      await bootstrapSchedules();
      startWorkers();
    } catch (err) {
      logger.warn({ err: String(err) }, "Redis unavailable; running API without background workers");
    }
  } else {
    logger.info("Background jobs disabled (set ENABLE_BACKGROUND_JOBS=true to enable)");
  }
  logger.info({ port: config.port }, "Harmony API listening");
});
