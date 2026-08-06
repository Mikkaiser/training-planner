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
  team_id: string;
  /** Who made it. Provenance now, not authorization. */
  created_by: string | null;
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

// ── Assessment guide ───────────────────────────────────────────────────

export type AssessmentAspectType = "measurement" | "judgement";

export type AssessmentJudgementDescriptor = { id: string; score: number; descriptor: string };

export type AssessmentAspect = {
  id: string;
  sub_criterion_id: string;
  type: AssessmentAspectType;
  description: string;
  /** The sheet's column F: a deduction rule, or what to look at when judging. */
  extra_description: string | null;
  max_mark: number;
  order_index: number;
  descriptors: AssessmentJudgementDescriptor[];
};

export type AssessmentSubCriterion = {
  id: string;
  criterion_id: string;
  code: string;
  name: string;
  order_index: number;
  aspects: AssessmentAspect[];
};

export type AssessmentCriterion = {
  id: string;
  scheme_id: string;
  letter: string;
  name: string;
  max_measurement: number | null;
  max_judgement: number | null;
  max_total: number | null;
  order_index: number;
  subCriteria: AssessmentSubCriterion[];
};

export type AssessmentScheme = {
  id: string;
  team_id: string;
  /** Who made it. Provenance now, not authorization. */
  created_by: string | null;
  skill: string;
  test_project: string;
  source_file_name: string;
  storage_key: string | null;
  total_max: number;
  created_at: string;
  criteria: AssessmentCriterion[];
};

/** List row: the scheme without its tree, plus counts. */
export type AssessmentSchemeSummary = {
  id: string;
  skill: string;
  test_project: string;
  source_file_name: string;
  total_max: number;
  created_at: string;
  criterion_count: number;
  aspect_count: number;
  run_count: number;
};

export type AssessmentMark = {
  id: string;
  run_id: string;
  aspect_id: string;
  /** Measurement aspects only. */
  awarded: number | null;
  /** Judgement aspects only; the mark itself is derived. */
  judgement_score: number | null;
  comment: string | null;
};

export type AssessmentRun = {
  id: string;
  scheme_id: string;
  plan_id: string | null;
  label: string | null;
  created_at: string;
  updated_at: string;
};

export type AssessmentRunSummary = AssessmentRun & {
  student_name: string | null;
  plan_title: string | null;
  marked_count: number;
};

export type PlanWithPhases = Plan & {
  phases: (Phase & { blocks: BlockWithExercises[] })[];
  gates: Gate[];
};
