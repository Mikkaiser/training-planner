import type { PlanColorKey } from "@/lib/constants/planColors";

export type TrainingPlanStatus = "draft" | "active" | "completed";

export type Subcompetence = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
};

export type GateType = "phase_gate" | "block_gate";

export type Gate = {
  id?: string;
  name: string;
  description?: string | null;
  gate_type: GateType;
  pass_threshold: number | null;
};

export type Block = {
  id?: string;
  name: string;
  description?: string | null;
  order_index: number;
  subcompetence_id: string | null;
};

export type BlockWithGate = Block & {
  gate: Gate;
};

export type Phase = {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number | null;
  order_index: number | null;
  subcompetences: Subcompetence[];
  blocks: BlockWithGate[];
};

export type PlanDraft = {
  id?: string;
  name: string;
  description: string;
  status: TrainingPlanStatus;
  start_date: string; // YYYY-MM-DD
  color: PlanColorKey;
};

export type PlanPhaseRef = {
  phase_id: string;
  order_index: number; // 1-based
  start_offset_weeks: number;
  phase: Phase;
};

