import type { Route } from "next";

export type SearchItem = {
  id: string;
  label: string;
  href: Route;
  group: string;
  keywords: string;
};

/** Primary navigation + searchable metadata (UK spelling). */
export const PRIMARY_NAV: SearchItem[] = [
  { id: "home", label: "Home", href: "/", group: "Core", keywords: "home overview command centre kpi" },
  { id: "trend", label: "UK Market Trends", href: "/trend", group: "Modules", keywords: "uk market trends engagement rings social" },
  { id: "audience", label: "UK Audience Signals", href: "/audience", group: "Modules", keywords: "audience segments consultation uk" },
  { id: "content", label: "Category Content", href: "/content", group: "Modules", keywords: "content reels captions category" },
  { id: "competitor", label: "Peers & Competitors", href: "/competitor", group: "Modules", keywords: "competitors serp uk jewellers peers" },
  { id: "opportunity", label: "Market Opportunities", href: "/opportunity", group: "Modules", keywords: "opportunities roadmap impact effort uk" },
  {
    id: "brand_benchmark",
    label: "Competitive benchmark",
    href: "/brand-benchmark",
    group: "Modules",
    keywords: "queensmith 77 diamonds flawless harmony peers benchmark cmo",
  },
  { id: "seo", label: "SEO & Organic", href: "/seo", group: "Core", keywords: "seo schema keywords london" },
  { id: "agents", label: "Specialists", href: "/agents", group: "Core", keywords: "agents ai catalog automation team" },
  { id: "how", label: "How it works", href: "/how-it-works", group: "Core", keywords: "pipeline workflow architecture data" }
];

export const AGENT_ROUTE_PREFIX = "/agents/";
