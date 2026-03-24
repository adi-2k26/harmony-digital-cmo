/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  /**
   * Proxy FastAPI through Next so the browser calls same-origin `/harmony-api/*` (no CORS).
   * Server-side fetches in api.ts still use NEXT_PUBLIC_API_BASE_URL when `window` is undefined.
   */
  async rewrites() {
    const internal = process.env.API_INTERNAL_URL?.trim();
    const pub = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    const upstream = internal || pub || "http://127.0.0.1:8001";

    // On Vercel, if no explicit API host is configured, rely on `vercel.json`
    // rewrite `/harmony-api/*` -> `/api/harmony/*` (Python function).
    if (!internal && !pub && process.env.VERCEL) {
      return [];
    }

    const base = upstream.replace(/\/+$/, "");
    return [
      {
        source: "/harmony-api/:path*",
        destination: `${base}/:path*`,
      },
    ];
  },
};

export default nextConfig;
