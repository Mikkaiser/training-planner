export type ProfileRole = "admin" | "instructor";

export type TrainingPlanStatus = "draft" | "active" | "completed";

export type ExerciseDifficulty = "foundation" | "intermediate" | "advanced";

export type GateType = "phase_gate" | "block_gate";

export type FileType = "pdf" | "docx";

export type UUID = string;

export type Profile = {
  id: UUID;
  full_name: string | null;
  role: ProfileRole;
  avatar_url: string | null;
  created_at: string;
};

export type ExerciseCategory = {
  id: UUID;
  name: string;
  description: string | null;
  order_index: number;
  exercises?: Exercise[];
};

export type Exercise = {
  id: UUID;
  topic_id: UUID | null;
  subcompetence_id: UUID | null;
  exercise_category_id: UUID | null;
  title: string;
  description: string | null;
  difficulty: ExerciseDifficulty | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  preview_url: string | null;
  preview_file_name: string | null;
  created_at: string;
};

export type ExerciseCompletion = {
  id: UUID;
  exercise_id: UUID;
  competitor_id: UUID;
  plan_id: UUID;
  completed: boolean;
  completed_at: string | null;
  marked_by: UUID | null;
};

