/** Normalised FastAPI origin (no trailing slash). */

function resolveApiBaseUrl(): string {
  const internal = process.env.API_INTERNAL_URL;
  if (internal != null && String(internal).trim() !== "") {
    return String(internal).replace(/\/+$/, "");
  }

  const pub = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (pub != null && String(pub).trim() !== "") {
    return String(pub).replace(/\/+$/, "");
  }

  // Vercel production/preview fallback: same deployment, via rewrite to Python function.
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl != null && String(vercelUrl).trim() !== "") {
    return `https://${String(vercelUrl).replace(/^https?:\/\//, "").replace(/\/+$/, "")}/harmony-api`;
  }

  // Local development fallback.
  return "http://localhost:8001";

}



/**

 * Direct FastAPI origin (for server-side fetches and tooling).

 * In the browser, prefer `getApiOrigin()` so requests go through `/harmony-api` (same-origin, no CORS).

 */

export const API_BASE_URL = resolveApiBaseUrl();



/** Base URL for API calls: same-origin proxy in the browser, direct FastAPI on the server. */

export function getApiOrigin(): string {

  if (typeof window !== "undefined") {

    return "/harmony-api";

  }

  return resolveApiBaseUrl();

}



function joinApiPath(path: string): string {

  const p = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {

    return `/harmony-api${p}`;

  }

  return `${resolveApiBaseUrl()}${p}`;

}



export async function apiFetch<T>(path: string): Promise<T> {

  const url = joinApiPath(path);

  const response = await fetch(url, {

    cache: "no-store",

  });

  if (!response.ok) {

    throw new Error(`We couldn't load this (${response.status}).`);

  }

  return (await response.json()) as T;

}



export async function apiPost<T>(path: string, body?: Record<string, unknown>): Promise<T> {

  const url = joinApiPath(path);

  const response = await fetch(url, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(body ?? {}),

  });

  if (!response.ok) {

    throw new Error(`We couldn't load this (${response.status}).`);

  }

  return (await response.json()) as T;

}


