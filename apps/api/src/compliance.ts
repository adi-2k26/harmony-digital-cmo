export function sanitizeForLogs(input: Record<string, unknown>) {
  const clone = { ...input };
  if ("email" in clone) clone.email = "[redacted]";
  if ("phone" in clone) clone.phone = "[redacted]";
  return clone;
}

export function isUkJewelleryScope(text: string) {
  const lower = text.toLowerCase();
  const ukSignal = lower.includes("london") || lower.includes("uk") || lower.includes("hatton garden");
  const jewellerySignal =
    lower.includes("engagement ring") ||
    lower.includes("wedding band") ||
    lower.includes("diamond") ||
    lower.includes("jewellery");
  return ukSignal && jewellerySignal;
}
