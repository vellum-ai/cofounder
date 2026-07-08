// Core type definitions for the cofounder plugin.

export type ChallengeStyle = "direct" | "supportive";
export type BriefingCadence = "weekly" | "biweekly" | "monthly";

export interface CofounderConfig {
  challengeStyle: ChallengeStyle;
  autoLogDecisions: boolean;
  briefingCadence: BriefingCadence;
  contextInjection: boolean;
}

export type CompanyStage =
  | "idea"
  | "mvp"
  | "early-revenue"
  | "scaling"
  | "profitable"
  | "other";

export interface TeamMember {
  name: string;
  role: string;
  notes?: string;
}

export interface CompanyProfile {
  name: string;
  stage: CompanyStage;
  sector: string;
  description: string;
  team: TeamMember[];
  funding?: string;
  topChallenges: string[];
  currentFocus?: string;
  createdAt: string;
  updatedAt: string;
}

export type DecisionStatus = "proposed" | "decided" | "implemented" | "reversed" | "abandoned";

export interface Decision {
  id: string;
  title: string;
  rationale: string;
  alternativesConsidered?: string;
  status: DecisionStatus;
  date: string;
  outcome?: string;
  outcomeDate?: string;
  tags: string[];
}

export type OKRStatus = "on-track" | "at-risk" | "behind" | "completed" | "off-track";

export interface KeyResult {
  description: string;
  target: string;
  current: string;
  progress: number; // 0-100
  status: OKRStatus;
  lastUpdated: string;
}

export interface Objective {
  id: string;
  title: string;
  quarter: string; // e.g. "2026-Q3"
  keyResults: KeyResult[];
  owner?: string;
}

export interface CompanyState {
  profile: CompanyProfile | null;
  decisions: Decision[];
  objectives: Objective[];
  lastBriefingDate?: string;
  version: number;
}

export function createDefaultState(): CompanyState {
  return {
    profile: null,
    decisions: [],
    objectives: [],
    version: 1,
  };
}

export function createDefaultConfig(): CofounderConfig {
  return {
    challengeStyle: "direct",
    autoLogDecisions: true,
    briefingCadence: "weekly",
    contextInjection: true,
  };
}
