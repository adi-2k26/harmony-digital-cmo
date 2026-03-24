import { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl } from "../../../../lib/backendBaseUrl";

export async function POST(req: NextRequest) {
  const url = `${backendBaseUrl()}/auth/setup`;
  const bodyText = await req.text();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText.length > 0 ? bodyText : "{}",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { detail: `Could not reach auth setup endpoint: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 }
    );
  }
}
