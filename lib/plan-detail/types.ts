import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { GateType, Subcompetence } from "@/lib/training-plans/types";

export type PlanDetailPlan = {
  id: string;
  name: string | null;
  description: string | null;
  status: "draft" | "active" | "completed";
  start_date: string | null;
  color: PlanColorKey;
};

export type Competitor = {
  id: string;
  full_name: string;
  avatar_color: string;
};

export type CompetitorProgress = {
  id: string;
  competitor_id: string;
  training_plan_id: string;
  current_topic_id: string | null;
  current_phase_id: string | null;
  status: "not_started" | "in_progress" | "completed";
  started_at: string | null;
  completed_at: string | null;
};

export type BlockItem = {
  id: string;
  phase_id: string;
  subcompetence_id: string | null;
  subcompetence: Subcompetence | null;
  name: string;
  description: string | null;
  order_index: number | null;
  /** 1-based global index across all blocks in the plan (for circle label). */
  global_index: number;
  gate: GateItem;
};

export type GateItem = {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  gate_type: GateType;
  pass_threshold: number | null;
};

export type PhaseWithChildren = {
  id: string;
  name: string;
  description: string | null;
  order_index: number | null;
  duration_weeks: number | null;
  blocks: BlockItem[];
};

export type GateAttempt = {
  id: string;
  gate_id: string;
  competitor_id: string;
  training_plan_id: string;
  attempt_date: string;
  score: number;
  passed: boolean;
  notes: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  recorded_by: string | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  topic_id: string | null;
  subcompetence_id: string | null;
  title: string;
  description: string | null;
  difficulty: "foundation" | "intermediate" | "advanced" | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  preview_url: string | null;
  preview_file_name: string | null;
  created_at: string;
};

export type GateAssessment = {
  id: string;
  gate_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
};

export type PlanDetail = {
  plan: PlanDetailPlan;
  competitors: Competitor[];
  phases: PhaseWithChildren[];
  progressByCompetitor: Map<string, CompetitorProgress>;
  attemptsByGate: Map<string, GateAttempt[]>;
  latestAttemptByGateAndCompetitor: Map<string, GateAttempt>;
  exercisesByBlock: Map<string, Exercise[]>;
  assessmentsByGate: Map<string, GateAssessment[]>;
  /** Flat, plan-ordered list of block IDs for "advance to next block" logic. */
  orderedBlockIds: string[];
  /** Map block id → block for quick lookups. */
  blocksById: Map<string, BlockItem>;
};

export function latestAttemptKey(gateId: string, competitorId: string) {
  return `${gateId}:${competitorId}`;
}
