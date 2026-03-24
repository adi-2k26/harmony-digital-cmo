/**
 * When the API is older than the web app or the hybrid snapshot lacks a module,
 * we still show correct routes and copy. Keeps /brand-benchmark usable after deploy.
 */

export type HomeModuleCard = {
  key: string;
  title: string;
  narrative: string;
  primary_metric: string;
  value: number;
  trend_percent: number;
  summary?: string;
  user_value?: string;
  primary_actions?: string[];
  links?: { label: string; href: string }[];
  purpose_note?: string | null;
  detailed_insights?: { title: string; body: string; comparison?: string }[];
  metric_explanations?: Record<string, string>;
  research_sources?: { label: string; scope: string; kind: string; detail?: string }[];
  application_note?: string | null;
  metric_display_name?: string | null;
};

/** Same order as primary navigation modules + SEO (Core). */
const HOME_MODULE_ORDER = [
  "trend",
  "audience",
  "content",
  "competitor",
  "opportunity",
  "brand_benchmark",
  "seo",
] as const;

const FALLBACK_BY_KEY: Partial<Record<string, HomeModuleCard>> = {
  trend: {
    key: "trend",
    title: "UK Market Trends",
    narrative:
      "This module shows what is rising or slowing in UK luxury jewellery demand, so your team can time campaigns around real buyer interest instead of assumptions.",
    primary_metric: "uk_trend_momentum_index",
    value: 82,
    trend_percent: 14,
    summary:
      "Use this first to see market direction: what buyers are responding to now, what is flattening, and where momentum is building for the next campaign cycle.",
    user_value: "Best for campaign timing, monthly planning, and budget focus.",
    links: [{ label: "How it works", href: "/how-it-works" }],
  },
  audience: {
    key: "audience",
    title: "UK Audience Signals",
    narrative:
      "This module explains which audience groups show stronger buying intent and which are still in early research mode.",
    primary_metric: "uk_buyer_quality_index",
    value: 76,
    trend_percent: 9,
    summary:
      "Use this to decide who to target, what message to show each segment, and where to focus spend for higher-quality enquiries.",
    user_value: "Best for audience targeting, persona focus, and channel-level messaging.",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Report center", href: "/report-center" },
    ],
  },
  content: {
    key: "content",
    title: "Category Content",
    narrative:
      "This module shows which content styles, hooks, and calls-to-action are working best in your category right now.",
    primary_metric: "category_engagement_rate_proxy",
    value: 7.9,
    trend_percent: 11,
    summary:
      "Use it to choose what to create more of, what to stop, and how to brief content with clearer creative direction.",
    user_value: "Best for content planning, campaign briefs, and improving creative consistency.",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Agents", href: "/agents" },
    ],
  },
  competitor: {
    key: "competitor",
    title: "Peers & Competitors",
    narrative:
      "This module tracks visible peer patterns so you can see what competitors are pushing and where you can stand out.",
    primary_metric: "peer_pressure_index",
    value: 68,
    trend_percent: 6,
    summary:
      "Use this to identify competitor messaging trends, spot market gaps, and avoid copying tactics that do not fit your positioning.",
    user_value: "Best for positioning decisions, offer framing, and competitive strategy checks.",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Agents", href: "/agents" },
    ],
  },
  opportunity: {
    key: "opportunity",
    title: "Market Opportunities",
    narrative:
      "This module turns all signals into a practical priority list of where to act first for the highest return on effort.",
    primary_metric: "market_opportunity_score",
    value: 88,
    trend_percent: 18,
    summary:
      "Use it to separate quick wins from longer strategic plays and build a clear order of action for the team.",
    user_value: "Best for planning next actions, assigning owners, and sequencing delivery.",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "SEO module", href: "/seo" },
    ],
  },
  brand_benchmark: {
    key: "brand_benchmark",
    title: "Competitive benchmark",
    narrative:
      "Benchmark Harmony Jewels against Queensmith, Flawless Fine Jewellery, and 77 Diamonds across brand, content, SEO, trust, and journey.",
    primary_metric: "harmony_competitive_index",
    value: 74,
    trend_percent: 12,
    summary:
      "A CMO-wide view of how Harmony compares to three named UK peers on strategy-ready criteria, with scored dashboards and ranked initiatives after each full analysis run.",
    user_value:
      "Use this to decide what to do differently next quarter: positioning, creative, SEO, trust, and experience—without guessing.",
    purpose_note:
      "Monitors only the four named brands in this module. Output refreshes when you run full analysis.",
    primary_actions: [
      "Run full analysis and review the benchmark dashboards with marketing and creative leads",
      "Align the top initiatives with your analytics and Search Console validation plan",
    ],
    application_note:
      "Scores are directional and modelled unless you connect first-party data; use this as a decision brief, not a financial audit.",
    metric_display_name: "Harmony competitive index",
    metric_explanations: {
      primary_metric:
        "harmony_competitive_index summarises Harmony’s relative position vs the three peers in this snapshot.",
      primary_value: "Illustrative composite for planning; each run may shift as Trends and synthesis update.",
      trend_percent: "Movement vs the prior comparable window in the model—confirm with your own benchmarks.",
    },
    detailed_insights: [
      {
        title: "Why named peers",
        body: "Queensmith, Flawless Fine Jewellery, and 77 Diamonds are fixed for consistent comparison.",
        comparison: "Broader peer sets are covered in other modules; this one is for focused benchmarking.",
      },
    ],
    research_sources: [
      {
        label: "Google Trends (UK) brand and category terms",
        scope: "uk_market",
        kind: "live_signal",
        detail: "Interest-over-time where available; may be partial if rate-limited.",
      },
      {
        label: "Public brand positioning synthesis",
        scope: "category_benchmark",
        kind: "editorial_synthesis",
        detail: "Typical luxury jewellery marketing patterns for the named peers—labelled as synthesis.",
      },
    ],
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Peers & competitors", href: "/competitor" },
    ],
  },
  seo: {
    key: "seo",
    title: "UK SEO & Peer Search Patterns",
    narrative:
      "Peers cluster on local intent titles, FAQ and Product schema, and education pages; gaps remain in E-E-A-T depth on high-value UK queries.",
    primary_metric: "peer_adjusted_avg_rank_proxy",
    value: 13.2,
    trend_percent: 25,
    summary:
      "What UK competitors optimise for in organic search and how to refine your SEO: intents, on-page patterns, schema, and measurement.",
    user_value: "Steal-with-pride from peer SERP patterns, then out-educate and out-trust on your own site.",
    purpose_note:
      "Combines UK peer SERP patterns and category SEO best practice. Live ranks vary by day; wire Search Console for ground truth.",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Competitive benchmark", href: "/brand-benchmark" },
    ],
  },
};

/**
 * Ensures Home always lists all seven modules in HOME_MODULE_ORDER.
 * Uses API data when present; otherwise embedded fallbacks (every key has a fallback so cards are never dropped).
 */
export function mergeHomeModuleSections(apiModules: HomeModuleCard[]): HomeModuleCard[] {
  const byKey = Object.fromEntries(apiModules.map((m) => [m.key, m])) as Record<string, HomeModuleCard>;
  return HOME_MODULE_ORDER.map((k) => byKey[k] ?? FALLBACK_BY_KEY[k]).filter((m): m is HomeModuleCard => Boolean(m));
}

/** Full module landing payload when GET /modules/:key fails (e.g. API not restarted). */
export function getFallbackModuleLanding(moduleKey: string): HomeModuleCard | null {
  const fb = FALLBACK_BY_KEY[moduleKey];
  return fb ? { ...fb } : null;
}
