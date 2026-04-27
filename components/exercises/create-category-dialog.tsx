"use client";

import { useEffect, useState } from "react";

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
import { useCreateExerciseCategory } from "@/lib/hooks/use-exercise-library";

type CreateCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateCategoryDialog({ open, onOpenChange }: CreateCategoryDialogProps) {
  const createCategory = useCreateExerciseCategory();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Exercise Category</DialogTitle>
          <DialogDescription>
            Group related exercises together for reuse across multiple blocks.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await createCategory.mutateAsync({
              name,
              description,
            });
            onOpenChange(false);
          }}
        >
          <div>
            <Label htmlFor="exercise-category-name" className="tp-plan-label">
              Name
            </Label>
            <Input
              id="exercise-category-name"
              className="glass-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. C# Fundamentals"
              required
            />
          </div>

          <div>
            <Label htmlFor="exercise-category-description" className="tp-plan-label">
              Description (optional)
            </Label>
            <textarea
              id="exercise-category-description"
              className="glass-input min-h-20 w-full rounded-lg p-3 text-sm text-tp-primary"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What does this category cover?"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createCategory.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? "Saving..." : "Save category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
