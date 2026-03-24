/** Helpers for agent run `output` — supports legacy flat JSON and full-analysis `{ structured, narrative_brief }`. */

export function getStructuredOutput(
  output: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!output || typeof output !== "object") return null;
  if ("structured" in output && output.structured && typeof output.structured === "object") {
    return output.structured as Record<string, unknown>;
  }
  return output as Record<string, unknown>;
}

export function getNarrativeBrief(
  output: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!output || typeof output !== "object") return null;
  const nb = output.narrative_brief;
  if (nb && typeof nb === "object") return nb as Record<string, unknown>;
  return null;
}

export function getExecutiveSummaryForDashboard(output: Record<string, unknown> | null | undefined): string {
  const s = getStructuredOutput(output);
  const ex =
    (s?.executive_summary as string | undefined) ??
    ((output as Record<string, unknown>)?.executive_summary as string | undefined);
  return typeof ex === "string" ? ex : "";
}
