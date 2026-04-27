"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";

import { ExerciseRow } from "@/components/exercises/exercise-row";
import { Button } from "@/components/ui/button";
import type { Exercise, ExerciseCategory } from "@/lib/plan-detail/types";

type ExerciseCategorySectionProps = {
  category: ExerciseCategory;
  expanded: boolean;
  onToggle: () => void;
  onAddExercise: (categoryId: string) => void;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
};

export function ExerciseCategorySection({
  category,
  expanded,
  onToggle,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
}: ExerciseCategorySectionProps) {
  const exercises = category.exercises ?? [];

  return (
    <section className="glass-panel rounded-xl border border-[var(--color-border)] p-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left hover-tint"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[var(--color-text-muted)]" aria-hidden>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <h3 className="truncate font-display text-[15px] font-semibold text-tp-primary">
            {category.name}
          </h3>
        </div>
        <span className="rounded-full border border-[var(--color-positive-border)] bg-[var(--color-positive-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-positive)]">
          {exercises.length}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-2">
          {exercises.length === 0 ? (
            <p className="text-[11px] font-body text-tp-muted">No exercises yet - add one</p>
          ) : (
            exercises.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                onEdit={onEditExercise}
                onDelete={onDeleteExercise}
              />
            ))
          )}

          <div className="pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onAddExercise(category.id)}
            >
              <Plus size={14} />
              Add exercise
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
