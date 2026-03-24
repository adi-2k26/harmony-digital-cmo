/** User-facing names for internal module keys (no jargon in UI). */
export const MODULE_DISPLAY_NAME: Record<string, string> = {
  trend: "Market trends",
  audience: "Audience signals",
  content: "Category content",
  competitor: "Peers & competitors",
  opportunity: "Opportunities",
  brand_benchmark: "Competitive benchmark",
  seo: "SEO & search",
};

export function moduleDisplayName(key: string): string {
  return MODULE_DISPLAY_NAME[key] ?? key.replace(/_/g, " ");
}
