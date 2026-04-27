export type PlanType = "shared" | "personal";

export type CompetitorPlanSummary = {
  id: string;
  name: string | null;
  plan_type: PlanType;
  owner_competitor_id: string | null;
  color: string | null;
  status: string | null;
  start_date: string | null;
};

export type CompetitorListItem = {
  id: string;
  full_name: string;
  email: string | null;
  avatar_color: string;
  archived: boolean;
  active_plan_id: string | null;
  active_plan: CompetitorPlanSummary | null;
  gates_passed_count: number;
  plans_count: number;
  gate_attempts_count: number;
};

export type CompetitorPlanHistoryItem = {
  id: string;
  training_plan_id: string;
  participation_status: "active" | "archived";
  status: "not_started" | "in_progress" | "completed";
  started_at: string | null;
  completed_at: string | null;
  plan: CompetitorPlanSummary | null;
  gates_passed_count: number;
  gates_total_count: number;
};

export type CompetitorGateHistoryItem = {
  id: string;
  gate_id: string;
  gate_name: string;
  plan_id: string | null;
  plan_name: string | null;
  attempt_date: string;
  score: number;
  passed: boolean;
  notes: string | null;
};

export type CompetitorProfile = {
  id: string;
  full_name: string;
  email: string | null;
  notes: string | null;
  avatar_color: string;
  archived: boolean;
  active_plan_id: string | null;
  active_plan: CompetitorPlanSummary | null;
  active_block_name: string | null;
  total_gates_passed: number;
  plan_history: CompetitorPlanHistoryItem[];
  gate_history: CompetitorGateHistoryItem[];
};
