// cofounder_blindspot executor — surface blind spots for a proposed plan or
// decision. Uses company context + decision history to generate relevant
// challenges. The model calls this during strategy sessions to structure its
// pushback.

import { loadState, loadConfig } from "../../../src/state.ts";
import { ok, err, type SkillToolResult } from "../../../src/tool-result.ts";
import { generateBlindSpotAreas } from "../../../src/decisions.ts";

interface BlindSpotInput {
  plan: string;
}

export async function run(
  rawInput: Record<string, unknown>,
): Promise<SkillToolResult> {
  const input = rawInput as unknown as BlindSpotInput;
  if (!input.plan || input.plan.trim().length === 0) {
    return err("plan is required");
  }

  const state = loadState();
  const config = loadConfig();

  const areas = generateBlindSpotAreas(state.profile, input.plan);

  // Add relevant past decisions as context for the model.
  const relevantPast = state.decisions
    .filter((d) => {
      const haystack = (d.title + " " + d.rationale + " " + d.tags.join(" ")).toLowerCase();
      return input.plan
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .some((w) => haystack.includes(w));
    })
    .slice(0, 3)
    .map((d) => ({
      title: d.title,
      date: d.date.split("T")[0],
      status: d.status,
      outcome: d.outcome,
    }));

  return ok({
    challengeStyle: config.challengeStyle,
    blindSpotAreas: areas,
    relevantPastDecisions: relevantPast,
    companyStage: state.profile?.stage ?? "unknown",
    instruction:
      config.challengeStyle === "direct"
        ? "Challenge these areas directly. Name what could go wrong. Don't soften."
        : "Explore these areas with the founder. Ask questions that surface the risks.",
  });
}
