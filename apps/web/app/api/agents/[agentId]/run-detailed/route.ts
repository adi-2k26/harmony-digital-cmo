import { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl } from "../../../../../lib/backendBaseUrl";

/**
 * Proxies POST /api/agents/:agentId/run-detailed → FastAPI POST /agents/:agentId/run-detailed
 * so the browser hits Next (same origin); the server forwards to FastAPI (avoids CORS and env mismatches).
 */
export async function POST(_req: NextRequest, { params }: { params: { agentId: string } }) {
  const agentId = params.agentId;
  const url = `${backendBaseUrl()}/agents/${encodeURIComponent(agentId)}/run-detailed`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        detail: `Could not reach FastAPI at ${url}: ${e instanceof Error ? e.message : String(e)}`,
      },
      { status: 502 }
    );
  }
}
