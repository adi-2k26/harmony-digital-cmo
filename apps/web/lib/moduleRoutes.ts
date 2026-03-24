import type { Route } from "next";

/** Maps API module keys to Next.js routes (single-segment paths). */
export function modulePathFromKey(key: string): Route {
  if (key === "brand_benchmark") return "/brand-benchmark";
  return `/${key}` as Route;
}
