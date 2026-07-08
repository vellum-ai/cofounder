// cofounder_okr tool — track quarterly objectives and key results.
// Actions: list, add_objective, add_kr, update_kr, remove_objective.

import {
  RiskLevel,
  type ToolContext,
  type ToolDefinition,
  type ToolExecutionResult,
} from "@vellumai/plugin-api";

import { getState, markDirty, generateId, now } from "../src/state.ts";
import type { Objective, KeyResult, OKRStatus } from "../src/types.ts";

type Action = "list" | "add_objective" | "add_kr" | "update_kr" | "remove_objective";

interface OKRToolInput {
  action: Action;
  // add_objective
  title?: string;
  quarter?: string;
  owner?: string;
  // add_kr, update_kr, remove_objective
  objective_id?: string;
  // add_kr
  kr_description?: string;
  kr_target?: string;
  // update_kr
  kr_index?: number;
  kr_current?: string;
  kr_progress?: number;
  kr_status?: OKRStatus;
}

function ok(data: unknown): ToolExecutionResult {
  return { content: JSON.stringify(data, null, 2), isError: false };
}

function err(message: string): ToolExecutionResult {
  return { content: JSON.stringify({ error: message }), isError: true };
}

function deriveStatus(progress: number): OKRStatus {
  if (progress >= 100) return "completed";
  if (progress >= 70) return "on-track";
  if (progress >= 40) return "at-risk";
  if (progress >= 20) return "behind";
  return "off-track";
}

async function run(input: OKRToolInput): Promise<ToolExecutionResult> {
  const state = getState();

  switch (input.action) {
    case "list": {
      return ok({ objectives: state.objectives });
    }

    case "add_objective": {
      if (!input.title) return err("add_objective requires a title");
      if (!input.quarter) return err("add_objective requires a quarter (e.g. '2026-Q3')");

      const objective: Objective = {
        id: generateId("obj"),
        title: input.title,
        quarter: input.quarter,
        keyResults: [],
        owner: input.owner,
      };
      state.objectives.push(objective);
      markDirty();
      return ok({ objective, message: "Objective added." });
    }

    case "add_kr": {
      if (!input.objective_id) return err("add_kr requires objective_id");
      if (!input.kr_description) return err("add_kr requires kr_description");
      if (!input.kr_target) return err("add_kr requires kr_target");

      const obj = state.objectives.find((o) => o.id === input.objective_id);
      if (!obj) return err(`objective not found: ${input.objective_id}`);

      const kr: KeyResult = {
        description: input.kr_description,
        target: input.kr_target,
        current: "",
        progress: 0,
        status: "off-track",
        lastUpdated: now(),
      };
      obj.keyResults.push(kr);
      markDirty();
      return ok({ objective: obj, message: "Key result added." });
    }

    case "update_kr": {
      if (!input.objective_id) return err("update_kr requires objective_id");
      if (input.kr_index === undefined) return err("update_kr requires kr_index");

      const obj = state.objectives.find((o) => o.id === input.objective_id);
      if (!obj) return err(`objective not found: ${input.objective_id}`);
      if (input.kr_index < 0 || input.kr_index >= obj.keyResults.length) {
        return err(`kr_index out of range: ${input.kr_index}`);
      }

      const kr = obj.keyResults[input.kr_index];
      if (input.kr_current !== undefined) kr.current = input.kr_current;
      if (input.kr_progress !== undefined) {
        kr.progress = Math.max(0, Math.min(100, input.kr_progress));
      }
      kr.status = input.kr_status ?? deriveStatus(kr.progress);
      kr.lastUpdated = now();
      markDirty();
      return ok({ keyResult: kr, message: "Key result updated." });
    }

    case "remove_objective": {
      if (!input.objective_id) return err("remove_objective requires objective_id");
      const before = state.objectives.length;
      state.objectives = state.objectives.filter((o) => o.id !== input.objective_id);
      if (state.objectives.length === before) {
        return err(`objective not found: ${input.objective_id}`);
      }
      markDirty();
      return ok({ message: "Objective removed." });
    }

    default:
      return err(`unknown action: ${String(input.action)}`);
  }
}

const tool: ToolDefinition = {
  description:
    "Track quarterly objectives and key results (OKRs) for the co-founder plugin. " +
    "Actions: 'list' (show all objectives), 'add_objective' (create with title, quarter, owner?), " +
    "'add_kr' (add key result to objective: objective_id, kr_description, kr_target), " +
    "'update_kr' (update progress: objective_id, kr_index, kr_current?, kr_progress?, kr_status?), " +
    "'remove_objective' (delete by id). KR status auto-derives from progress if not specified: " +
    "100=completed, 70+=on-track, 40+=at-risk, 20+=behind, <20=off-track. " +
    "Use when the user sets goals, tracks progress, or asks about OKR status.",
  input_schema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["list", "add_objective", "add_kr", "update_kr", "remove_objective"],
        description: "Which operation to perform.",
      },
      title: { type: "string", description: "add_objective: objective title." },
      quarter: { type: "string", description: "add_objective: quarter label, e.g. '2026-Q3'." },
      owner: { type: "string", description: "add_objective: who owns this objective." },
      objective_id: { type: "string", description: "add_kr/update_kr/remove_objective: the objective id." },
      kr_description: { type: "string", description: "add_kr: what the key result measures." },
      kr_target: { type: "string", description: "add_kr: the target value." },
      kr_index: { type: "number", description: "update_kr: index of the key result to update (0-based)." },
      kr_current: { type: "string", description: "update_kr: current value." },
      kr_progress: { type: "number", description: "update_kr: progress percentage 0-100." },
      kr_status: {
        type: "string",
        enum: ["on-track", "at-risk", "behind", "completed", "off-track"],
        description: "update_kr: override auto-derived status.",
      },
    },
    required: ["action"],
  },
  defaultRiskLevel: RiskLevel.Low,
  execute: (input: Record<string, unknown>, _ctx: ToolContext) =>
    run(input as unknown as OKRToolInput),
};

export default tool;
