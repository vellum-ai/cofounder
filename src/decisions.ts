// Decision analysis utilities — search, pattern detection,
// and blind-spot generation logic.

import type { Decision, CompanyProfile } from "./types.ts";

/** Search decisions by text query across title, rationale, and tags. */
export function searchDecisions(
  decisions: Decision[],
  query: string,
): Decision[] {
  const q = query.toLowerCase().trim();
  if (!q) return decisions;

  return decisions.filter((d) => {
    const haystack = [
      d.title,
      d.rationale,
      d.alternativesConsidered ?? "",
      d.outcome ?? "",
      ...d.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/** Get the most recent N decisions, sorted by date descending. */
export function recentDecisions(
  decisions: Decision[],
  limit: number = 5,
): Decision[] {
  return [...decisions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

/** Decisions that are stuck — proposed or decided but not implemented,
 *  older than 14 days. */
export function stuckDecisions(decisions: Decision[]): Decision[] {
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return decisions.filter((d) => {
    if (d.status === "implemented" || d.status === "abandoned" || d.status === "reversed") {
      return false;
    }
    return new Date(d.date).getTime() < fourteenDaysAgo;
  });
}

/** Count decisions by status. */
export function decisionBreakdown(decisions: Decision[]): Record<string, number> {
  return decisions.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

/** Generate blind-spot prompts given company context and a proposed plan.
 *  Returns a list of challenge areas the user may not have considered.
 *  These are structured prompts the model will expand into full challenges. */
export function generateBlindSpotAreas(
  profile: CompanyProfile | null,
  plan: string,
): string[] {
  const areas: string[] = [];

  // Universal blind spots
  areas.push(
    "revenue sustainability — does this plan create durable revenue or is it a one-time gain?",
  );
  areas.push(
    "opportunity cost — what are you NOT doing because you're doing this?",
  );
  areas.push(
    "reversibility — can you undo this if it's wrong? What's the cost of reversal?",
  );
  areas.push(
    "timeline risk — what happens if this takes 2x longer than expected?",
  );

  // Context-specific blind spots
  if (profile) {
    if (profile.stage === "idea" || profile.stage === "mvp") {
      areas.push(
        "customer validation — have actual customers asked for this, or is this an assumption?",
      );
    }
    if (profile.stage === "early-revenue" || profile.stage === "scaling") {
      areas.push(
        "operational capacity — can your team absorb this without breaking current operations?",
      );
    }
    if (profile.topChallenges.length > 0) {
      areas.push(
        `alignment with top challenges — how does this address: ${profile.topChallenges.slice(0, 2).join(", ")}?`,
      );
    }
    if (profile.team.length <= 2) {
      areas.push(
        "founder bandwidth — with a small team, who specifically owns execution?",
      );
    }
    if (profile.funding && profile.funding.toLowerCase().includes("runway")) {
      areas.push(
        "cash impact — how does this affect runway? Can you afford to be wrong?",
      );
    }
  }

  // Plan-specific signals
  const planLower = plan.toLowerCase();
  if (planLower.includes("hire") || planLower.includes("recruit")) {
    areas.push(
      "hiring risk — what if the hire doesn't work out? Onboarding cost? Time to productivity?",
    );
  }
  if (planLower.includes("pivot") || planLower.includes("rewrite")) {
    areas.push(
      "sunk cost — what are you throwing away? Is the existing work salvageable?",
    );
  }
  if (planLower.includes("raise") || planLower.includes("fundraise") || planLower.includes("series")) {
    areas.push(
      "dilution and control — what are you giving up? Is the valuation realistic in this market?",
    );
  }
  if (planLower.includes("price") || planLower.includes("pricing")) {
    areas.push(
      "price elasticity — will existing customers churn at the new price? Have you tested it?",
    );
  }
  if (planLower.includes("partnership") || planLower.includes("integration")) {
    areas.push(
      "dependency risk — what happens if the partner changes terms or deprioritizes you?",
    );
  }

  return areas;
}

/** Format company profile as a compact context block for injection. */
export function formatContextBlock(
  profile: CompanyProfile,
  decisions: Decision[],
): string {
  const lines: string[] = ["[Company Context]"];
  lines.push(`- Company: ${profile.name}`);
  lines.push(`- Stage: ${profile.stage}`);
  lines.push(`- Sector: ${profile.sector}`);

  if (profile.topChallenges.length > 0) {
    lines.push(`- Top challenges: ${profile.topChallenges.slice(0, 3).join("; ")}`);
  }

  if (profile.currentFocus) {
    lines.push(`- Current focus: ${profile.currentFocus}`);
  }

  const recent = recentDecisions(decisions, 1);
  if (recent.length > 0) {
    const d = recent[0];
    const dateStr = d.date.split("T")[0];
    lines.push(`- Last decision: ${dateStr} — ${d.title} [${d.status}]`);
  }

  if (profile.team.length > 0) {
    const teamStr = profile.team
      .slice(0, 4)
      .map((t) => `${t.name} (${t.role})`)
      .join(", ");
    lines.push(`- Team: ${teamStr}${profile.team.length > 4 ? `, +${profile.team.length - 4} more` : ""}`);
  }

  return lines.join("\n");
}

/** Check if a text block contains decision-like language. */
export function detectDecisionSignal(text: string): boolean {
  const signals = [
    "i recommend",
    "you should",
    "the tradeoff is",
    "i'd go with",
    "my advice is",
    "the right call is",
    "i think you should",
    "what i'd do",
    "the decision is",
    "let's go with",
    "we should commit to",
    "the best option is",
  ];
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}
