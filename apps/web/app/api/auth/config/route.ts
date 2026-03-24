import { NextResponse } from "next/server";
import { backendBaseUrl } from "../../../../lib/backendBaseUrl";

export async function GET() {
  const url = `${backendBaseUrl()}/auth/config`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { detail: `Could not reach auth config endpoint: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 }
    );
  }
}
