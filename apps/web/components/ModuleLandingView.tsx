"use client";

import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { jsPDF } from "jspdf";
import { apiFetch } from "../lib/api";
import type { AgentRunRecord } from "../lib/agentIntelligence";
import { getNarrativeBrief, getStructuredOutput } from "../lib/intelligenceOutput";
import { getFallbackModuleLanding } from "../lib/moduleFallbacks";
import { appendBenchmarkChartsPdfAppendix, downloadBenchmarkChartsAsPngs } from "../lib/moduleBenchmarkExport";
import {
  CompetitiveBenchmarkDashboard,
  type BenchmarkDashboard,
  type CompetitiveBenchmarkDashboardHandle,
} from "./CompetitiveBenchmarkDashboard";

type ModuleInsight = {
  title: string;
  body: string;
  comparison?: string | null;
};

type ResearchSource = {
  label: string;
  scope: string;
  kind: string;
  detail?: string | null;
};

type ModulePayload = {
  key: string;
  title: string;
  narrative: string;
  primary_metric: string;
  metric_display_name?: string | null;
  value: number;
  trend_percent: number;
  summary?: string;
  user_value?: string;
  primary_actions?: string[];
  links?: { label: string; href: string }[];
  purpose_note?: string | null;
  detailed_insights?: ModuleInsight[] | null;
  metric_explanations?: Record<string, string> | null;
  research_sources?: ResearchSource[] | null;
  application_note?: string | null;
};

function cleanDisplayText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\*\*/g, "").trim();
}

