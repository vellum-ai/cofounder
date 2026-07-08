// cofounder_decision executor — log, list, review, and search strategic
// decisions. Actions: log, list, review, search.

import { loadState, saveState, generateId, now } from "../../../src/state.ts";
import { ok, err, type SkillToolResult } from "../../../src/tool-result.ts";
import {
  searchDecisions,
  recentDecisions,
} from "../../../src/decisions.ts";
import type { Decision, DecisionStatus } from "../../../src/types.ts";

type Action = "log" | "list" | "review" | "search";

interface DecisionToolInput {
  action: Action;
  // log
  title?: string;
  rationale?: string;
  alternatives_considered?: string;
  tags?: string[];
  // review
  id?: string;
  status?: DecisionStatus;
  outcome?: string;
  // search / list
  query?: string;
  limit?: number;
}

export async function run(
  rawInput: Record<string, unknown>,
): Promise<SkillToolResult> {
  const input = rawInput as unknown as DecisionToolInput;
  const state = loadState();

  switch (input.action) {
    case "log": {
      if (!input.title) return err("log requires a title");
      if (!input.rationale) return err("log requires a rationale");

      const decision: Decision = {
        id: generateId("dec"),
        title: input.title,
        rationale: input.rationale,
        alternativesConsidered: input.alternatives_considered,
        status: "decided",
        date: now(),
        tags: input.tags ?? [],
      };
      state.decisions.push(decision);
      saveState(state);
      return ok({ decision, message: "Decision logged." });
    }

    case "list": {
      const limit = input.limit ?? 10;
      const recent = recentDecisions(state.decisions, limit);
      return ok({
        decisions: recent,
        total: state.decisions.length,
      });
    }

    case "review": {
      if (!input.id) return err("review requires an id");
      const decision = state.decisions.find((d) => d.id === input.id);
      if (!decision) return err(`decision not found: ${input.id}`);

      if (input.status) decision.status = input.status;
      if (input.outcome) {
        decision.outcome = input.outcome;
        decision.outcomeDate = now();
      }
      saveState(state);
      return ok({ decision, message: "Decision updated." });
    }

    case "search": {
      if (!input.query) return err("search requires a query");
      const results = searchDecisions(state.decisions, input.query);
      return ok({ results, count: results.length });
    }

    default:
      return err(`unknown action: ${String(input.action)}`);
  }
}
