"use client";

import dynamic from "next/dynamic";
import type { ECharts } from "echarts";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import type { BenchmarkChartImages } from "../lib/benchmarkTypes";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const BRAND_COLORS: Record<string, string> = {
  harmony: "#9c5666",
  queensmith: "#5c636f",
  flawless: "#2d6a4f",
  diamonds77: "#bc6c25",
};

const DEFAULT_BRAND_COLOR = "#888";
const SCORE_MAX = 100;

/** Canvas renderer opts — stable reference avoids unnecessary child updates. */
const ECHARTS_CANVAS_OPTS = { renderer: "canvas" as const };

const CHART_HEIGHT_PX = 420;
const HEATMAP_HEIGHT_PX = 380;

type Criterion = { id: string; label: string; description?: string };
type ScoreCell = { score: number; rationale?: string; confidence?: string };
export type BenchmarkDashboard = {
  brands: { id: string; label: string; role: string }[];
  criteria: Criterion[];
  scores: Record<string, Record<string, ScoreCell>>;
  harmony_swot?: { strengths: string[]; gaps: string[]; opportunities: string[] };
  peer_highlights?: Record<string, string[]>;
  initiatives?: {
    title: string;
    rationale?: string;
    impact?: string;
    effort?: string;
    owner_hint?: string;
  }[];
};

export type { BenchmarkChartImages } from "../lib/benchmarkTypes";

export type CompetitiveBenchmarkDashboardHandle = {
  getChartDataUrls: () => BenchmarkChartImages | null;
};

const CHART_EXPORT_OPTS = {
  type: "png" as const,
  pixelRatio: 2,
  backgroundColor: "#ffffff",
};

function brandColor(brandId: string): string {
  return BRAND_COLORS[brandId] ?? DEFAULT_BRAND_COLOR;
}

function scoreAt(
  scores: BenchmarkDashboard["scores"],
  brandId: string,
  criterionId: string
): number {
  const cell = scores[brandId]?.[criterionId];
  return typeof cell?.score === "number" ? cell.score : 0;
}

function buildRadarOption(dashboard: BenchmarkDashboard) {
  const { criteria, scores, brands } = dashboard;
  const indicators = criteria.map((c) => ({ name: c.label, max: SCORE_MAX }));
  return {
    color: brands.map((b) => brandColor(b.id)),
    tooltip: { trigger: "item" as const },
    legend: { bottom: 0, data: brands.map((b) => b.label) },
    radar: {
      indicator: indicators,
      radius: "62%",
      splitNumber: 4,
    },
    series: [
      {
        type: "radar" as const,
        areaStyle: { opacity: 0.08 },
        data: brands.map((b) => ({
          value: criteria.map((c) => scoreAt(scores, b.id, c.id)),
          name: b.label,
          itemStyle: { color: brandColor(b.id) },
        })),
      },
    ],
  };
}

function buildBarOption(dashboard: BenchmarkDashboard) {
  const { criteria, scores, brands } = dashboard;
  const cats = criteria.map((c) => c.label);
  const series = brands.map((b) => ({
    name: b.label,
    type: "bar" as const,
    stack: undefined,
    emphasis: { focus: "series" as const },
    data: criteria.map((c) => scoreAt(scores, b.id, c.id)),
    itemStyle: { color: brandColor(b.id) },
  }));
  return {
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0, data: brands.map((b) => b.label) },
    grid: { left: 48, right: 24, top: 40, bottom: 72, containLabel: true },
    xAxis: { type: "category" as const, data: cats, axisLabel: { rotate: 28, fontSize: 10 } },
    yAxis: { type: "value" as const, min: 0, max: SCORE_MAX, name: "Score" },
    series,
  };
}

function buildHeatmapOption(dashboard: BenchmarkDashboard) {
  const { criteria, scores, brands } = dashboard;
  const data: [number, number, number][] = [];
  brands.forEach((b, yi) => {
    criteria.forEach((c, xi) => {
      data.push([xi, yi, scoreAt(scores, b.id, c.id)]);
    });
  });
  return {
    tooltip: {
      position: "top",
      formatter: (p: { value?: [number, number, number] }) => {
        const v = p.value;
        if (!v) return "";
        const [xi, yi, score] = v;
        const c = criteria[xi];
        const b = brands[yi];
        const cell = scores[b.id]?.[c.id];
        return `${b.label} · ${c.label}<br/>${score} — ${cell?.rationale ?? ""}`;
      },
    },
    grid: { left: 120, top: 40, bottom: 48, right: 24 },
    xAxis: {
      type: "category" as const,
      data: criteria.map((c) => c.label),
      splitArea: { show: true },
      axisLabel: { rotate: 35, fontSize: 9 },
    },
    yAxis: {
      type: "category" as const,
      data: brands.map((b) => b.label),
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: SCORE_MAX,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      inRange: { color: ["#f7f4ee", "#9c5666"] },
    },
    series: [
      {
        name: "Score",
        type: "heatmap" as const,
        data,
        label: { show: true, fontSize: 9 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.2)" } },
      },
    ],
  };
}

