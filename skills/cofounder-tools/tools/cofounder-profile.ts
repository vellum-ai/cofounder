// cofounder_profile executor — store and retrieve company context.
// Actions: get, update, clear.

import { loadState, saveState, now } from "../../../src/state.ts";
import { ok, err, type SkillToolResult } from "../../../src/tool-result.ts";
import type {
  CompanyProfile,
  CompanyStage,
  TeamMember,
} from "../../../src/types.ts";

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

export async function run(
  rawInput: Record<string, unknown>,
): Promise<SkillToolResult> {
  const input = rawInput as unknown as ProfileToolInput;
  const state = loadState();

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
      saveState(state);
      return ok({ profile: updated, message: "Company profile updated." });
    }

    case "clear": {
      state.profile = null;
      saveState(state);
      return ok({ message: "Company profile cleared." });
    }

    default:
      return err(`unknown action: ${String(input.action)}`);
  }
}
