export type BrandPolicy = {
  blockedPhrases: string[];
  requiredSignals: string[];
  minConfidence: number;
};

const activePolicy: BrandPolicy = {
  blockedPhrases: ["cheap", "budget bling", "mass-market"],
  requiredSignals: ["bespoke", "craftsmanship", "hatton garden"],
  minConfidence: 0.75
};

export function getActivePolicy() {
  return activePolicy;
}
