export type GateStatus = "pending" | "passed" | "failed";

/** Ordered low → high, matching the design's verb-level pill. */
export const VERB_LEVELS = ["Recognize", "Reproduce", "Apply", "Adapt", "Create"] as const;
export type VerbLevel = (typeof VERB_LEVELS)[number];

export const COMPETENCE_TYPES = ["Development", "Testing", "Analysis & Design", "Transversal"] as const;
export type CompetenceType = (typeof COMPETENCE_TYPES)[number];

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

/** 'pending' = row reserved, bytes not confirmed in the bucket yet. */
export type ExerciseStatus = "pending" | "ready";

/** An uploaded document, or a link to material that already lives elsewhere. */
export type ExerciseKind = "file" | "link";

export type Exercise = {
  id: string;
  block_id: string;
  /** For a link this holds its label. */
  file_name: string;
  kind: ExerciseKind;
  /** Null for links. */
  storage_key: string | null;
  content_type: string | null;
  /** Null for files. */
  url: string | null;
  /** Always 0 for links. */
  size_bytes: number;
  status: ExerciseStatus;
  uploaded_by: string | null;
  created_at: string;
  uploaded_at: string | null;
};

export type GateEvent = {
  id: string;
  gate_id: string;
  plan_id: string;
  status: GateStatus;
  changed_by: string | null;
  created_at: string;
};

export type BlockWithExercises = Block & { exercises: Exercise[] };

export type PlanWithPhases = Plan & {
  phases: (Phase & { blocks: BlockWithExercises[] })[];
  gates: Gate[];
};