function collectChartDataUrls(
  radar: ECharts | null,
  bar: ECharts | null,
  heat: ECharts | null
): BenchmarkChartImages | null {
  try {
    const r = radar?.getDataURL(CHART_EXPORT_OPTS);
    const b = bar?.getDataURL(CHART_EXPORT_OPTS);
    const h = heat?.getDataURL(CHART_EXPORT_OPTS);
    if (!r || !b || !h) return null;
    return { radar: r, bar: b, heatmap: h };
  } catch {
    return null;
  }
}

export const CompetitiveBenchmarkDashboard = forwardRef<
  CompetitiveBenchmarkDashboardHandle,
  { dashboard: BenchmarkDashboard }
>(function CompetitiveBenchmarkDashboard({ dashboard }, ref) {
  const radarInstanceRef = useRef<ECharts | null>(null);
  const barInstanceRef = useRef<ECharts | null>(null);
  const heatInstanceRef = useRef<ECharts | null>(null);

  const radarOpt = useMemo(() => buildRadarOption(dashboard), [dashboard]);
  const barOpt = useMemo(() => buildBarOption(dashboard), [dashboard]);
  const heatOpt = useMemo(() => buildHeatmapOption(dashboard), [dashboard]);

  useImperativeHandle(
    ref,
    () => ({
      getChartDataUrls: () =>
        collectChartDataUrls(radarInstanceRef.current, barInstanceRef.current, heatInstanceRef.current),
    }),
    []
  );

  const swot = dashboard.harmony_swot;
  const peers = dashboard.peer_highlights ?? {};
  const initiatives = dashboard.initiatives ?? [];

  return (
    <section className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Competitive benchmark dashboards</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
        Harmony Jewels vs Queensmith, Flawless Fine Jewellery, and 77 Diamonds — scores refresh on each full
        analysis run.
      </p>

      <h4 style={{ fontSize: "1rem", marginBottom: 8 }}>Radar — all brands</h4>
      <ReactECharts
        option={radarOpt}
        style={{ height: CHART_HEIGHT_PX }}
        opts={ECHARTS_CANVAS_OPTS}
        onChartReady={(instance) => {
          radarInstanceRef.current = instance;
        }}
      />

      <h4 style={{ fontSize: "1rem", marginTop: 20, marginBottom: 8 }}>Grouped bar — criteria by brand</h4>
      <ReactECharts
        option={barOpt}
        style={{ height: CHART_HEIGHT_PX }}
        opts={ECHARTS_CANVAS_OPTS}
        onChartReady={(instance) => {
          barInstanceRef.current = instance;
        }}
      />

      <h4 style={{ fontSize: "1rem", marginTop: 20, marginBottom: 8 }}>Heatmap — brand × criterion</h4>
      <ReactECharts
        option={heatOpt}
        style={{ height: HEATMAP_HEIGHT_PX }}
        opts={ECHARTS_CANVAS_OPTS}
        onChartReady={(instance) => {
          heatInstanceRef.current = instance;
        }}
      />

      {swot ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 20,
          }}
        >
          <article className="card" style={{ margin: 0 }}>
            <h5 style={{ marginTop: 0 }}>Harmony — strengths</h5>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              {(swot.strengths ?? []).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
          <article className="card" style={{ margin: 0 }}>
            <h5 style={{ marginTop: 0 }}>Harmony — gaps</h5>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              {(swot.gaps ?? []).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
          <article className="card" style={{ margin: 0 }}>
            <h5 style={{ marginTop: 0 }}>Harmony — opportunities</h5>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              {(swot.opportunities ?? []).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
        </div>
      ) : null}

      {Object.keys(peers).length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: "1rem", marginBottom: 8 }}>Peer highlights</h4>
          <div className="grid" style={{ gap: 12 }}>
            {Object.entries(peers).map(([k, bullets]) => (
              <article className="card" key={k} style={{ margin: 0 }}>
                <h5 style={{ marginTop: 0, textTransform: "capitalize" }}>
                  {k.replace(/_/g, " ")}
                </h5>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {(bullets || []).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {initiatives.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: "1rem", marginBottom: 8 }}>Prioritised initiatives (Harmony)</h4>
          <div style={{ display: "grid", gap: 10 }}>
            {initiatives.map((it) => (
              <article
                className="card"
                key={it.title}
                style={{ margin: 0, borderLeft: "3px solid var(--accent)" }}
              >
                <strong>{it.title}</strong>
                <p className="muted" style={{ fontSize: 13, margin: "6px 0 0" }}>
                  {it.rationale}
                </p>
                <p className="muted" style={{ fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                  Impact: {it.impact ?? "—"} · Effort: {it.effort ?? "—"} · Owner: {it.owner_hint ?? "—"}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
});
