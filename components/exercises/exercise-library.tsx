"use client";

import { useMemo, useState } from "react";

import { ExerciseCategorySection } from "@/components/exercises/exercise-category-section";
import type { Exercise, ExerciseCategory } from "@/lib/plan-detail/types";

type ExerciseLibraryProps = {
  categories: ExerciseCategory[];
  searchValue: string;
  onAddExercise: (categoryId: string) => void;
  onEditExercise: (exercise: Exercise) => void;
  onDeleteExercise: (exerciseId: string) => void;
};

export function ExerciseLibrary({
  categories,
  searchValue,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
}: ExerciseLibraryProps) {
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

  const filteredCategories = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return categories;

    return categories.reduce<ExerciseCategory[]>((accumulator, category) => {
      const categoryMatch = category.name.toLowerCase().includes(query);
      const exercises = (category.exercises ?? []).filter((exercise) =>
        exercise.title.toLowerCase().includes(query)
      );
      if (!categoryMatch && exercises.length === 0) {
        return accumulator;
      }

      accumulator.push({
        ...category,
        exercises: categoryMatch ? category.exercises ?? [] : exercises,
      });
      return accumulator;
    }, []);
  }, [categories, searchValue]);

  if (filteredCategories.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-6 text-center text-sm text-tp-muted">
        No categories or exercises match your search.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredCategories.map((category) => {
        const expanded = expandedById[category.id] ?? true;
        return (
          <ExerciseCategorySection
            key={category.id}
            category={category}
            expanded={expanded}
            onToggle={() =>
              setExpandedById((current) => ({
                ...current,
                [category.id]: !(current[category.id] ?? true),
              }))
            }
            onAddExercise={onAddExercise}
            onEditExercise={onEditExercise}
            onDeleteExercise={onDeleteExercise}
          />
        );
      })}
    </div>
  );
}
