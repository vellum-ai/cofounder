// cofounder_briefing executor — generate a board-meeting-style briefing
// from recent decisions, stuck items, OKR drift, and company context.
// The model calls this to structure a weekly review or board prep.

import { loadState, saveState, now } from "../../../src/state.ts";
import { ok, type SkillToolResult } from "../../../src/tool-result.ts";
import {
  recentDecisions,
  stuckDecisions,
  decisionBreakdown,
} from "../../../src/decisions.ts";
import type { Objective, KeyResult } from "../../../src/types.ts";

interface BriefingInput {
  // Optional: limit decisions to last N days. Default 7.
  days?: number;
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

export async function run(
  rawInput: Record<string, unknown>,
): Promise<SkillToolResult> {
  const input = rawInput as unknown as BriefingInput;
  const state = loadState();
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
  saveState(state);

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
