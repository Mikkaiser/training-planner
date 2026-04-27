"use client";

type Difficulty = "foundation" | "intermediate" | "advanced";

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  foundation: "badge-difficulty-foundation",
  intermediate: "badge-difficulty-intermediate",
  advanced: "badge-difficulty-advanced",
};

const DIFFICULTY_OPTIONS: Difficulty[] = ["foundation", "intermediate", "advanced"];

type ExerciseUploadDifficultyPillsProps = {
  difficulty: Difficulty;
  onDifficultyChange: (next: Difficulty) => void;
};

export function ExerciseUploadDifficultyPills({
  difficulty,
  onDifficultyChange,
}: ExerciseUploadDifficultyPillsProps): React.JSX.Element {
  return (
    <div className="plan-exercise-upload__difficulty">
      <div className="tp-plan-label">Difficulty</div>
      <div className="plan-exercise-upload__difficulty-pills">
        {DIFFICULTY_OPTIONS.map((d) => {
          const active = difficulty === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onDifficultyChange(d)}
              className={`plan-exercise-upload__difficulty-pill ${DIFFICULTY_CLASS[d]}`}
              data-active={active ? "true" : undefined}
              data-outlined={active ? undefined : "true"}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { Difficulty };

