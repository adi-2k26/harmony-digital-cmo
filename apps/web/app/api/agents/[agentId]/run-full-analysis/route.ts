import { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl } from "../../../../../lib/backendBaseUrl";

/**
 * Proxies POST /api/agents/:agentId/run-full-analysis → FastAPI POST /agents/:agentId/run-full-analysis
 * Body: { "objective": "optional string" }
 */
export async function POST(req: NextRequest, { params }: { params: { agentId: string } }) {
  const agentId = typeof params?.agentId === "string" ? params.agentId.trim() : "";
  if (!agentId) {
    return NextResponse.json({ detail: "Missing agent id in path." }, { status: 400 });
  }

  const base = backendBaseUrl();
  const bodyText = await req.text();
  const url = `${base}/agents/${encodeURIComponent(agentId)}/run-full-analysis`;
  const timeoutMs = Number(process.env.RUN_FULL_ANALYSIS_TIMEOUT_MS || 280000);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyText.length > 0 ? bodyText : "{}",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    const text = await res.text();

    // Upstream 404 almost always means the process at `base` is not this repo's FastAPI (wrong port/env)
    // or an old server that predates POST /agents/{id}/run-full-analysis.
    if (res.status === 404) {
      return NextResponse.json(
        {
          detail:
            `Full-analysis API not found at ${base} (404). Point NEXT_PUBLIC_API_BASE_URL (and in Docker, API_INTERNAL_URL) ` +
            `at the Harmony FastAPI service (default http://localhost:8001), then restart Next.js. ` +
            `Restart FastAPI with: npm run dev:api-fastapi — older processes do not expose /agents/{id}/run-full-analysis.`,
        },
        { status: 502 }
      );
    }
    if (res.status === 408 || res.status === 504) {
      return NextResponse.json(
        {
          detail:
            `Full analysis timed out at ${base} (${res.status}). ` +
            `Retry with a narrower focus, or increase function duration/timeouts for hosted serverless runtime.`,
        },
        { status: 504 }
      );
    }

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return NextResponse.json(
        {
          detail:
            `Full analysis timed out after ${Math.round(timeoutMs / 1000)}s at ${base}. ` +
            `On Vercel, increase function duration and set RUN_FULL_ANALYSIS_TIMEOUT_MS accordingly, ` +
            `or retry with a narrower focus.`,
        },
        { status: 504 }
      );
    }
    return NextResponse.json(
      {
        detail: `Could not reach FastAPI at ${url}: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 502 }
    );
  }
}
