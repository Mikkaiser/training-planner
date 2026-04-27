"use client";

import { useEffect, useMemo, useState } from "react";

import { FileUpload } from "@/components/shared/file-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateExercise,
  useUpdateExercise,
} from "@/lib/hooks/use-exercise-library";
import type { Exercise, ExerciseCategory } from "@/lib/plan-detail/types";
import type { UploadResult } from "@/lib/storage/storage";

type CreateExerciseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExerciseCategory[];
  defaultCategoryId?: string | null;
  exerciseToEdit?: Exercise | null;
};

const DIFFICULTY_OPTIONS = [
  { value: "foundation", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export function CreateExerciseDialog({
  open,
  onOpenChange,
  categories,
  defaultCategoryId = null,
  exerciseToEdit = null,
}: CreateExerciseDialogProps) {
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();

  const firstCategoryId = categories[0]?.id ?? "";
  const initialCategoryId = useMemo(() => {
    if (exerciseToEdit?.exercise_category_id) return exerciseToEdit.exercise_category_id;
    if (defaultCategoryId) return defaultCategoryId;
    return firstCategoryId;
  }, [defaultCategoryId, exerciseToEdit?.exercise_category_id, firstCategoryId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY_OPTIONS)[number]["value"]>(
    "foundation"
  );
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setDifficulty("foundation");
      setCategoryId(initialCategoryId);
      setUploadResult(null);
      return;
    }

    if (exerciseToEdit) {
      setTitle(exerciseToEdit.title);
      setDescription(exerciseToEdit.description ?? "");
      setDifficulty(exerciseToEdit.difficulty ?? "foundation");
      setCategoryId(exerciseToEdit.exercise_category_id ?? initialCategoryId);
      setUploadResult(null);
      return;
    }

    setTitle("");
    setDescription("");
    setDifficulty("foundation");
    setCategoryId(initialCategoryId);
    setUploadResult(null);
  }, [exerciseToEdit, initialCategoryId, open]);

  const isPending = createExercise.isPending || updateExercise.isPending;
  const isEditMode = Boolean(exerciseToEdit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Exercise" : "Create Exercise"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update exercise details in the shared library."
              : "Add a reusable exercise to a category."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (isEditMode && exerciseToEdit) {
              await updateExercise.mutateAsync({
                exerciseId: exerciseToEdit.id,
                title,
                description,
                difficulty,
                exercise_category_id: categoryId,
              });
            } else {
              await createExercise.mutateAsync({
                title,
                description,
                difficulty,
                exercise_category_id: categoryId,
                file_url: uploadResult?.path ?? null,
                file_name: uploadResult?.fileName ?? null,
                file_type: uploadResult?.fileType ?? null,
              });
            }
            onOpenChange(false);
          }}
        >
          <div>
            <Label htmlFor="exercise-title" className="tp-plan-label">
              Title
            </Label>
            <Input
              id="exercise-title"
              className="glass-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. LINQ Practice Sheet"
              required
            />
          </div>

          <div>
            <Label htmlFor="exercise-description" className="tp-plan-label">
              Description (optional)
            </Label>
            <textarea
              id="exercise-description"
              className="glass-input min-h-20 w-full rounded-lg p-3 text-sm text-tp-primary"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short context for instructors."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="exercise-difficulty" className="tp-plan-label">
                Difficulty
              </Label>
              <select
                id="exercise-difficulty"
                className="glass-input h-9 w-full rounded-lg px-2.5 text-sm text-tp-primary"
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as (typeof DIFFICULTY_OPTIONS)[number]["value"])
                }
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="exercise-category" className="tp-plan-label">
                Category
              </Label>
              <select
                id="exercise-category"
                className="glass-input h-9 w-full rounded-lg px-2.5 text-sm text-tp-primary"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isEditMode ? (
            <div>
              <Label className="tp-plan-label">File upload (optional)</Label>
              <FileUpload
                bucket="exercises"
                folder={`library/${categoryId || "uncategorized"}`}
                onUploadComplete={setUploadResult}
                label="Upload exercise file"
                planColor="mint"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditMode ? "Save changes" : "Create exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
