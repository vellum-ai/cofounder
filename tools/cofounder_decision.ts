// cofounder_decision tool — log, list, review, and search strategic decisions.
// Actions: log, list, review, search.

import {
  RiskLevel,
  type ToolContext,
  type ToolDefinition,
  type ToolExecutionResult,
} from "@vellumai/plugin-api";

import { getState, markDirty, generateId, now } from "../src/state.ts";
import { searchDecisions, recentDecisions } from "../src/decisions.ts";
import type { Decision, DecisionStatus } from "../src/types.ts";

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

function ok(data: unknown): ToolExecutionResult {
  return { content: JSON.stringify(data, null, 2), isError: false };
}

function err(message: string): ToolExecutionResult {
  return { content: JSON.stringify({ error: message }), isError: true };
}

async function run(input: DecisionToolInput): Promise<ToolExecutionResult> {
  const state = getState();

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
      markDirty();
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
      markDirty();
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

const tool: ToolDefinition = {
  description:
    "Log, list, review, and search strategic decisions for the co-founder plugin. " +
    "Actions: 'log' (create a new decision with title, rationale, alternatives_considered?, tags?), " +
    "'list' (get recent decisions, optional limit), " +
    "'review' (update a decision's status and outcome by id), " +
    "'search' (find decisions by text query across title, rationale, tags, outcome). " +
    "Decision statuses: proposed, decided, implemented, reversed, abandoned. " +
    "Use this when the user makes a strategic choice, wants to review past decisions, " +
    "or asks 'what did I decide about...'.",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["log", "list", "review", "search"],
        description: "Which operation to perform.",
      },
      title: { type: "string", description: "log: short title for the decision." },
      rationale: { type: "string", description: "log: why this decision was made." },
      alternatives_considered: { type: "string", description: "log: what alternatives were weighed." },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "log: tags for categorization (e.g. 'pricing', 'hiring', 'fundraising').",
      },
      id: { type: "string", description: "review: the decision id to update." },
      status: {
        type: "string",
        enum: ["proposed", "decided", "implemented", "reversed", "abandoned"],
        description: "review: new status for the decision.",
      },
      outcome: { type: "string", description: "review: what happened as a result." },
      query: { type: "string", description: "search: text to search for." },
      limit: { type: "number", description: "list: max number of decisions to return (default 10)." },
    },
    required: ["action"],
  },
  defaultRiskLevel: RiskLevel.Low,
  execute: (input: Record<string, unknown>, _ctx: ToolContext) =>
    run(input as unknown as DecisionToolInput),
};

export default tool;
