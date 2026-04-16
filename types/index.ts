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

