"use client";

import { useMemo } from "react";

import { useMarkExerciseComplete, useUnmarkExerciseComplete } from "@/lib/hooks/use-exercise-completions";
import type { Exercise, ExerciseCompletion } from "@/lib/plan-detail/types";

type ExerciseCompletionRowProps = {
  exercise: Exercise;
  completion: ExerciseCompletion | null;
  competitorId: string;
  planId: string;
  isInstructor: boolean;
  currentUserId?: string | null;
  markedByName?: string | null;
};

const DIFFICULTY_META: Record<
  NonNullable<Exercise["difficulty"]>,
  { label: string; className: string }
> = {
  foundation: { label: "Beginner", className: "badge-difficulty-foundation" },
  intermediate: { label: "Intermediate", className: "badge-difficulty-intermediate" },
  advanced: { label: "Advanced", className: "badge-difficulty-advanced" },
};

export function ExerciseCompletionRow({
  exercise,
  completion,
  competitorId,
  planId,
  isInstructor,
  currentUserId = null,
  markedByName = null,
}: ExerciseCompletionRowProps): React.JSX.Element {
  const markComplete = useMarkExerciseComplete(exercise.id, competitorId, planId);
  const unmarkComplete = useUnmarkExerciseComplete(exercise.id, competitorId, planId);

  const isCompleted = completion?.completed ?? false;
  const difficultyMeta = DIFFICULTY_META[exercise.difficulty ?? "foundation"];
  const doneLabel = useMemo(() => {
    if (!completion?.completed_at) return null;
    const date = new Date(completion.completed_at);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date);
  }, [completion?.completed_at]);

  const isPending = markComplete.isPending || unmarkComplete.isPending;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-body text-tp-primary">{exercise.title}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${difficultyMeta.className}`}>
            {difficultyMeta.label}
          </span>
        </div>
        {isCompleted && doneLabel ? (
          <p className="mt-1 text-[11px] text-tp-muted">
            Done · {doneLabel}
            {completion?.marked_by &&
            completion.marked_by !== currentUserId &&
            markedByName &&
            markedByName.trim().length > 0
              ? ` · by ${markedByName}`
              : ""}
          </p>
        ) : null}
      </div>

      <label className="inline-flex items-center">
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => {
            if (isCompleted) {
              void unmarkComplete.mutateAsync();
            } else {
              void markComplete.mutateAsync();
            }
          }}
          disabled={!isInstructor || isPending}
          className="h-4 w-4 cursor-pointer rounded border border-[var(--color-border)] accent-[var(--color-accent)] disabled:cursor-not-allowed"
          aria-label={`Mark ${exercise.title} as complete`}
        />
      </label>
    </div>
  );
}
