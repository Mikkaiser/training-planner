"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CreateCategoryDialog } from "@/components/exercises/create-category-dialog";
import { CreateExerciseDialog } from "@/components/exercises/create-exercise-dialog";
import { ExerciseLibrary } from "@/components/exercises/exercise-library";
import { PageHeader } from "@/components/layout/page-header";
import { GlassCard } from "@/components/shared/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDeleteExercise,
  useExerciseLibrary,
} from "@/lib/hooks/use-exercise-library";
import type { Exercise } from "@/lib/plan-detail/types";

export default function ExercisesPage() {
  const { data: categories = [], isLoading, error } = useExerciseLibrary();
  const deleteExercise = useDeleteExercise();
  const [searchValue, setSearchValue] = useState("");
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);

  return (
    <div className="space-y-[30px]">
      <PageHeader
        title="Exercises"
        subtitle="Reusable exercise library grouped by category."
      />
      <GlassCard>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              className="glass-input md:max-w-md"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by exercise title or category..."
              aria-label="Search exercises"
            />
            <Button
              type="button"
              onClick={() => setCreateCategoryOpen(true)}
              className="gap-1.5 md:w-auto"
            >
              <Plus size={14} />
              New category
            </Button>
          </div>

          {isLoading ? (
            <div className="text-sm text-tp-muted">Loading exercise library...</div>
          ) : null}
          {error ? (
            <div className="text-sm text-[var(--color-negative)]">
              Failed to load exercises. Please refresh and try again.
            </div>
          ) : null}
          {!isLoading && !error ? (
            <ExerciseLibrary
              categories={categories}
              searchValue={searchValue}
              onAddExercise={(categoryId) => {
                setExerciseToEdit(null);
                setDefaultCategoryId(categoryId);
                setExerciseDialogOpen(true);
              }}
              onEditExercise={(exercise) => {
                setExerciseToEdit(exercise);
                setDefaultCategoryId(exercise.exercise_category_id ?? null);
                setExerciseDialogOpen(true);
              }}
              onDeleteExercise={(exerciseId) => {
                void deleteExercise.mutateAsync(exerciseId);
              }}
            />
          ) : null}
        </div>
      </GlassCard>

      <CreateCategoryDialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen} />
      <CreateExerciseDialog
        open={exerciseDialogOpen}
        onOpenChange={setExerciseDialogOpen}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        exerciseToEdit={exerciseToEdit}
      />
    </div>
  );
}
