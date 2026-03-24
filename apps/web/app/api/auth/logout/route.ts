import { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl } from "../../../../lib/backendBaseUrl";

export async function POST(req: NextRequest) {
  const url = `${backendBaseUrl()}/auth/logout`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Cookie: req.headers.get("cookie") ?? "",
      },
    });
    const text = await res.text();
    const out = new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) out.headers.set("set-cookie", setCookie);
    return out;
  } catch (e) {
    return NextResponse.json(
      { detail: `Could not reach auth logout endpoint: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 }
    );
  }
}
