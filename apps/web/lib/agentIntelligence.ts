/** Resolve catalog agent id to market intelligence module key (server must accept same). */
export const INTELLIGENCE_MODULE_KEYS = new Set([
  "trend",
  "audience",
  "content",
  "competitor",
  "opportunity",
  "brand_benchmark",
  "seo",
]);

export const CATALOG_TO_MODULE: Record<string, string> = {
  seo_organic_strategy_agent: "seo",
  trend_analysis_agent: "trend",
  content_generation_agent: "content",
};

export function resolveIntelligenceModuleKey(agentId: string): string | null {
  if (INTELLIGENCE_MODULE_KEYS.has(agentId)) return agentId;
  return CATALOG_TO_MODULE[agentId] ?? null;
}

export type AgentRunRecord = {
  run_id: string;
  agent_id: string;
  status: "pending" | "completed" | "failed";
  started_at: string;
  completed_at?: string | null;
  message?: string | null;
  source_meta?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  selected_for_dashboard?: boolean;
};