function NarrativeBriefSections({ narrative }: { narrative: Record<string, unknown> }) {
  const str = (k: string) => {
    const cleaned = cleanDisplayText(narrative[k]);
    return cleaned || null;
  };
  const actions = Array.isArray(narrative.recommended_actions) ? (narrative.recommended_actions as string[]) : [];

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
      <h3 className="moduleAiHeading" style={{ marginBottom: 12, fontSize: "1.05rem" }}>
        Full narrative
      </h3>
      {str("executive_summary") ? (
        <div style={{ marginBottom: 14 }}>
          <h4 className="moduleAiHeading">Overview</h4>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("executive_summary")}
          </p>
        </div>
      ) : null}
      {str("detailed_analysis") ? (
        <div style={{ marginBottom: 14 }}>
          <h4 className="moduleAiHeading">Detailed analysis</h4>
          <div className="proseBlock" style={{ marginTop: 8 }}>
            {str("detailed_analysis")
              ?.split(/\n\n+/)
              .map((para, i) => (
                <p key={i} style={{ marginTop: i === 0 ? 0 : "0.75rem" }}>
                  {para}
                </p>
              ))}
          </div>
        </div>
      ) : null}
      {str("peer_or_market_notes") ? (
        <div style={{ marginBottom: 14 }}>
          <h4 className="moduleAiHeading">Peer and market notes</h4>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("peer_or_market_notes")}
          </p>
        </div>
      ) : null}
      {str("risks_and_limitations") ? (
        <div style={{ marginBottom: 14 }}>
          <h4 className="moduleAiHeading">Risks and limitations</h4>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("risks_and_limitations")}
          </p>
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <h4 className="moduleAiHeading">Narrative actions</h4>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            {actions.map((a) => (
              <li key={a} className="proseBlock" style={{ fontSize: 14 }}>
                {a}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {str("provenance_note") ? (
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          {str("provenance_note")}
        </p>
      ) : null}
    </div>
  );
}

function firstSentence(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const match = t.match(/^[^.!?]+[.!?]?/);
  return match ? match[0].trim() : t;
}

function IntelOutputSections({ output, moduleKey }: { output: Record<string, unknown>; moduleKey: string }) {
  const str = (k: string) => {
    const cleaned = cleanDisplayText(output[k]);
    return cleaned || null;
  };
  const actions = Array.isArray(output.recommended_actions) ? (output.recommended_actions as string[]) : [];
  const isSeo = moduleKey === "seo";

  return (
    <div style={{ marginTop: 12 }}>
      {str("executive_summary") ? (
        <div style={{ marginBottom: 14 }}>
          <h3 className="moduleAiHeading">Executive summary</h3>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("executive_summary")}
          </p>
        </div>
      ) : null}
      {str("market_signal_breakdown") ? (
        <div style={{ marginBottom: 14 }}>
          <h3 className="moduleAiHeading">What is changing in the market</h3>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("market_signal_breakdown")}
          </p>
        </div>
      ) : null}
      {str("segment_or_intent_analysis") ? (
        <div style={{ marginBottom: 14 }}>
          <h3 className="moduleAiHeading">Audience and buying intent</h3>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("segment_or_intent_analysis")}
          </p>
        </div>
      ) : null}
      {str("peer_pattern_notes") ? (
        <div style={{ marginBottom: 14 }}>
          <h3 className="moduleAiHeading">What similar brands are doing</h3>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("peer_pattern_notes")}
          </p>
        </div>
      ) : null}
      {str("risk_and_confidence") ? (
        <div style={{ marginBottom: 14 }}>
          <h3 className="moduleAiHeading">Things to keep in mind</h3>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("risk_and_confidence")}
          </p>
        </div>
      ) : null}
      {actions.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          <h3 className="moduleAiHeading">Recommended next steps</h3>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            {actions.map((a) => (
              <li key={a} className="proseBlock" style={{ fontSize: 14 }}>
                {a}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {isSeo && str("harmony_priority_playbook") ? (
        <div style={{ marginBottom: 14, borderLeft: "3px solid var(--accent)", paddingLeft: 12 }}>
          <h3 className="moduleAiHeading">Harmony Jewels — priority playbook</h3>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("harmony_priority_playbook")}
          </p>
        </div>
      ) : null}
      {isSeo && str("implementation_plan_30_60_90") ? (
        <div style={{ marginBottom: 14 }}>
          <h3 className="moduleAiHeading">30 / 60 / 90 plan</h3>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("implementation_plan_30_60_90")}
          </p>
        </div>
      ) : null}
      {isSeo && str("expected_visibility_impact_assumptions") ? (
        <div style={{ marginBottom: 14 }}>
          <h3 className="moduleAiHeading">What visibility might change (assumptions)</h3>
          <p className="proseBlock" style={{ fontSize: 14, marginTop: 6 }}>
            {str("expected_visibility_impact_assumptions")}
          </p>
        </div>
      ) : null}
      {str("market_context_used") && isSeo ? (
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          <strong>Context used:</strong> {str("market_context_used")}
        </p>
      ) : null}
    </div>
  );
}

