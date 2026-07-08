// cofounder_blindspot tool — surface blind spots for a proposed plan or decision.
// Uses company context + decision history to generate relevant challenges.
// The model calls this during strategy sessions to structure its pushback.

import {
  RiskLevel,
  type ToolContext,
  type ToolDefinition,
  type ToolExecutionResult,
} from "@vellumai/plugin-api";

import { getState, getConfig } from "../src/state.ts";
import { generateBlindSpotAreas } from "../src/decisions.ts";

interface BlindSpotInput {
  plan: string;
}

function ok(data: unknown): ToolExecutionResult {
  return { content: JSON.stringify(data, null, 2), isError: false };
}

function err(message: string): ToolExecutionResult {
  return { content: JSON.stringify({ error: message }), isError: true };
}

async function run(input: BlindSpotInput): Promise<ToolExecutionResult> {
  if (!input.plan || input.plan.trim().length === 0) {
    return err("plan is required");
  }

  const state = getState();
  const config = getConfig();

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

const tool: ToolDefinition = {
  description:
    "Surface blind spots for a proposed plan, decision, or strategy. " +
    "Returns challenge areas tailored to the company's stage, team size, and context, " +
    "plus relevant past decisions that may inform the current thinking. " +
    "Use during strategy sessions when the user proposes a direction and you need " +
    "to challenge it as a co-founder would. The challengeStyle config determines " +
    "whether the output is direct pushback or exploratory questions.",
  input_schema: {
    type: "object",
    properties: {
      plan: {
        type: "string",
        description: "The plan, decision, or strategy being evaluated. Be specific.",
      },
    },
    required: ["plan"],
  },
  defaultRiskLevel: RiskLevel.Low,
  execute: (input: Record<string, unknown>, _ctx: ToolContext) =>
    run(input as unknown as BlindSpotInput),
};

export default tool;
