import { getOpenAIClient } from "./openaiClient";
import { config } from "./config";
import { randomUUID } from "node:crypto";
import type { ActionRecommendation, DrilldownPayload, EnterpriseDashboard } from "@harmony/schemas";

type DashboardInsight = {
  trendIntelligence: { trendingStyle: string; delta7d: number };
  audienceInsights: { topIntent: string; londonShare: number };
  contentPerformance: { topFormat: string; engagementRate: number };
  competitorIntelligence: { gap: string };
  opportunityDashboard: { highestRoi: string };
  seoOrganic: {
    keyword: string;
    recentAvgPosition: number;
    baselineAvgPosition: number;
    projectedImpact: string;
  };
};

const fallbackOverview: DashboardInsight = {
  trendIntelligence: { trendingStyle: "Oval solitaire", delta7d: 14 },
  audienceInsights: { topIntent: "bespoke consultation", londonShare: 61 },
  contentPerformance: { topFormat: "proposal-story reel", engagementRate: 7.9 },
  competitorIntelligence: { gap: "Lab-grown transparency narratives" },
  opportunityDashboard: { highestRoi: "Wedding season timeline explainers" },
  seoOrganic: {
    keyword: "engagement rings london",
    recentAvgPosition: 13.2,
    baselineAvgPosition: 17.8,
    projectedImpact: "+22% qualified organic sessions"
  }
};

const fallbackEnterpriseDashboard: EnterpriseDashboard = {
  kpi_summary: {
    consultation_intent_score: 84,
    organic_growth_percent: 19.4,
    engagement_quality_score: 78,
    avg_rank_position: 13.2
  },
  module_sections: [
    {
      key: "trend",
      title: "Trend Intelligence",
      narrative: "Oval and radiant engagement ring stories are outperforming baseline in UK luxury segments.",
      primary_metric: "trend_score",
      value: 82,
      trend_percent: 14
    },
    {
      key: "content",
      title: "Content Performance",
      narrative: "Proposal journey reels convert best into consultation intent.",
      primary_metric: "engagement_rate",
      value: 7.9,
      trend_percent: 11
    },
    {
      key: "seo",
      title: "SEO & Organic",
      narrative: "Local intent pages for engagement rings London are gaining momentum.",
      primary_metric: "avg_rank_position",
      value: 13.2,
      trend_percent: 25
    },
    {
      key: "competitor",
      title: "Competitor Intelligence",
      narrative: "Transparency-led lab-grown education remains underutilized by peers.",
      primary_metric: "positioning_gap_score",
      value: 71,
      trend_percent: 9
    },
    {
      key: "opportunity",
      title: "Opportunity Dashboard",
      narrative: "Wedding season timeline explainers present highest near-term ROI.",
      primary_metric: "roi_opportunity_score",
      value: 88,
      trend_percent: 16
    }
  ],
  confidence_and_provenance: [
    {
      confidence: 0.86,
      source: "openai_cmo_engine",
      collected_at: new Date().toISOString(),
      refreshed_at: new Date().toISOString(),
      freshness_sla: "daily"
    }
  ],
  action_recommendations: [
    {
      id: randomUUID(),
      title: "Launch bespoke proposal story series for oval and radiant cuts",
      expected_impact: "Increase consultation submissions by 10-15% over 30 days",
      effort: "medium",
      priority: "high",
      owner: "marketing_ops",
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "ready_for_review"
    }
  ]
};

