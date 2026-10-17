import type { Brief, Listing } from "./types";

export interface Fit {
  score: number; // 0–100
  reasons: string[];
  gaps: string[];
}

const anyState = (b: Brief) => b.states.length === 0 || b.states.includes("Pan-India");

/** Explainable, rule-based match between a sponsor brief and a listing. */
export function fitScore(listing: Listing, brief: Brief): Fit {
  let score = 0;
  const reasons: string[] = [];
  const gaps: string[] = [];

  // Sport — 35
  if (brief.sports.length === 0) {
    score += 25;
    reasons.push("Open to any sport");
  } else if (brief.sports.includes(listing.sport)) {
    score += 35;
    reasons.push(`Sport match: ${listing.sport}`);
  } else gaps.push(`Brand prefers ${brief.sports.slice(0, 3).join(", ")}`);

  // Region — 25
  if (anyState(brief)) {
    score += 18;
    reasons.push("Brand is open Pan-India");
  } else if (brief.states.includes(listing.state)) {
    score += 25;
    reasons.push(`Same region: ${listing.state}`);
  } else gaps.push(`Brand targets ${brief.states.slice(0, 3).join(", ")}`);

  // Budget — 25: is there a package (or the goal) the brand can afford?
  const prices = listing.packages.map((p) => p.price).sort((a, b) => a - b);
  const cheapest = prices[0] ?? listing.goal;
  const inRange = prices.filter((p) => p >= brief.budgetMin * 0.6 && p <= brief.budgetMax);
  if (inRange.length) {
    score += 25;
    reasons.push(`${inRange.length} package${inRange.length > 1 ? "s" : ""} within budget`);
  } else if (cheapest <= brief.budgetMax * 1.25) {
    score += 12;
    reasons.push("Close to budget");
  } else gaps.push("Packages above brand budget");

  // Formats — 10
  const shared = listing.formats.filter((f) => brief.formats.includes(f));
  if (brief.formats.length === 0) score += 6;
  else if (shared.length) {
    score += Math.min(10, 4 + shared.length * 3);
    reasons.push(`Offers ${shared.slice(0, 2).join(" + ")}`);
  } else gaps.push("Doesn't offer the brand's preferred formats");

  // Level — 5
  if (brief.levels.length === 0 || brief.levels.includes(listing.level)) score += 5;
  else gaps.push(`Brand prefers ${brief.levels.join("/")} level`);

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons, gaps };
}

export function fitTone(score: number): "high" | "mid" | "low" {
  return score >= 75 ? "high" : score >= 50 ? "mid" : "low";
}

/** Best score across several briefs (e.g. all briefs of the current sponsor). */
export function bestFit(listing: Listing, briefs: Brief[]): (Fit & { brief: Brief }) | null {
  let best: (Fit & { brief: Brief }) | null = null;
  for (const b of briefs) {
    const f = fitScore(listing, b);
    if (!best || f.score > best.score) best = { ...f, brief: b };
  }
  return best;
}
