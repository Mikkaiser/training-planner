"use client";

import { Edit2, FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Exercise } from "@/lib/plan-detail/types";

type ExerciseRowProps = {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
};

const DIFFICULTY_META: Record<
  NonNullable<Exercise["difficulty"]>,
  { label: string; className: string }
> = {
  foundation: { label: "Beginner", className: "badge-difficulty-foundation" },
  intermediate: { label: "Intermediate", className: "badge-difficulty-intermediate" },
  advanced: { label: "Advanced", className: "badge-difficulty-advanced" },
};

export function ExerciseRow({ exercise, onEdit, onDelete }: ExerciseRowProps) {
  const difficultyKey = exercise.difficulty ?? "foundation";
  const difficultyMeta = DIFFICULTY_META[difficultyKey];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-body text-[var(--color-text-primary)]">
            {exercise.title}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${difficultyMeta.className}`}>
            {difficultyMeta.label}
          </span>
          {exercise.file_url ? (
            <span className="inline-flex items-center text-[var(--color-text-muted)]" title="Has file attachment">
              <FileText size={13} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Edit ${exercise.title}`}
          onClick={() => onEdit(exercise)}
        >
          <Edit2 size={14} />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Delete ${exercise.title}`}
          onClick={() => onDelete(exercise.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}
