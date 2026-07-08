// cofounder_briefing tool — generate a board-meeting-style briefing
// from recent decisions, stuck items, OKR drift, and company context.
// The model calls this to structure a weekly review or board prep.

import {
  RiskLevel,
  type ToolContext,
  type ToolDefinition,
  type ToolExecutionResult,
} from "@vellumai/plugin-api";

import { getState, markDirty, now } from "../src/state.ts";
import {
  recentDecisions,
  stuckDecisions,
  decisionBreakdown,
} from "../src/decisions.ts";
import type { Objective, KeyResult } from "../src/types.ts";

interface BriefingInput {
  // Optional: limit decisions to last N days. Default 7.
  days?: number;
}

function ok(data: unknown): ToolExecutionResult {
  return { content: JSON.stringify(data, null, 2), isError: false };
}

function okrsAtRisk(objectives: Objective[]): { objective: string; krs: KeyResult[] }[] {
  return objectives
    .map((o) => ({
      objective: o.title,
      quarter: o.quarter,
      krs: o.keyResults.filter(
        (kr) => kr.status === "at-risk" || kr.status === "behind" || kr.status === "off-track",
      ),
    }))
    .filter((entry) => entry.krs.length > 0);
}

async function run(input: BriefingInput): Promise<ToolExecutionResult> {
  const state = getState();
  const days = input.days ?? 7;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  // Recent decisions within the window.
  const recent = recentDecisions(state.decisions, 20).filter(
    (d) => new Date(d.date).getTime() >= cutoff,
  );

  // Stuck decisions (proposed/decided but not implemented, >14 days).
  const stuck = stuckDecisions(state.decisions);

  // Decision status breakdown.
  const breakdown = decisionBreakdown(state.decisions);

  // OKRs at risk.
  const atRisk = okrsAtRisk(state.objectives);

  // Update last briefing date.
  state.lastBriefingDate = now();
  markDirty();

  return ok({
    companyProfile: state.profile
      ? {
          name: state.profile.name,
          stage: state.profile.stage,
          sector: state.profile.sector,
          currentFocus: state.profile.currentFocus,
        }
      : null,
    windowDays: days,
    recentDecisions: recent.map((d) => ({
      title: d.title,
      status: d.status,
      date: d.date.split("T")[0],
      rationale: d.rationale,
    })),
    stuckDecisions: stuck.map((d) => ({
      title: d.title,
      status: d.status,
      date: d.date.split("T")[0],
      daysStuck: Math.floor((Date.now() - new Date(d.date).getTime()) / (24 * 60 * 60 * 1000)),
    })),
    decisionStatusBreakdown: breakdown,
    totalDecisions: state.decisions.length,
    okrsAtRisk: atRisk,
    instruction:
      "Structure this as a board-meeting briefing: 1) Executive summary (1-2 sentences), " +
      "2) Decisions this period, 3) Stuck items needing attention, 4) OKR status with drift flags, " +
      "5) Recommended focus for next period. Be concise. Surface what matters, don't list everything.",
  });
}

const tool: ToolDefinition = {
  description:
    "Generate a board-meeting-style briefing from recent decisions, stuck items, " +
    "OKR drift, and company context. Use when the user asks for a weekly review, " +
    "board prep, 'what's the status', or when the weekly-review skill activates. " +
    "Returns structured data the model formats into a readable briefing. " +
    "Optional 'days' parameter limits the decision window (default 7).",
  input_schema: {
    type: "object",
    properties: {
      days: {
        type: "number",
        description: "Number of days to include in the briefing window (default 7).",
      },
    },
  },
  defaultRiskLevel: RiskLevel.Low,
  execute: (input: Record<string, unknown>, _ctx: ToolContext) =>
    run(input as unknown as BriefingInput),
};

export default tool;
