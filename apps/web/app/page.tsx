"use client";

import Link from "next/link";
import type { Route } from "next";
import useSWR from "swr";
import { apiFetch } from "../lib/api";
import { mergeHomeModuleSections } from "../lib/moduleFallbacks";
import { modulePathFromKey } from "../lib/moduleRoutes";

type ModuleSection = {
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

type HomeCopy = {
  title: string;
  summary: string;
  why: string;
};

const SIMPLE_HOME_COPY: Record<string, HomeCopy> = {
  trend: {
    title: "UK Market Trends",
    summary:
      "See what is rising or slowing in UK luxury jewellery demand, so your team can time campaigns with confidence.",
    why: "Best for campaign timing, monthly planning, and budget focus.",
  },
  audience: {
    title: "UK Audience Signals",
    summary:
      "Understand which audience groups are research-led and which are closer to booking, so targeting is clearer.",
    why: "Best for audience targeting, persona focus, and channel messaging.",
  },
  content: {
    title: "Category Content",
    summary:
      "Learn which hooks, formats, and calls-to-action are working in your category, so creative choices are easier.",
    why: "Best for content briefs, planning, and improving creative consistency.",
  },
  competitor: {
    title: "Peers & Competitors",
    summary:
      "Track visible peer patterns and market moves, so your team can differentiate instead of copying noise.",
    why: "Best for positioning, offer framing, and competitive checks.",
  },
  opportunity: {
    title: "Market Opportunities",
    summary:
      "Get a practical priority list of what to do first, next, and later based on likely impact versus effort.",
    why: "Best for action planning, owner assignment, and delivery sequencing.",
  },
  brand_benchmark: {
    title: "Competitive benchmark",
    summary:
      "Compare Harmony Jewels with Queensmith, Flawless Fine Jewellery, and 77 Diamonds on CMO-ready criteria, charts, and initiatives.",
    why: "Best for leadership reviews, differentiation, and quarterly planning.",
  },
  seo: {
    title: "SEO & Organic",
    summary:
      "See how UK search patterns and peer SEO approaches can inform your organic growth and page improvements.",
    why: "Best for search visibility, content structure, and technical SEO priorities.",
  },
};

export default function Home() {
  const { data: enterprise } = useSWR<any>("/dashboards/enterprise", apiFetch, {
    refreshInterval: 120000,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  const modules: ModuleSection[] = mergeHomeModuleSections(enterprise?.module_sections ?? []);
  const actions = (enterprise?.action_recommendations ?? []).slice(0, 3);

  const moduleHref = (m: ModuleSection) => modulePathFromKey(m.key);

  return (
    <main className="container">
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 8 }}>Home</h1>
        <p className="muted" style={{ marginTop: 0, maxWidth: 720 }}>
          See what is moving in UK luxury jewellery so your team can plan campaigns with confidence.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h2 style={{ fontSize: "1.25rem", margin: 0 }}>UK market &amp; peer intelligence</h2>
      </div>
      <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
        Each card gives a quick market view. Open any module to run full analysis and see charts, comparisons, and actions.
      </p>

      <section className="grid" style={{ marginBottom: 24 }}>
        {modules.map((m) => {
          const copy = SIMPLE_HOME_COPY[m.key];
          const title = copy?.title ?? m.title;
          const summary = copy?.summary ?? (m.summary ?? m.narrative);
          const why = copy?.why ?? m.user_value;
          return (
          <article className="card" key={m.key}>
            <h3 style={{ marginTop: 0 }}>{title}</h3>
            <p className="proseBlock" style={{ fontSize: 14, marginTop: 0 }}>
              {summary}
            </p>
            {why ? (
              <p className="muted" style={{ fontSize: 13 }}>
                <strong>Why it matters:</strong> {why}
              </p>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              <Link href={moduleHref(m) as Route} className="appNavLink">
                Open module
              </Link>
            </div>
          </article>
        )})}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Suggested next steps</h3>
        {actions.length === 0 ? (
          <p className="muted">No actions yet. Run a module analysis to generate the next steps.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {actions.map((a: { id: string; title: string; status: string }) => (
              <li key={a.id}>
                <strong>{a.title}</strong> — <span className="muted">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
        <p style={{ marginBottom: 0 }}>
          <Link href="/how-it-works">How this works</Link>
        </p>
      </section>
    </main>
  );
}
