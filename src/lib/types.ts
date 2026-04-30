export type GateStatus = "pending" | "passed" | "failed";

export type VerbLevel = "Recognize" | "Apply" | "Produce" | "Optimize";

export type CompetenceType = "Development" | "Testing" | "Analysis & Design" | "Transversal";

export type Plan = {
  id: string;
  title: string;
  student_name: string;
  instructor_id: string;
  created_at: string;
};

export type Phase = {
  id: string;
  plan_id: string;
  title: string;
  order_index: number;
  created_at: string;
};

export type Block = {
  id: string;
  phase_id: string;
  title: string;
  description: string;
  verb_level: VerbLevel;
  competence_type: CompetenceType;
  hours: number;
  order_index: number;
  created_at: string;
};

export type Gate = {
  id: string;
  plan_id: string;
  after_block_id: string;
  status: GateStatus;
  hours_threshold: number;
  created_at: string;
};

export type PlanWithPhases = Plan & {
  phases: (Phase & { blocks: Block[] })[];
  gates: Gate[];
};
