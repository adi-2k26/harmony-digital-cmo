"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "../../../lib/api";
import { resolveIntelligenceModuleKey } from "../../../lib/agentIntelligence";
import { moduleDisplayName } from "../../../lib/displayLabels";
import { getExecutiveSummaryForDashboard } from "../../../lib/intelligenceOutput";

export default function AgentDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { data, error, isLoading } = useSWR(id ? `/agents/${id}` : null, apiFetch<{ agent: Record<string, unknown> }>);
  const [objective, setObjective] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisErr, setAnalysisErr] = useState<string | null>(null);
  const [analysisRun, setAnalysisRun] = useState<{ run: Record<string, unknown> } | null>(null);

  const intelKey = id ? resolveIntelligenceModuleKey(id) : null;

  async function runFullAnalysis() {
    if (!intelKey) return;
    setAnalysisLoading(true);
    setAnalysisErr(null);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(intelKey)}/run-full-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: objective.trim() || undefined }),
      });
      const text = await res.text();
      let payload: { run: Record<string, unknown>; detail?: string } | null = null;
      try {
        payload = JSON.parse(text) as { run: Record<string, unknown>; detail?: string };
      } catch {
        setAnalysisRun(null);
        setAnalysisErr("We could not start the analysis. Please check your connection and try again.");
        return;
      }
      if (!res.ok) {
        setAnalysisRun(null);
        setAnalysisErr(
          typeof payload?.detail === "string"
            ? payload.detail
            : "Analysis is not available right now. Please refresh and try again."
        );
        return;
      }
      if (payload?.run) {
        setAnalysisRun({ run: payload.run });
        if (payload.run.status === "failed") {
          setAnalysisErr(String(payload.run.message ?? "Analysis failed"));
        } else if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("harmony-dashboard-refresh"));
        }
      }
    } catch (e) {
      setAnalysisErr(e instanceof Error ? e.message : "Request did not complete.");
      setAnalysisRun(null);
    } finally {
      setAnalysisLoading(false);
    }
  }

  if (!id) {
    return (
      <main className="container">
        <p>Invalid agent.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="container">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (error || !data?.agent) {
    return (
      <main className="container">
        <p>We couldn&apos;t find this page or load it. Try again from the list.</p>
        <Link href="/agents">Back to specialists</Link>
      </main>
    );
  }

  const a = data.agent;
  const str = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
  const arr = (k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);

  const outSummary =
    analysisRun?.run?.output && typeof analysisRun.run.output === "object"
      ? getExecutiveSummaryForDashboard(analysisRun.run.output as Record<string, unknown>)
      : "";

  return (
    <main className="container proseBlock">
      <p className="muted">
        <Link href="/">Home</Link> / <Link href="/agents">Specialists</Link> / {str("name")}
      </p>
      <h1 style={{ marginBottom: 4 }}>{str("name")}</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        {str("tagline")}
      </p>

      <section className="card">
        <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>What this role does</h2>
        <p>{str("purpose")}</p>
      </section>

      <div className="detailGrid" style={{ marginTop: 16 }}>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>What it draws on</h3>
          <ul>
            {arr("inputs").map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>What you get</h3>
          <ul>
            {arr("outputs").map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="detailGrid" style={{ marginTop: 16 }}>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Typical tasks</h3>
          <ul>
            {arr("what_it_does").map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Examples</h3>
          <ul>
            {arr("example_outputs").map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Brand fit &amp; boundaries</h3>
        <p>
          <strong>Staying on-brand:</strong> {str("brand_dna_notes")}
        </p>
        <p>
          <strong>What it doesn&apos;t do:</strong>
        </p>
        <ul>
          {arr("limitations").map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <div className="detailGrid" style={{ marginTop: 16 }}>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>Rhythm &amp; ownership</h3>
          <p>
            <strong>How often:</strong> {str("cadence")}
          </p>
          <p>
            <strong>If something goes wrong:</strong> {str("failure_handling")}
          </p>
          <p>
            <strong>Owner:</strong> {str("owner")} · <strong>Response aim:</strong> {str("sla")}
          </p>
          <p>
            <strong>Works with:</strong> {arr("dependencies").join(", ")}
          </p>
        </section>
        <section className="card">
          <h3 style={{ marginTop: 0 }}>What it helps improve</h3>
          <ul className="tagList" style={{ display: "block", paddingLeft: 18 }}>
            {arr("kpis_it_moves").map((x) => (
              <li key={x} style={{ listStyle: "disc" }}>
                {x}
              </li>
            ))}
          </ul>
          <p>
            <strong>Passes work to:</strong> {arr("handoffs_to").join(", ")}
          </p>
        </section>
      </div>

      {intelKey ? (
        <section className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Run full analysis</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Run one complete analysis for <strong>{moduleDisplayName(intelKey)}</strong> and get a clear summary with
            practical next steps.
          </p>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 480 }}>
            <span className="muted">Focus (optional)</span>
            <input
              className="searchInput"
              style={{ maxWidth: "100%" }}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Q2 push on oval engagement stories"
            />
          </label>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="btnPrimary" onClick={runFullAnalysis} disabled={analysisLoading}>
              {analysisLoading ? "Analysis in progress..." : "Run full analysis"}
            </button>
          </div>
          {analysisErr ? <p className="moduleError" style={{ marginTop: 10 }}>{analysisErr}</p> : null}
          {outSummary ? (
            <p className="proseBlock" style={{ marginTop: 12, fontSize: 14 }}>
              <strong>Summary:</strong> {outSummary.slice(0, 600)}
              {outSummary.length > 600 ? "…" : ""}
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
