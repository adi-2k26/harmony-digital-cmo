"use client";

import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { apiFetch, getApiOrigin } from "../../lib/api";
import { moduleDisplayName } from "../../lib/displayLabels";
import { CHART_PRIMARY, CHART_SECONDARY } from "../../lib/colors";
import { getExecutiveSummaryForDashboard } from "../../lib/intelligenceOutput";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const fetcher = <T,>(path: string) => apiFetch<T>(path);

export default function DashboardPage() {
  const engagementChartRef = useRef<any>(null);
  const seoChartRef = useRef<any>(null);
  const platformChartRef = useRef<any>(null);
  const [platform, setPlatform] = useState<"all" | "instagram" | "tiktok" | "meta">("all");
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [objective, setObjective] = useState<"consultations" | "seo_growth" | "engagement">("consultations");
  const [moduleTab, setModuleTab] = useState<
    "trend" | "audience" | "content" | "seo" | "competitor" | "opportunity"
  >("trend");
  const [drilldown, setDrilldown] = useState<{
    metric: string;
    value: number;
    source: string;
  } | null>(null);

  const {
    data: enterprise,
    error: enterpriseError,
    mutate: mutateEnterprise,
  } = useSWR<any>("/dashboards/enterprise", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const { data: comparison } = useSWR<any>("/dashboards/recent-vs-new", fetcher, {
    refreshInterval: 120000
  });
  const { data: reportCenter } = useSWR<any>("/reports/center", fetcher, { refreshInterval: 300000 });
  const { data: actionsResp, mutate: refreshActions } = useSWR<any>("/actions", fetcher, { refreshInterval: 120000 });

  const platformMultiplier = platform === "all" ? 1 : platform === "instagram" ? 1.06 : platform === "tiktok" ? 1.11 : 0.96;
  const rangeMultiplier = range === "7d" ? 0.92 : range === "30d" ? 1 : 1.17;

  const trendSeries = useMemo(
    () => [
      { label: "Historical Baseline", value: Number(((comparison?.historical?.avgEngagement ?? 0) * platformMultiplier).toFixed(2)) },
      { label: "Recent Window", value: Number(((comparison?.recent?.avgEngagement ?? 0) * platformMultiplier * rangeMultiplier).toFixed(2)) }
    ],
    [comparison, platformMultiplier, rangeMultiplier]
  );

  const seoSeries = useMemo(
    () => [
      { label: "Historical Rank", value: Number(((comparison?.historical?.avgSeoPosition ?? 0) / platformMultiplier).toFixed(2)) },
      { label: "Recent Rank", value: Number(((comparison?.recent?.avgSeoPosition ?? 0) / platformMultiplier).toFixed(2)) }
    ],
    [comparison, platformMultiplier]
  );

  const platformBars = useMemo(
    () => [
      { name: "Instagram", score: Number(((enterprise?.kpi_summary?.engagement_quality_score ?? 0) * 1.08 * rangeMultiplier).toFixed(2)) },
      { name: "TikTok", score: Number(((enterprise?.kpi_summary?.engagement_quality_score ?? 0) * 1.14 * rangeMultiplier).toFixed(2)) },
      { name: "Meta", score: Number(((enterprise?.kpi_summary?.engagement_quality_score ?? 0) * 0.95 * rangeMultiplier).toFixed(2)) }
    ],
    [enterprise, rangeMultiplier]
  );

  const onChartClick = (source: string) => (params: { name?: string; value?: number }) => {
    setDrilldown({
      source,
      metric: params.name ?? "Unknown",
      value: Number(params.value ?? 0)
    });
  };

  const activeModule = enterprise?.module_sections?.find((item: { key: string }) => item.key === moduleTab);
  const actions = actionsResp?.actions ?? enterprise?.action_recommendations ?? [];

  async function updateActionStatus(id: string, status: "draft" | "ready_for_review" | "approved" | "rejected") {
    await fetch(`${getApiOrigin()}/actions/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    refreshActions();
  }

  function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const rows = [
      ["metric", "value"],
      ["consultation_intent_score", String(enterprise?.kpi_summary?.consultation_intent_score ?? "")],
      ["organic_growth_percent", String(enterprise?.kpi_summary?.organic_growth_percent ?? "")],
      ["engagement_quality_score", String(enterprise?.kpi_summary?.engagement_quality_score ?? "")],
      ["avg_rank_position", String(enterprise?.kpi_summary?.avg_rank_position ?? "")]
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    downloadFile(`uk-market-dashboard-${Date.now()}.csv`, csv, "text/csv;charset=utf-8;");
  }

  function getChartImage(instance: any): string | null {
    if (!instance) return null;
    return instance.getDataURL({ type: "png", pixelRatio: 2, backgroundColor: "#fff" });
  }

  async function exportPdf() {
    const doc = new jsPDF("p", "pt", "a4");
    doc.setFontSize(16);
    doc.text("UK market intelligence dashboard", 40, 40);
    doc.setFontSize(11);
    doc.text(`Platform: ${platform} | Range: ${range} | Objective: ${objective}`, 40, 62);
    doc.text(
      `KPI - Consultation: ${enterprise?.kpi_summary?.consultation_intent_score ?? "-"} | Organic: ${enterprise?.kpi_summary?.organic_growth_percent ?? "-"}`,
      40,
      82
    );

    const images = [
      getChartImage(engagementChartRef.current),
      getChartImage(seoChartRef.current),
      getChartImage(platformChartRef.current)
    ].filter(Boolean) as string[];
    let y = 110;
    for (const img of images) {
      doc.addImage(img, "PNG", 40, y, 520, 150);
      y += 165;
      if (y > 700) {
        doc.addPage();
        y = 40;
      }
    }
    doc.save(`uk-market-dashboard-${Date.now()}.pdf`);
  }

  function exportGraphImages() {
    const items = [
      { name: "engagement-trend", data: getChartImage(engagementChartRef.current) },
      { name: "seo-position", data: getChartImage(seoChartRef.current) },
      { name: "platform-performance", data: getChartImage(platformChartRef.current) }
    ];
    items.forEach((item) => {
      if (!item.data) return;
      const link = document.createElement("a");
      link.href = item.data;
      link.download = `${item.name}-${Date.now()}.png`;
      link.click();
    });
  }

  const kpiExplain = enterprise?.kpi_explanations ?? {};
  const chartCaps = enterprise?.dashboard_chart_captions ?? {};

  useEffect(() => {
    const onResize = () => {
      engagementChartRef.current?.resize?.();
      seoChartRef.current?.resize?.();
      platformChartRef.current?.resize?.();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onRefresh = () => {
      void mutateEnterprise();
    };
    window.addEventListener("harmony-dashboard-refresh", onRefresh);
    return () => window.removeEventListener("harmony-dashboard-refresh", onRefresh);
  }, [mutateEnterprise]);

  return (
    <main className="container">
      <section
        className="card"
        style={{ marginBottom: 16, borderLeft: "4px solid var(--accent)", background: "var(--card-muted-bg)" }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: "1.05rem" }}>Legacy dashboard view</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 10 }}>
          The primary workflow is now module-first. Run <strong>full analysis</strong> inside each module for richer
          charts, comparisons, and downloadable insight output.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link className="appNavLink" href="/trend">UK Market Trends</Link>
          <Link className="appNavLink" href="/audience">UK Audience Signals</Link>
          <Link className="appNavLink" href="/content">Category Content</Link>
          <Link className="appNavLink" href="/competitor">Peers &amp; Competitors</Link>
          <Link className="appNavLink" href="/opportunity">Market Opportunities</Link>
          <Link className="appNavLink" href="/brand-benchmark">Competitive benchmark</Link>
          <Link className="appNavLink" href="/seo">SEO &amp; Organic</Link>
        </div>
      </section>
      <h1>Dashboard</h1>
      <p className="proseBlock" style={{ maxWidth: 820 }}>
        {enterprise?.dashboard_intro ??
          "UK luxury jewellery market intelligence: trends, audiences, content, peers, organic opportunity, and SEO patterns. Figures are directional unless your analytics are connected."}
      </p>
      {enterprise?.generated_at ? (
        <p className="muted" style={{ fontSize: 12, marginTop: -6, marginBottom: 0 }}>
          Last updated: {new Date(String(enterprise.generated_at)).toLocaleString()}
        </p>
      ) : null}
      {enterprise?.source_mode ? (
        <p className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
          Source:{" "}
          {enterprise.source_mode === "hybrid_no_external_api"
            ? "stored snapshots + deterministic fallback (no external APIs)"
            : String(enterprise.source_mode)}
          {enterprise?.refreshed_on_login_at
            ? ` · Refreshed on login: ${new Date(String(enterprise.refreshed_on_login_at)).toLocaleString()}`
            : ""}
        </p>
      ) : null}
      {enterprise?.uk_market_search_overview ? (
        <section className="card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>UK search &amp; market snapshot</h2>
          <p className="proseBlock" style={{ maxWidth: 900, marginBottom: 16 }}>
            {enterprise.uk_market_search_overview}
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {(enterprise.uk_market_search_by_module ?? []).map(
              (row: { module_key: string; title: string; insight: string }) => (
                <details
                  key={row.module_key}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    background: "var(--card)",
                  }}
                >
                  <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 15 }}>{row.title}</summary>
                  <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: 14, lineHeight: 1.55 }}>
                    {row.insight}
                  </p>
                </details>
              )
            )}
          </div>
        </section>
      ) : null}

      {(enterprise?.selected_intelligence_runs ?? []).length > 0 ? (
        <section className="card dashboardIntelRuns" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Saved market reports</h2>
          <p className="muted" style={{ fontSize: 13, marginTop: 0, maxWidth: 900 }}>
            Reports you&apos;ve run from each topic page and chosen to keep here. Use <strong>Hide from dashboard</strong> to
            remove one.
          </p>
          <div className="dashboardIntelRunGrid" style={{ marginTop: 14 }}>
            {(enterprise.selected_intelligence_runs as Array<Record<string, unknown>>).map((run) => (
              <article
                key={String(run.run_id)}
                className="card"
                style={{
                  margin: 0,
                  minHeight: 120,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <strong>{moduleDisplayName(String(run.agent_id))}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {run.completed_at ? new Date(String(run.completed_at)).toLocaleString() : String(run.started_at)}
                  </span>
                </div>
                {run.output && typeof run.output === "object" ? (
                  <p className="proseBlock" style={{ fontSize: 14, margin: 0, flex: 1 }}>
                    <strong>Summary:</strong>{" "}
                    {(() => {
                      const s = getExecutiveSummaryForDashboard(run.output as Record<string, unknown>);
                      return s.length > 320 ? `${s.slice(0, 320)}…` : s;
                    })()}
                  </p>
                ) : (
                  <p className="muted" style={{ fontSize: 13, margin: 0 }}>{String(run.message ?? "No output")}</p>
                )}
                <button
                  type="button"
                  style={{ alignSelf: "flex-start", border: "1px solid var(--border)", padding: "6px 10px", borderRadius: 8, background: "var(--card)", cursor: "pointer" }}
                  onClick={async () => {
                    await fetch(`${getApiOrigin()}/agents/runs/${run.run_id}/select`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ selected: false }),
                    });
                    mutateEnterprise();
                  }}
                >
                  Hide from dashboard
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {enterpriseError ? (
        <section className="card" style={{ marginTop: 12 }}>
          We couldn&apos;t load this page. Check your connection, then refresh. If it keeps happening, ask your team to
          confirm the app is running.
        </section>
      ) : null}
      <section className="card exportRow">
        <button onClick={exportCsv}>Export CSV</button>
        <button onClick={exportPdf}>Export PDF</button>
        <button onClick={exportGraphImages}>Download chart images</button>
      </section>
      <section className="card filterRow stickyFilters">
        <label>
          Platform
          <select value={platform} onChange={(e) => setPlatform(e.target.value as "all" | "instagram" | "tiktok" | "meta")}>
            <option value="all">All</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="meta">Meta</option>
          </select>
        </label>
        <label>
          Date Range
          <select value={range} onChange={(e) => setRange(e.target.value as "7d" | "30d" | "90d")}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </label>
        <label>
          Objective
          <select
            value={objective}
            onChange={(e) =>
              setObjective(e.target.value as "consultations" | "seo_growth" | "engagement")
            }
          >
            <option value="consultations">Consultation Growth</option>
            <option value="seo_growth">SEO Growth</option>
            <option value="engagement">Engagement Quality</option>
          </select>
        </label>
      </section>

      <section className="grid dashboardKpiGrid">
        <article className="card">
          <h3>Consultation interest</h3>
          <p className="kpiValue">{enterprise?.kpi_summary?.consultation_intent_score ?? "-"}</p>
          {kpiExplain.consultation_intent_score ? (
            <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
              {kpiExplain.consultation_intent_score}
            </p>
          ) : null}
        </article>
        <article className="card">
          <h3>Organic Growth %</h3>
          <p className="kpiValue">{enterprise?.kpi_summary?.organic_growth_percent ?? "-"}</p>
          {kpiExplain.organic_growth_percent ? (
            <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
              {kpiExplain.organic_growth_percent}
            </p>
          ) : null}
        </article>
        <article className="card">
          <h3>Engagement quality</h3>
          <p className="kpiValue">{enterprise?.kpi_summary?.engagement_quality_score ?? "-"}</p>
          {kpiExplain.engagement_quality_score ? (
            <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
              {kpiExplain.engagement_quality_score}
            </p>
          ) : null}
        </article>
        <article className="card">
          <h3>Avg Rank Position</h3>
          <p className="kpiValue">{enterprise?.kpi_summary?.avg_rank_position ?? "-"}</p>
          {kpiExplain.avg_rank_position ? (
            <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
              {kpiExplain.avg_rank_position}
            </p>
          ) : null}
        </article>
      </section>

      <section className="card moduleTabs">
        {(["trend", "audience", "content", "seo", "competitor", "opportunity"] as const).map((key) => (
          <button
            className={moduleTab === key ? "activeTab" : ""}
            key={key}
            onClick={() => setModuleTab(key)}
          >
            {moduleDisplayName(key)}
          </button>
        ))}
      </section>

      <section className="dashboardChartsGrid">
        <article className="card">
          <h3>Engagement over time</h3>
          {chartCaps.engagement_trend ? (
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
              {chartCaps.engagement_trend}
            </p>
          ) : null}
          <ReactECharts
            opts={{ renderer: "canvas" }}
            onChartReady={(instance) => {
              engagementChartRef.current = instance;
            }}
            style={{ height: 280 }}
            onEvents={{ click: onChartClick("Engagement Trend") }}
            option={{
              backgroundColor: "transparent",
              grid: { left: 48, right: 24, top: 52, bottom: 44, containLabel: true },
              tooltip: { trigger: "axis", confine: true },
              xAxis: {
                type: "category",
                data: trendSeries.map((x) => x.label),
                name: "Period",
                nameLocation: "middle",
                nameGap: 28
              },
              yAxis: {
                type: "value",
                name: "Engagement %",
                nameLocation: "middle",
                nameGap: 44
              },
              series: [
                {
                  data: trendSeries.map((x) => x.value),
                  type: "line",
                  smooth: true,
                  lineStyle: { color: CHART_PRIMARY, width: 2 },
                  itemStyle: { color: CHART_PRIMARY }
                }
              ]
            }}
          />
        </article>
        <article className="card">
          <h3>Search ranking snapshot</h3>
          {chartCaps.seo_position ? (
            <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
              {chartCaps.seo_position}
            </p>
          ) : null}
          <ReactECharts
            opts={{ renderer: "canvas" }}
            onChartReady={(instance) => {
              seoChartRef.current = instance;
            }}
            style={{ height: 280 }}
            onEvents={{ click: onChartClick("SEO Position") }}
            option={{
              backgroundColor: "transparent",
              grid: { left: 48, right: 24, top: 52, bottom: 44, containLabel: true },
              tooltip: { trigger: "item", confine: true },
              xAxis: {
                type: "category",
                data: seoSeries.map((x) => x.label),
                name: "Window",
                nameLocation: "middle",
                nameGap: 28
              },
              yAxis: {
                type: "value",
                inverse: true,
                name: "Avg rank (lower is better)",
                nameLocation: "middle",
                nameGap: 48
              },
              series: [
                {
                  data: seoSeries.map((x) => x.value),
                  type: "bar",
                  itemStyle: { color: CHART_SECONDARY },
                  barMaxWidth: 48
                }
              ]
            }}
          />
        </article>
        <article className="card">
          <h3>Platform Performance ({objective})</h3>
          <ReactECharts
            opts={{ renderer: "canvas" }}
            onChartReady={(instance) => {
              platformChartRef.current = instance;
            }}
            style={{ height: 280 }}
            onEvents={{ click: onChartClick("Platform Performance") }}
            option={{
              backgroundColor: "transparent",
              grid: { left: 48, right: 24, top: 48, bottom: 44, containLabel: true },
              tooltip: { trigger: "item", confine: true },
              xAxis: {
                type: "category",
                data: platformBars.map((x) => x.name),
                name: "Channel",
                nameLocation: "middle",
                nameGap: 32
              },
              yAxis: {
                type: "value",
                name: "Score",
                nameLocation: "middle",
                nameGap: 40
              },
              series: [
                {
                  data: platformBars.map((x) => x.score),
                  type: "bar",
                  itemStyle: { color: CHART_PRIMARY },
                  barMaxWidth: 56
                }
              ]
            }}
          />
        </article>
      </section>
      <p className="muted" style={{ fontSize: 12, marginTop: 8, marginBottom: 0, maxWidth: 900 }}>
        Chart values reflect your selected platform, range, and objective as <strong>scenario adjustments</strong> applied to
        snapshot-based series—they are illustrative unless first-party analytics are connected.
      </p>
      <section className="grid" style={{ marginTop: 16 }}>
        <article className="card" style={{ gridColumn: "span 2" }}>
          <h3>Topic focus</h3>
          <p>
            <strong>{activeModule?.title ?? "Loading module..."}</strong>
          </p>
          {activeModule?.purpose_note ? (
            <p className="muted" style={{ fontSize: 13 }}>
              <strong>What this module does:</strong> {activeModule.purpose_note}
            </p>
          ) : null}
          <p>{activeModule?.narrative ?? ""}</p>
            <p>
              <strong>Score:</strong> {activeModule?.metric_display_name ?? activeModule?.primary_metric ?? "-"} ·{" "}
              <strong>Reading:</strong> {activeModule?.value ?? "-"} · <strong>Change:</strong>{" "}
              {activeModule?.trend_percent ?? "-"}%
            </p>
          {activeModule?.metric_explanations &&
          typeof activeModule.metric_explanations === "object" &&
          Object.keys(activeModule.metric_explanations).length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ marginBottom: 8 }}>What these numbers mean</h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }} className="muted">
                {Object.entries(activeModule.metric_explanations as Record<string, string>).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}:</strong> {v}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <h4>Trust &amp; freshness</h4>
          {(enterprise?.confidence_and_provenance ?? []).map(
            (
              item: {
                confidence: number;
                source: string;
                collected_at: string;
                refreshed_at: string;
                freshness_sla: string;
              },
              idx: number
            ) => (
              <p key={idx}>
                About {Math.round(item.confidence * 100)}% confidence · from {item.source} · last collected{" "}
                {new Date(item.collected_at).toLocaleString()} · refreshed {new Date(item.refreshed_at).toLocaleString()} ·
                update aim: {item.freshness_sla}
              </p>
            )
          )}
        </article>
        <article className="card">
          <h3>Chart details &amp; next steps</h3>
          {drilldown ? (
            <div>
              <p>
                <strong>Chart:</strong> {drilldown.source}
              </p>
              <p>
                <strong>Bar:</strong> {drilldown.metric}
              </p>
              <p>
                <strong>Reading:</strong> {drilldown.value}
              </p>
              <p>
                Idea: lean into bespoke engagement ring stories for this signal in your last {range} view.
              </p>
            </div>
          ) : (
            <p>Tap a bar or point on a chart to see a short note here.</p>
          )}
          <h4>Tasks</h4>
          {(actions as Array<{ id: string; title: string; status: string }>).map((action) => (
            <div className="actionItem" key={action.id}>
              <p><strong>{action.title}</strong></p>
              <p>Status: {action.status}</p>
              <div className="actionButtons">
                <button onClick={() => updateActionStatus(action.id, "draft")}>Draft</button>
                <button onClick={() => updateActionStatus(action.id, "ready_for_review")}>Review</button>
                <button onClick={() => updateActionStatus(action.id, "approved")}>Approve</button>
                <button onClick={() => updateActionStatus(action.id, "rejected")}>Reject</button>
              </div>
            </div>
          ))}
          <h4>Report Center Snapshot</h4>
          <p><strong>Weekly:</strong> {reportCenter?.weekly_snapshot?.period ?? "loading"}</p>
          <ul>
            {(reportCenter?.weekly_snapshot?.highlights ?? []).map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
