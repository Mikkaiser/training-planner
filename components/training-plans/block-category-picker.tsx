"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  useAssignCategoryToBlock,
  useBlockCategories,
  useRemoveCategoryFromBlock,
} from "@/lib/hooks/use-block-categories";
import { useExerciseLibrary } from "@/lib/hooks/use-exercise-library";

type BlockCategoryPickerProps = {
  topicId: string | null | undefined;
};

export function BlockCategoryPicker({ topicId }: BlockCategoryPickerProps): React.JSX.Element {
  const [searchValue, setSearchValue] = useState("");
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const { data: libraryCategories = [] } = useExerciseLibrary();
  const { data: assignedCategories = [], isLoading } = useBlockCategories(topicId ?? null);

  const assignMutation = useAssignCategoryToBlock(topicId ?? "");
  const removeMutation = useRemoveCategoryFromBlock(topicId ?? "");

  const assignedIds = useMemo(
    () => new Set(assignedCategories.map((category) => category.id)),
    [assignedCategories]
  );

  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return libraryCategories;
    return libraryCategories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [libraryCategories, searchValue]);

  const includedExerciseCount = assignedCategories.reduce(
    (total, category) => total + (category.exercises?.length ?? 0),
    0
  );

  if (!topicId) {
    return (
      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2 text-[11px] text-tp-muted">
        Save this phase first to assign exercise categories.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-tp-primary">Exercise categories</h4>
        {isLoading ? <span className="text-[11px] text-tp-muted">Loading…</span> : null}
      </div>

      <Input
        className="glass-input h-8 text-xs"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder="Search categories..."
        aria-label="Search exercise categories"
      />

      <div className="max-h-32 space-y-1 overflow-auto">
        {filteredOptions.map((category) => {
          const selected = assignedIds.has(category.id);
          const exerciseCount = category.exercises?.length ?? 0;
          return (
            <button
              key={category.id}
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-md border border-[var(--color-border-subtle)] px-2 py-1.5 text-left hover-tint"
              onClick={() => {
                if (selected) {
                  void removeMutation.mutateAsync(category.id);
                  return;
                }
                void assignMutation.mutateAsync(category.id);
              }}
            >
              <span className="min-w-0 truncate text-xs text-tp-primary">{category.name}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-tp-muted">
                {exerciseCount}
                {selected ? <Check size={12} className="text-[var(--color-positive)]" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      {assignedCategories.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {assignedCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="glass-subtle inline-flex items-center gap-1 rounded-full border border-[var(--color-positive-border)] px-2 py-1 text-[11px] text-[var(--color-positive)]"
                onClick={() => void removeMutation.mutateAsync(category.id)}
              >
                <span>{category.name}</span>
                <X size={11} />
              </button>
            ))}
          </div>

          <button
            type="button"
            className="flex items-center gap-1 text-[11px] text-tp-secondary"
            onClick={() => setPreviewExpanded((current) => !current)}
          >
            {previewExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span>{includedExerciseCount} exercises included</span>
          </button>

          {previewExpanded ? (
            <div className="space-y-2 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-2">
              {assignedCategories.map((category) => (
                <div key={category.id}>
                  <p className="text-[11px] font-semibold text-tp-primary">{category.name}</p>
                  {(category.exercises ?? []).length === 0 ? (
                    <p className="text-[11px] text-tp-muted">No exercises in this category.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {(category.exercises ?? []).map((exercise) => (
                        <li key={exercise.id} className="truncate text-[11px] text-tp-secondary">
                          {exercise.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