function splitParagraphs(value: unknown): string[] {
  const cleaned = cleanDisplayText(value);
  if (!cleaned) return [];
  return cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function toScoreFromText(value: unknown): number {
  const txt = typeof value === "string" ? value.trim() : "";
  if (!txt) return 0;
  return Math.max(8, Math.min(100, Math.round(txt.length / 9)));
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toPercent(value: number, denominator: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return Math.max(0, Math.min(100, (value / denominator) * 100));
}

type TrendsSeriesStats = {
  latest: number;
  recentAvg: number;
  priorAvg: number;
  deltaPct: number;
  peak: number;
  points: number;
};

function extractTrendsStats(sourceMeta: unknown): TrendsSeriesStats | null {
  if (!sourceMeta || typeof sourceMeta !== "object") return null;
  const sm = sourceMeta as Record<string, unknown>;
  const iot = sm.interest_over_time;
  if (!iot || typeof iot !== "object") return null;
  const data = (iot as Record<string, unknown>).data;
  const columns = (iot as Record<string, unknown>).columns;
  if (!Array.isArray(data) || !Array.isArray(columns) || columns.length < 2) return null;

  const keywordIndexByCol = columns
    .map((c, i) => ({ c: String(c), i }))
    .filter((x) => x.c !== "isPartial" && x.i > 0)
    .map((x) => x.i);
  if (!keywordIndexByCol.length) return null;

  const points = data
    .map((row) => {
      if (!Array.isArray(row)) return null;
      const vals = keywordIndexByCol.map((idx) => toNumber(row[idx])).filter((v): v is number => v !== null);
      if (!vals.length) return null;
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    })
    .filter((v): v is number => v !== null);
  if (points.length < 4) return null;

  const split = Math.floor(points.length / 2);
  const prior = points.slice(0, split);
  const recent = points.slice(split);
  const priorAvg = prior.reduce((a, b) => a + b, 0) / prior.length;
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const latest = points[points.length - 1];
  const peak = Math.max(...points);
  const deltaPct = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;

  return {
    latest,
    recentAvg,
    priorAvg,
    deltaPct,
    peak,
    points: points.length,
  };
}

function formatRelativeTime(timestamp: string): string | null {
  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms)) return null;
  const diffMs = Date.now() - ms;
  const safeDiff = Math.max(0, diffMs);
  const minutes = Math.floor(safeDiff / 60000);
  if (minutes <= 0) return "Last updated just now";
  if (minutes < 60) return `Last updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last updated ${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `Last updated ${days} day${days === 1 ? "" : "s"} ago`;
}

function ModuleInsightDashboard({
  moduleKey,
  metricValue,
  trendPercent,
  structuredOut,
  narrativeOut,
  refreshedAt,
  sourceMeta,
}: {
  moduleKey: string;
  metricValue: number;
  trendPercent: number;
  structuredOut: Record<string, unknown>;
  narrativeOut: Record<string, unknown> | null;
  refreshedAt: string;
  sourceMeta?: Record<string, unknown> | null;
}) {
  const trends = extractTrendsStats(sourceMeta);
  const moduleScorePct = Math.max(0, Math.min(100, Number(metricValue)));
  const changeMagnitudePct = Math.max(0, Math.min(100, Math.abs(Number(trendPercent))));
  const latestInterestPct = trends ? toPercent(trends.latest, 100) : toScoreFromText(structuredOut.market_signal_breakdown);
  const recentAvgPct = trends ? toPercent(trends.recentAvg, 100) : toScoreFromText(structuredOut.segment_or_intent_analysis);
  const priorAvgPct = trends ? toPercent(trends.priorAvg, 100) : toScoreFromText(structuredOut.peer_pattern_notes);
  const actionCount = Array.isArray(structuredOut.recommended_actions)
    ? (structuredOut.recommended_actions as unknown[]).length
    : 0;
  const actionScore = Math.min(100, Math.max(0, actionCount * 14));
  const insightCount = Array.isArray(structuredOut.recommended_actions)
    ? actionCount + (narrativeOut && Array.isArray(narrativeOut.recommended_actions) ? narrativeOut.recommended_actions.length : 0)
    : narrativeOut && Array.isArray(narrativeOut.recommended_actions)
      ? narrativeOut.recommended_actions.length
      : 0;
  const insightCoveragePct = Math.min(100, Math.max(0, insightCount * 8));
  const confidenceScore = toScoreFromText(structuredOut.risk_and_confidence);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const relativeUpdated = useMemo(() => {
    void nowTick;
    return formatRelativeTime(refreshedAt);
  }, [refreshedAt, nowTick]);

  const bars = [
    { label: "Module score", value: Math.round(moduleScorePct) },
    { label: "Change strength", value: Math.round(changeMagnitudePct) },
    { label: "Latest search interest", value: Math.round(latestInterestPct) },
    { label: "Recent avg interest", value: Math.round(recentAvgPct) },
    { label: "Prior avg interest", value: Math.round(priorAvgPct) },
    { label: "Confidence", value: Math.round(confidenceScore) },
    { label: "Action depth", value: Math.round(actionScore) },
    { label: "Insight coverage", value: Math.round(insightCoveragePct) },
  ];

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Quick dashboard</h3>
        {relativeUpdated ? (
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            {relativeUpdated} · {moduleKey.toUpperCase()} module
          </p>
        ) : null}
      </div>
      <div className="moduleVizKpiGrid">
        <article className="card moduleVizKpiCard">
          <span className="muted">Module score</span>
          <strong>{Number(metricValue).toFixed(1)}</strong>
        </article>
        <article className="card moduleVizKpiCard">
          <span className="muted">Change</span>
          <strong>{Number(trendPercent).toFixed(1)}%</strong>
        </article>
        <article className="card moduleVizKpiCard">
          <span className="muted">Insights counted</span>
          <strong>{insightCount}</strong>
        </article>
      </div>
      {trends ? (
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          <article className="card moduleVizKpiCard">
            <span className="muted">Recent avg</span>
            <strong>{trends.recentAvg.toFixed(1)}</strong>
          </article>
          <article className="card moduleVizKpiCard">
            <span className="muted">Prior avg</span>
            <strong>{trends.priorAvg.toFixed(1)}</strong>
          </article>
          <article className="card moduleVizKpiCard">
            <span className="muted">Delta</span>
            <strong>{trends.deltaPct >= 0 ? "+" : ""}{trends.deltaPct.toFixed(1)}%</strong>
          </article>
          <article className="card moduleVizKpiCard">
            <span className="muted">Data points</span>
            <strong>{trends.points}</strong>
          </article>
        </div>
      ) : null}
      <div className="moduleVizBars" style={{ marginTop: 12 }}>
        {bars.map((b) => (
          <div key={b.label} className="moduleVizBarRow">
            <span className="moduleVizLabel">{b.label}</span>
            <div className="moduleVizTrack">
              <div className="moduleVizFill" style={{ width: `${b.value}%` }} />
            </div>
            <span className="moduleVizValue">{b.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

async function fetchModuleLanding(path: string): Promise<{ module: ModulePayload }> {
  try {
    return await apiFetch<{ module: ModulePayload }>(path);
  } catch {
    const key = path.split("/").pop() ?? "";
    const fb = getFallbackModuleLanding(key);
    if (fb) {
      return { module: fb as ModulePayload };
    }
    throw new Error("We couldn't load this topic. Check your connection and try again.");
  }
}

export function ModuleLandingView({ moduleKey }: { moduleKey: string }) {
  const { data, error, isLoading } = useSWR(`/modules/${moduleKey}`, fetchModuleLanding, {
    revalidateOnFocus: false,
  });
  const { data: enterpriseMeta } = useSWR(
    "/dashboards/enterprise",
    apiFetch<{ generated_at?: string; source_mode?: string; refreshed_on_login_at?: string }>,
    { revalidateOnFocus: false }
  );

  const [objective, setObjective] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisRun, setAnalysisRun] = useState<{ run: AgentRunRecord } | null>(null);
  const benchmarkDashboardRef = useRef<CompetitiveBenchmarkDashboardHandle>(null);

  const runFullAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(moduleKey)}/run-full-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: objective.trim() || undefined }),
      });
      const text = await res.text();
      let payload: { run: AgentRunRecord; detail?: string } | null = null;
      try {
        payload = JSON.parse(text) as { run: AgentRunRecord; detail?: string };
      } catch {
        setAnalysisRun(null);
        setAnalysisError(
          "We couldn&apos;t start the analysis. Check your connection or ask your team to restart the app."
        );
        return;
      }
      if (!res.ok) {
        setAnalysisRun(null);
        const rawDetail = payload && typeof payload === "object" && "detail" in payload ? (payload as { detail: unknown }).detail : null;
        const detailStr =
          typeof rawDetail === "string"
            ? rawDetail
            : Array.isArray(rawDetail)
              ? rawDetail.map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : JSON.stringify(x))).join("; ")
              : null;
        setAnalysisError(
          detailStr && detailStr.trim() !== ""
            ? detailStr
            : "The analysis service isn&apos;t responding. Refresh the page or try again shortly."
        );
        return;
      }
      if (payload?.run) {
        setAnalysisRun({ run: payload.run });
        if (payload.run.status === "failed") {
          setAnalysisError(payload.run.message ?? "Analysis failed");
        } else if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("harmony-dashboard-refresh"));
        }
      }
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Request failed");
      setAnalysisRun(null);
    } finally {
      setAnalysisLoading(false);
    }
  }, [moduleKey, objective]);

  if (isLoading) {
    return (
      <section className="card">
        <p className="muted">Loading module…</p>
      </section>
    );
  }
  if (error || !data?.module) {
    return (
      <section className="card">
        <p>We couldn&apos;t load this topic. Check your connection and try again.</p>
      </section>
    );
  }

  const m = data.module;
  const scopeLine = firstSentence(cleanDisplayText(m.summary ?? m.narrative ?? ""));
  const leadParts = [cleanDisplayText(m.purpose_note), scopeLine].filter(Boolean);
  const lead = leadParts.join(" ");

  const structuredOut =
    analysisRun?.run?.output && typeof analysisRun.run.output === "object"
      ? getStructuredOutput(analysisRun.run.output as Record<string, unknown>)
      : null;
  const narrativeOut =
    analysisRun?.run?.output && typeof analysisRun.run.output === "object"
      ? getNarrativeBrief(analysisRun.run.output as Record<string, unknown>)
      : null;
  const provenanceBanner =
    analysisRun?.run?.output &&
    typeof analysisRun.run.output === "object" &&
    typeof (analysisRun.run.output as Record<string, unknown>).provenance_banner === "string"
      ? ((analysisRun.run.output as Record<string, unknown>).provenance_banner as string)
      : null;
  const trendsSource =
    analysisRun?.run?.source_meta && typeof analysisRun.run.source_meta === "object"
      ? String((analysisRun.run.source_meta as Record<string, unknown>).source ?? "")
      : "";
  const trendsNotice =
    trendsSource === "google_trends_cached_fallback"
      ? "Live Trends temporarily rate-limited, using latest cached snapshot."
      : trendsSource === "google_trends_unavailable"
        ? "Live Trends is temporarily unavailable for this run. Using the latest available module intelligence."
        : null;

  function downloadAnalysisPdf() {
    if (!analysisRun?.run || !structuredOut) return;
    const doc = new jsPDF("p", "pt", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 42;
    const contentWidth = pageWidth - margin * 2;
    const rose = [156, 86, 114] as const;
    const textColor = [33, 37, 41] as const;
    const muted = [92, 99, 112] as const;
    let y = margin;

    const ensureSpace = (needed = 36) => {
      if (y + needed <= pageHeight - margin) return;
      doc.addPage();
      y = margin;
    };

    const drawWrapped = (text: string, size = 11, color: readonly number[] = textColor) => {
      const cleaned = text.trim();
      if (!cleaned) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(cleaned, contentWidth);
      ensureSpace(lines.length * (size + 4));
      doc.text(lines, margin, y);
      y += lines.length * (size + 4) + 6;
    };

    const drawTitle = (title: string) => {
      ensureSpace(44);
      doc.setFillColor(247, 235, 240);
      doc.roundedRect(margin - 8, y - 22, contentWidth + 16, 34, 10, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(rose[0], rose[1], rose[2]);
      doc.text(title, margin, y);
      y += 26;
    };

    const drawSection = (heading: string, value: unknown) => {
      const paragraphs = splitParagraphs(value);
      if (!paragraphs.length) return;
      ensureSpace(32);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(rose[0], rose[1], rose[2]);
      doc.text(heading, margin, y);
      y += 14;
      paragraphs.forEach((para) => drawWrapped(para, 11, textColor));
      y += 4;
    };

    const drawList = (heading: string, value: unknown) => {
      const items = Array.isArray(value) ? value.filter((x) => typeof x === "string") : [];
      if (!items.length) return;
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(rose[0], rose[1], rose[2]);
      doc.text(heading, margin, y);
      y += 14;
      items.forEach((item) => {
        drawWrapped(`• ${item as string}`, 11, textColor);
      });
      y += 4;
    };

    drawTitle(`${m.title} — Full Analysis`);
    drawWrapped(
      `Run ${analysisRun.run.run_id.slice(0, 8)} · ${new Date(analysisRun.run.started_at).toLocaleString()}`,
      10,
      muted
    );
    if (provenanceBanner) drawWrapped(provenanceBanner, 10, muted);

    drawSection("Executive summary", structuredOut.executive_summary);
    drawSection("Market signals", structuredOut.market_signal_breakdown);
    drawSection("Segments and intent", structuredOut.segment_or_intent_analysis);
    drawSection("Peer patterns", structuredOut.peer_pattern_notes);
    drawSection("Caveats", structuredOut.risk_and_confidence);
    drawList("Recommended actions", structuredOut.recommended_actions);

    if (moduleKey === "seo") {
      drawSection("Harmony priority playbook", structuredOut.harmony_priority_playbook);
      drawSection("Implementation plan 30/60/90", structuredOut.implementation_plan_30_60_90);
      drawSection(
        "Expected visibility impact assumptions",
        structuredOut.expected_visibility_impact_assumptions
      );
    }

    if (narrativeOut) {
      drawSection("Narrative overview", narrativeOut.executive_summary);
      drawSection("Detailed narrative", narrativeOut.detailed_analysis);
      drawSection("Peer and market notes", narrativeOut.peer_or_market_notes);
      drawSection("Risks and limitations", narrativeOut.risks_and_limitations);
      drawList("Narrative actions", narrativeOut.recommended_actions);
    }

    if (moduleKey === "brand_benchmark") {
      const bd = structuredOut.benchmark_dashboard as Record<string, unknown> | undefined;
      if (bd && typeof bd === "object") {
        const sw = bd.harmony_swot as Record<string, unknown> | undefined;
        if (sw) {
          drawList("Benchmark — Harmony strengths", sw.strengths);
          drawList("Benchmark — Harmony gaps", sw.gaps);
          drawList("Benchmark — Harmony opportunities", sw.opportunities);
        }
        const inits = bd.initiatives;
        if (Array.isArray(inits)) {
          inits.forEach((it: unknown) => {
            if (it && typeof it === "object" && "title" in it) {
              const o = it as Record<string, unknown>;
              drawWrapped(
                `Initiative: ${String(o.title)} — Impact: ${String(o.impact ?? "")} — Effort: ${String(o.effort ?? "")}`,
                10,
                muted
              );
              drawWrapped(String(o.rationale ?? ""), 10, textColor);
            }
          });
        }
      }
    }

    if (moduleKey === "brand_benchmark") {
      const imgs = benchmarkDashboardRef.current?.getChartDataUrls();
      if (imgs) {
        appendBenchmarkChartsPdfAppendix(doc, imgs, { margin, contentWidth, pageHeight }, { rose, muted, textColor });
      }
    }

    doc.save(`${moduleKey}-analysis-${analysisRun.run.run_id.slice(0, 8)}.pdf`);
  }

  function downloadBenchmarkChartPngs() {
    const imgs = benchmarkDashboardRef.current?.getChartDataUrls();
    if (!imgs) return;
    const stamp = `${moduleKey}-${analysisRun?.run?.run_id?.slice(0, 8) ?? "export"}`;
    downloadBenchmarkChartsAsPngs(imgs, stamp);
  }

  return (
    <>
      <header className="moduleHero">
        <p className="muted" style={{ marginBottom: 12 }}>
          <Link href="/">Home</Link>
          {" / "}
          <span>{m.title}</span>
        </p>
        <h1 style={{ marginBottom: 12 }}>{m.title}</h1>
        {lead ? (
          <p className="proseBlock" style={{ margin: 0, maxWidth: 880 }}>
            {lead}
          </p>
        ) : null}

        <div className="moduleNarrativeSection" style={{ marginTop: 24 }}>
          <h2 className="moduleNarrativeHeading">Run full analysis</h2>
          <p className="muted moduleNarrativeLead">
            One run builds a structured UK market view (live search-interest where available) plus a long-form narrative.
            Extra angles beyond live data are clearly labelled as expert synthesis—not scraped feeds. Typically 1–3
            minutes.
          </p>
          <label className="moduleNarrativeLabel" htmlFor={`analysis-focus-${moduleKey}`}>
            Focus (optional)
          </label>
          <div className="moduleNarrativeRow">
            <input
              id={`analysis-focus-${moduleKey}`}
              type="text"
              className="moduleNarrativeInput"
              placeholder="e.g. Q2 engagement ring push"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              aria-describedby={analysisError ? `analysis-err-${moduleKey}` : undefined}
            />
            <button type="button" className="btnPrimary" onClick={runFullAnalysis} disabled={analysisLoading}>
              {analysisLoading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="loadingSpinner" />
                  Running analysis...
                </span>
              ) : (
                "Run full analysis"
              )}
            </button>
          </div>
          {analysisLoading ? (
            <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
              Analysis in progress. Please wait. This can take 1 to 3 minutes.
            </p>
          ) : null}
          {analysisError ? (
            <p className="moduleError moduleNarrativeError" id={`analysis-err-${moduleKey}`} role="alert">
              {analysisError}
            </p>
          ) : null}
          <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
            {analysisRun?.run?.status === "completed"
              ? "Showing your latest full analysis output for this module."
              : "Run full analysis to generate the latest module dashboard and insights."}
            {enterpriseMeta?.source_mode === "hybrid_no_external_api" ? " Hybrid mode is active." : ""}
          </p>
        </div>
      </header>

      {analysisRun?.run?.status === "completed" && structuredOut ? (
        <>
          {moduleKey === "brand_benchmark" &&
          structuredOut.benchmark_dashboard &&
          typeof structuredOut.benchmark_dashboard === "object" ? (
            <CompetitiveBenchmarkDashboard
              ref={benchmarkDashboardRef}
              dashboard={structuredOut.benchmark_dashboard as BenchmarkDashboard}
            />
          ) : (
            <ModuleInsightDashboard
              moduleKey={moduleKey}
              metricValue={m.value}
              trendPercent={m.trend_percent}
              structuredOut={structuredOut}
              narrativeOut={narrativeOut}
              refreshedAt={analysisRun.run.completed_at ?? analysisRun.run.started_at}
              sourceMeta={
                analysisRun.run.source_meta && typeof analysisRun.run.source_meta === "object"
                  ? (analysisRun.run.source_meta as Record<string, unknown>)
                  : null
              }
            />
          )}
          <section className="card moduleAiBlock" style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Your analysis</h2>
            <p className="muted" style={{ fontSize: 12, marginTop: 0 }}>
              Run {analysisRun.run.run_id.slice(0, 8)}… · {new Date(analysisRun.run.started_at).toLocaleString()}
            </p>
            {provenanceBanner ? (
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                {provenanceBanner}
              </p>
            ) : null}
            {trendsNotice ? (
              <p
                className="muted"
                style={{
                  fontSize: 12,
                  marginTop: 0,
                  marginBottom: 12,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "var(--card-muted-bg, #f7f4ee)",
                }}
              >
                {trendsNotice}
              </p>
            ) : null}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "flex-end",
                marginBottom: 10,
              }}
            >
              <button type="button" className="searchTrigger" style={{ maxWidth: 220 }} onClick={downloadAnalysisPdf}>
                Download colorful PDF
              </button>
              {moduleKey === "brand_benchmark" ? (
                <button
                  type="button"
                  className="searchTrigger"
                  style={{ maxWidth: 260 }}
                  onClick={downloadBenchmarkChartPngs}
                  title="Saves three PNG files (radar, bar, heatmap). Allow multiple downloads if your browser asks."
                >
                  Download charts (PNG)
                </button>
              ) : null}
            </div>
            {moduleKey === "brand_benchmark" ? (
              <p className="muted" style={{ fontSize: 11, marginTop: -4, marginBottom: 12, textAlign: "right" }}>
                PDF includes the same charts on extra pages at the end. Use PNG to share individual graphs.
              </p>
            ) : null}
            <h3 style={{ fontSize: "1rem", marginBottom: 8 }}>What this means for your team</h3>
            <IntelOutputSections output={structuredOut} moduleKey={moduleKey} />
            {narrativeOut ? <NarrativeBriefSections narrative={narrativeOut} /> : null}
          </section>
        </>
      ) : null}

      <section className="detailGrid" style={{ marginBottom: 20 }}>
        <article className="card">
          <h3 style={{ marginTop: 0 }}>Market context</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            {cleanDisplayText(m.narrative)}
          </p>
        </article>
        <article className="card">
          <h3 style={{ marginTop: 0 }}>Why it matters</h3>
          <p className="proseBlock" style={{ marginTop: 0 }}>
            {cleanDisplayText(m.user_value) || "Why this matters for your planning will appear here when available."}
          </p>
        </article>
      </section>

      {(m.detailed_insights ?? []).length > 0 ? (
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: "1.15rem", marginBottom: 12 }}>Detailed insights</h2>
          <div className="grid moduleInsightGrid">
            {(m.detailed_insights ?? []).map((ins) => (
              <article className="card" key={ins.title}>
                <h3 style={{ marginTop: 0 }}>{ins.title}</h3>
                <p className="proseBlock" style={{ fontSize: 14, marginTop: 0 }}>
                {cleanDisplayText(ins.body)}
                </p>
                {ins.comparison ? (
                  <p
                    className="muted"
                    style={{
                      fontSize: 13,
                      marginBottom: 0,
                      paddingTop: 8,
                      borderTop: "1px solid var(--border)"
                    }}
                  >
                    <strong>Comparison:</strong> {cleanDisplayText(ins.comparison)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {(m.research_sources ?? []).length > 0 ? (
        <details className="methodologyDetails card" style={{ marginBottom: 20 }}>
          <summary>Where this information comes from</summary>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
            {(m.research_sources ?? []).map((src) => (
              <li key={src.label} style={{ marginBottom: 10 }}>
                <strong>{src.label}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {" "}
                  ({src.scope.replace(/_/g, " ")} · {src.kind.replace(/_/g, " ")})
                </span>
                {src.detail ? (
                  <p className="muted" style={{ fontSize: 13, margin: "4px 0 0" }}>
                    {cleanDisplayText(src.detail)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <section className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Recommended next actions</h3>
        <ul>
          {(m.primary_actions ?? []).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      <footer className="moduleFooterRow">
        {m.application_note ? (
          <section className="card" style={{ flex: "1 1 280px", borderLeft: "3px solid var(--accent)" }}>
            <h3 style={{ marginTop: 0 }}>Applying these insights</h3>
            <p className="proseBlock" style={{ marginTop: 0 }}>
              {cleanDisplayText(m.application_note)}
            </p>
          </section>
        ) : null}
        <section className="card" style={{ flex: "1 1 220px" }}>
          <h3 style={{ marginTop: 0 }}>Related pages</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {(m.links ?? []).map((l) => (
              <Link key={l.href} href={l.href as Route} className="appNavLink">
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      </footer>
    </>
  );
}
