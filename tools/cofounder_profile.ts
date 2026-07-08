// cofounder_profile tool — store and retrieve company context.
// Actions: get, update, clear.

import {
  RiskLevel,
  type ToolContext,
  type ToolDefinition,
  type ToolExecutionResult,
} from "@vellumai/plugin-api";

import { getState, saveState, markDirty, now } from "../src/state.ts";
import type { CompanyProfile, CompanyStage, TeamMember } from "../src/types.ts";

type Action = "get" | "update" | "clear";

interface ProfileToolInput {
  action: Action;
  // update fields (all optional, only provided fields are merged)
  name?: string;
  stage?: CompanyStage;
  sector?: string;
  description?: string;
  team?: TeamMember[];
  funding?: string;
  top_challenges?: string[];
  current_focus?: string;
}

function ok(data: unknown): ToolExecutionResult {
  return { content: JSON.stringify(data, null, 2), isError: false };
}

function err(message: string): ToolExecutionResult {
  return { content: JSON.stringify({ error: message }), isError: true };
}

async function run(input: ProfileToolInput): Promise<ToolExecutionResult> {
  const state = getState();

  switch (input.action) {
    case "get": {
      if (!state.profile) {
        return ok({
          profile: null,
          message: "No company profile yet. Run onboarding to set one up.",
        });
      }
      return ok({ profile: state.profile });
    }

    case "update": {
      const existing = state.profile;
      const updated: CompanyProfile = {
        name: input.name ?? existing?.name ?? "",
        stage: input.stage ?? existing?.stage ?? "idea",
        sector: input.sector ?? existing?.sector ?? "",
        description: input.description ?? existing?.description ?? "",
        team: input.team ?? existing?.team ?? [],
        funding: input.funding ?? existing?.funding,
        topChallenges: input.top_challenges ?? existing?.topChallenges ?? [],
        currentFocus: input.current_focus ?? existing?.currentFocus,
        createdAt: existing?.createdAt ?? now(),
        updatedAt: now(),
      };
      state.profile = updated;
      markDirty();
      return ok({ profile: updated, message: "Company profile updated." });
    }

    case "clear": {
      state.profile = null;
      markDirty();
      return ok({ message: "Company profile cleared." });
    }

    default:
      return err(`unknown action: ${String(input.action)}`);
  }
}

const tool: ToolDefinition = {
  description:
    "Store and retrieve the user's company profile for the co-founder plugin. " +
    "Actions: 'get' (read current profile), 'update' (merge provided fields into profile), " +
    "'clear' (reset profile). Use 'update' during onboarding to build the profile " +
    "incrementally, and later when company context changes. The profile includes: " +
    "name, stage (idea|mvp|early-revenue|scaling|profitable|other), sector, description, " +
    "team (array of {name, role, notes?}), funding, top_challenges (string array), current_focus.",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["get", "update", "clear"],
        description: "Which operation to perform.",
      },
      name: { type: "string", description: "Company name." },
      stage: {
        type: "string",
        enum: ["idea", "mvp", "early-revenue", "scaling", "profitable", "other"],
        description: "Company stage.",
      },
      sector: { type: "string", description: "Industry or sector." },
      description: { type: "string", description: "What the company does, in 1-2 sentences." },
      team: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
            notes: { type: "string" },
          },
          required: ["name", "role"],
        },
        description: "Team members.",
      },
      funding: { type: "string", description: "Funding status, e.g. 'bootstrapped', 'Seed $2M', '$11M cash, 16mo runway'." },
      top_challenges: {
        type: "array",
        items: { type: "string" },
        description: "Top 3 current challenges or priorities.",
      },
      current_focus: { type: "string", description: "What the founder is focused on right now." },
    },
    required: ["action"],
  },
  defaultRiskLevel: RiskLevel.Low,
  execute: (input: Record<string, unknown>, _ctx: ToolContext) =>
    run(input as unknown as ProfileToolInput),
};

export default tool;