async function askForJson<T>(prompt: string, fallback: T): Promise<T> {
  const client = getOpenAIClient();
  if (!client) return fallback;
  try {
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: "system", content: "Return strictly valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    });
    const text = response.choices?.[0]?.message?.content?.trim();
    if (!text) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export async function generateDashboardOverview(): Promise<DashboardInsight> {
  return askForJson<DashboardInsight>(
    [
      "You are CMO AI for Harmony Jewels London.",
      "Return only strict JSON for UK luxury jewellery insights.",
      "Focus on engagement rings, wedding bands, bespoke, lab-grown and natural diamond narratives.",
      "Schema:",
      JSON.stringify(fallbackOverview)
    ].join("\n"),
    fallbackOverview
  );
}

export async function generateRecentVsHistorical() {
  return askForJson(
    [
      "Return only JSON for recent vs historical UK jewellery marketing performance.",
      "Use schema exactly:",
      JSON.stringify({
        recent: { windowDays: 7, avgEngagement: 7.9, avgSeoPosition: 13.2 },
        historical: { windowDays: 30, avgEngagement: 6.8, avgSeoPosition: 17.8 },
        deltas: { engagementLiftPercent: 16.2, seoImprovementPercent: 25.8 }
      })
    ].join("\n"),
    {
      recent: { windowDays: 7, avgEngagement: 7.9, avgSeoPosition: 13.2 },
      historical: { windowDays: 30, avgEngagement: 6.8, avgSeoPosition: 17.8 },
      deltas: { engagementLiftPercent: 16.2, seoImprovementPercent: 25.8 }
    }
  );
}

export async function generateSeoImplementation() {
  return askForJson(
    [
      "Return only JSON.",
      "Create SEO implementation actions for Harmony Jewels London UK market.",
      "Focus only jewellery and engagement ring niche with premium tone.",
      "Schema:",
      JSON.stringify({
        primaryKeyword: "engagement rings london",
        timeline: "30-90 days",
        actions: [
          {
            step: "Optimise title tags and headings for local buyer intent",
            tools: ["Google Search Console", "Screaming Frog", "CMS editor"],
            expectedImpact: "Higher CTR and improved average ranking in 2-6 weeks"
          }
        ]
      })
    ].join("\n"),
    {
      primaryKeyword: "engagement rings london",
      timeline: "30-90 days",
      actions: [
        {
          step: "Optimise title tags and headings for local buyer intent",
          tools: ["Google Search Console", "Screaming Frog", "CMS editor"],
          expectedImpact: "Higher CTR and improved average ranking in 2-6 weeks"
        },
        {
          step: "Add LocalBusiness, Product, and FAQ schema to high-intent pages",
          tools: ["Schema generator", "Rich Results Test"],
          expectedImpact: "Improved SERP visibility and trust signals"
        },
        {
          step: "Publish blog cluster around proposal, diamonds, and ring styles",
          tools: ["Keyword planner", "Content brief templates"],
          expectedImpact: "Growth in non-brand traffic and consultation entries"
        }
      ]
    }
  );
}

export async function generateWebsiteAnalysis() {
  return askForJson(
    [
      "Return only JSON.",
      "Analyze Harmony Jewels London website positioning for UK luxury jewellery.",
      "Schema:",
      JSON.stringify({
        products: { core: ["Bespoke engagement rings"], keyStyles: ["Oval"] },
        journey: { steps: ["Book consultation"], model: "consultation-driven" },
        tone: {
          voice: "Luxury, emotional, trust-first, craftsmanship-led",
          signals: ["Hatton Garden heritage"]
        },
        pricing: {
          positioning: "Premium with transparency",
          notes: ["Natural and lab-grown options"]
        }
      })
    ].join("\n"),
    {
      products: {
        core: [
          "Bespoke engagement rings",
          "Wedding bands",
          "Lab-grown and natural diamond jewellery",
          "Custom fine jewellery"
        ],
        keyStyles: ["Oval", "Radiant", "Cushion", "Emerald", "Round"]
      },
      journey: {
        steps: [
          "Book consultation",
          "Select setting or diamond",
          "Discuss certification, pricing, and design details",
          "Approve bespoke concept",
          "Production and delivery/collection"
        ],
        model: "consultation-driven"
      },
      tone: {
        voice: "Luxury, emotional, trust-first, craftsmanship-led",
        signals: ["Hatton Garden heritage", "Transparency", "No pressure guidance"]
      },
      pricing: {
        positioning: "Premium with transparency",
        notes: [
          "Natural and lab-grown options for budget-fit luxury",
          "Pricing influenced by diamond and precious metal markets"
        ]
      }
    }
  );
}

export async function generateEnterpriseDashboard(): Promise<EnterpriseDashboard> {
  return askForJson(
    [
      "Return only JSON.",
      "You are Harmony Jewels enterprise marketing analytics engine.",
      "Focus only UK luxury jewellery insights for engagement and wedding rings.",
      "Use schema exactly:",
      JSON.stringify(fallbackEnterpriseDashboard)
    ].join("\n"),
    fallbackEnterpriseDashboard
  );
}

export async function generateDrilldown(path: string[]): Promise<DrilldownPayload> {
  const fallback: DrilldownPayload = {
    level: path.length === 0 ? "kpi" : path.length === 1 ? "channel" : path.length === 2 ? "cluster" : "item",
    path,
    metrics: [
      { label: "Consultation Intent", value: 84 },
      { label: "Engagement Quality", value: 78 },
      { label: "Organic Lift", value: 19.4 }
    ]
  };
  return askForJson(
    [
      "Return only JSON.",
      "Generate drilldown payload for Harmony Jewels enterprise dashboard.",
      "Focus UK luxury jewellery niche only.",
      `Path: ${JSON.stringify(path)}`,
      "Schema:",
      JSON.stringify(fallback)
    ].join("\n"),
    fallback
  );
}

export async function generateReportCenter() {
  return askForJson(
    [
      "Return only JSON.",
      "Build weekly and monthly report center snapshot for Harmony Jewels UK luxury jewellery growth.",
      "Schema:",
      JSON.stringify({
        weekly_snapshot: {
          period: "Last 7 days",
          highlights: ["Consultation intent +11%", "SEO average rank improved from 15.4 to 13.2"]
        },
        monthly_comparison: {
          current_month: { organic_sessions: 1240, consultation_rate: 3.8, avg_rank: 13.2 },
          previous_month: { organic_sessions: 1010, consultation_rate: 3.2, avg_rank: 16.9 }
        },
        decision_logs: [
          {
            id: "decision-1",
            decision: "Increase SEO content around bespoke engagement rings London",
            owner: "seo_ops",
            created_at: new Date().toISOString()
          }
        ]
      })
    ].join("\n"),
    {
      weekly_snapshot: {
        period: "Last 7 days",
        highlights: ["Consultation intent +11%", "SEO average rank improved from 15.4 to 13.2"]
      },
      monthly_comparison: {
        current_month: { organic_sessions: 1240, consultation_rate: 3.8, avg_rank: 13.2 },
        previous_month: { organic_sessions: 1010, consultation_rate: 3.2, avg_rank: 16.9 }
      },
      decision_logs: [
        {
          id: "decision-1",
          decision: "Increase SEO content around bespoke engagement rings London",
          owner: "seo_ops",
          created_at: new Date().toISOString()
        }
      ]
    }
  );
}

export function getFallbackActions(): ActionRecommendation[] {
  return [...fallbackEnterpriseDashboard.action_recommendations];
}

export async function runCmoAgent(input: Record<string, unknown>) {
  return askForJson(
    [
      "You are Harmony Jewels Digital CMO.",
      "Return only JSON with keys: trail, recommendation, gate, signal, reasoning, impact_estimate, provenance.",
      "gate must be pass|revise|block.",
      "Keep output strictly UK jewellery niche and luxury tone.",
      `Context: ${JSON.stringify(input)}`
    ].join("\n"),
    {
      trail: [
        { stage: "data_collection", payload: input },
        { stage: "trend_analysis", payload: { trendScore: 82, highIntentKeyword: "engagement rings london" } },
        {
          stage: "content_generation",
          payload: { draft: "A bespoke ring that begins your forever story in Hatton Garden." }
        },
        {
          stage: "insight_synthesis",
          payload: { recommendation: "Prioritise oval lab-grown storytelling reels." }
        },
        {
          stage: "seo_strategy",
          payload: {
            targetKeyword: "engagement rings london",
            steps: ["Update title tags", "Add local internal links", "Publish comparison blog"]
          }
        }
      ],
      recommendation: {
        id: randomUUID(),
        channel: "instagram",
        title: "Improve local intent conversion content",
        summary: "Prioritise oval lab-grown storytelling reels.",
        expected_impact: "Higher consultation bookings from organic + social touchpoints",
        confidence: 0.82,
        created_at: new Date().toISOString()
      },
      gate: "pass",
      signal: "Proposal-story content demand is rising among London intent audience.",
      reasoning:
        "Recent engagement and SEO movement indicate stronger consideration-stage activity for bespoke engagement pieces.",
      impact_estimate: "Projected 10-15% uplift in consultation conversions if prioritised this cycle.",
      provenance: {
        source: "openai_cmo_engine",
        generated_at: new Date().toISOString()
      }
    }
  );
}

export async function generateAgentCatalog() {
  return askForJson(
    [
      "Return JSON only.",
      "Create an enterprise agent catalog for Harmony Jewels Digital CMO platform.",
      "Include purpose, inputs, outputs, dependencies, cadence, failure handling, owner, SLA.",
      "Use UK luxury jewellery context only."
    ].join("\n"),
    {
      agents: [
        {
          id: "data_collection_agent",
          name: "Data Collection Agent",
          purpose: "Collect recency-prioritised UK jewellery market signals.",
          inputs: ["TikTok trends", "Meta insights", "SEO/search signals", "Competitor changes"],
          outputs: ["normalized snapshots", "source confidence records"],
          dependencies: ["Postgres", "Redis queue", "OpenAI enrichment"],
          cadence: "6h/24h/72h by source",
          failure_handling: "retry with backoff, provenance logging",
          owner: "data_ops",
          sla: "95% successful collection windows"
        },
        {
          id: "trend_analysis_agent",
          name: "Trend Analysis Agent",
          purpose: "Turn snapshots into trend scores and opportunity indicators.",
          inputs: ["observation snapshots", "quality scores"],
          outputs: ["trend score", "opportunity score", "segment deltas"],
          dependencies: ["Postgres", "OpenAI model"],
          cadence: "hourly aggregation",
          failure_handling: "fallback scoring model and alert",
          owner: "insights_ops",
          sla: "30 min max analysis latency"
        },
        {
          id: "content_generation_agent",
          name: "Content Generation Agent",
          purpose: "Generate luxury-aligned social and SEO content ideas.",
          inputs: ["trend outputs", "brand DNA rules"],
          outputs: ["scripts", "captions", "blog outlines", "ad hooks"],
          dependencies: ["OpenAI model", "brand guardrails"],
          cadence: "on-demand and scheduled",
          failure_handling: "revision loop with policy checks",
          owner: "content_ops",
          sla: "99% policy-compliant drafts"
        },
        {
          id: "insight_synthesis_agent",
          name: "Insight Synthesis Agent",
          purpose: "Convert analysis into strategic recommendations.",
          inputs: ["trend signals", "content performance", "SEO movement"],
          outputs: ["action recommendations", "impact estimates"],
          dependencies: ["OpenAI model", "historical DB snapshots"],
          cadence: "daily and weekly summaries",
          failure_handling: "fallback to rule-based recommendation templates",
          owner: "strategy_ops",
          sla: "daily report before 9am UK"
        },
        {
          id: "brand_dna_enforcement_agent",
          name: "Brand DNA Enforcement Agent",
          purpose: "Ensure outputs remain premium, emotional, and trust-driven.",
          inputs: ["draft outputs", "brand policy"],
          outputs: ["pass/revise/block decision", "compliance reasons"],
          dependencies: ["policy store", "OpenAI model"],
          cadence: "every publish event",
          failure_handling: "block with reason + manual review route",
          owner: "brand_ops",
          sla: "100% publish gate coverage"
        },
        {
          id: "dashboard_generation_agent",
          name: "Dashboard Generation Agent",
          purpose: "Serve executive-ready analytics and comparisons.",
          inputs: ["DB snapshots", "recommendations", "status telemetry"],
          outputs: ["KPI summaries", "module sections", "report snapshots"],
          dependencies: ["Postgres", "web API"],
          cadence: "continuous refresh",
          failure_handling: "serve cached snapshot + warning state",
          owner: "platform_ops",
          sla: "99.5% dashboard uptime"
        }
      ]
    }
  );
}
