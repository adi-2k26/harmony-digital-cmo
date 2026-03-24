/**
 * FastAPI origin for server-side proxy routes (Next Route Handlers).
 * Prefer API_INTERNAL_URL in Docker; else NEXT_PUBLIC_API_BASE_URL; else localhost.
 */
export function backendBaseUrl(): string {
  const internal = process.env.API_INTERNAL_URL;
  if (internal != null && String(internal).trim() !== "") {
    return String(internal).replace(/\/+$/, "");
  }
  const pub = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (pub == null || String(pub).trim() === "") {
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl != null && String(vercelUrl).trim() !== "") {
      return `https://${String(vercelUrl).replace(/^https?:\/\//, "").replace(/\/+$/, "")}/harmony-api`;
    }
    return "http://localhost:8001";
  }
  return String(pub).replace(/\/+$/, "");
}
