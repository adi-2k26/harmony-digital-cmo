"use client";

import useSWR from "swr";
import { ModuleLandingView } from "../../components/ModuleLandingView";
import { apiFetch } from "../../lib/api";

const fetcher = <T,>(path: string) => apiFetch<T>(path);

export default function SeoPage() {
  const { data, error } = useSWR<any>("/seo/implementation-engine", fetcher, {
    refreshInterval: 300000
  });
  const recommendations = [
    {
      title: "Rank for engagement rings London",
      impact: "Expected +18-25% qualified organic sessions in 60-90 days",
      actions: [
        "Optimise title/meta for local intent pages",
        "Add LocalBusiness and Product schema",
        "Strengthen internal links from bespoke and wedding collections"
      ]
    },
    {
      title: "Capture lab-grown comparison demand",
      impact: "Improved research-stage trust and consultation conversion rate",
      actions: [
        "Publish educational comparison pages",
        "Build FAQ clusters around certification, pricing and quality",
        "Add consultation CTA blocks to informational pages"
      ]
    }
  ];

  return (
    <main className="container">
      <ModuleLandingView moduleKey="seo" />

      <h2 style={{ fontSize: "1.15rem", marginTop: 24 }}>Search &amp; organic growth</h2>
      <p className="muted">Practical UK-focused ideas with rough impact and timing.</p>
      {error ? <p>We couldn&apos;t load this section. Try refreshing the page.</p> : null}
      <section className="grid">
        {recommendations.map((item) => (
          <article className="card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.impact}</p>
            <ul>
              {item.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <section className="grid" style={{ marginTop: 16 }}>
        <article className="card" style={{ gridColumn: "span 3" }}>
          <h3>Implementation Engine (API)</h3>
          <p>
            <strong>Primary Keyword:</strong> {data?.primaryKeyword ?? "Loading..."}
          </p>
          <p>
            <strong>Timeline:</strong> {data?.timeline ?? "-"}
          </p>
          <ul>
            {(data?.actions ?? []).map(
              (item: { step: string; expectedImpact: string; tools: string[] }, idx: number) => (
                <li key={`${item.step}-${idx}`}>
                  {item.step} — {item.expectedImpact}. Tools: {item.tools.join(", ")}
                </li>
              )
            )}
          </ul>
        </article>
      </section>
    </main>
  );
}
