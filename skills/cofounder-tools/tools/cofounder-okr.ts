// cofounder_okr executor — track quarterly objectives and key results.
// Actions: list, add_objective, add_kr, update_kr, remove_objective.

import { loadState, saveState, generateId, now } from "../../../src/state.ts";
import { ok, err, type SkillToolResult } from "../../../src/tool-result.ts";
import type { Objective, KeyResult, OKRStatus } from "../../../src/types.ts";

type Action =
  | "list"
  | "add_objective"
  | "add_kr"
  | "update_kr"
  | "remove_objective";

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

function deriveStatus(progress: number): OKRStatus {
  if (progress >= 100) return "completed";
  if (progress >= 70) return "on-track";
  if (progress >= 40) return "at-risk";
  if (progress >= 20) return "behind";
  return "off-track";
}

export async function run(
  rawInput: Record<string, unknown>,
): Promise<SkillToolResult> {
  const input = rawInput as unknown as OKRToolInput;
  const state = loadState();

  switch (input.action) {
    case "list": {
      return ok({ objectives: state.objectives });
    }

    case "add_objective": {
      if (!input.title) return err("add_objective requires a title");
      if (!input.quarter) {
        return err("add_objective requires a quarter (e.g. '2026-Q3')");
      }

      const objective: Objective = {
        id: generateId("obj"),
        title: input.title,
        quarter: input.quarter,
        keyResults: [],
        owner: input.owner,
      };
      state.objectives.push(objective);
      saveState(state);
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
      saveState(state);
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
      saveState(state);
      return ok({ keyResult: kr, message: "Key result updated." });
    }

    case "remove_objective": {
      if (!input.objective_id) {
        return err("remove_objective requires objective_id");
      }
      const before = state.objectives.length;
      state.objectives = state.objectives.filter(
        (o) => o.id !== input.objective_id,
      );
      if (state.objectives.length === before) {
        return err(`objective not found: ${input.objective_id}`);
      }
      saveState(state);
      return ok({ message: "Objective removed." });
    }

    default:
      return err(`unknown action: ${String(input.action)}`);
  }
}
