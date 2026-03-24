import { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl } from "../../../../../lib/backendBaseUrl";

/**
 * Proxies POST /api/modules/:moduleKey/deep-dive → FastAPI POST /modules/:moduleKey/deep-dive
 * so the browser always hits Next (same origin) and the server forwards to the API.
 * Set NEXT_PUBLIC_API_BASE_URL (or API_INTERNAL_URL in Docker) to your FastAPI origin.
 */

export async function POST(req: NextRequest, { params }: { params: { moduleKey: string } }) {

  const moduleKey = params.moduleKey;

  const bodyText = await req.text();

  const url = `${backendBaseUrl()}/modules/${encodeURIComponent(moduleKey)}/deep-dive`;



  try {

    const res = await fetch(url, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: bodyText.length > 0 ? bodyText : "{}",

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

        available: false,

        source: "unavailable",

        content: null,

        message: `Could not reach FastAPI at ${url}: ${e instanceof Error ? e.message : String(e)}`,

      },

      { status: 502 },

    );

  }

}


