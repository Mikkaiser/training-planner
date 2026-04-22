"use client";

import * as React from "react";
import { ChevronRight, GripVertical, Layers, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { subcompetenceChipStyle } from "@/lib/constants/subcompetence-tokens";
import { useIsDark } from "@/lib/use-is-dark";
import type { PlanPhaseRef } from "@/lib/training-plans/types";
import { cn } from "@/lib/utils";
import { TrainingPlanEditorPhaseBlocks } from "./training-plan-editor-phase-blocks";

export interface SortablePhaseCardProps {
  item: PlanPhaseRef;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRemove: () => void;
}

export function SortablePhaseCard({
  item,
  expanded,
  onToggleExpanded,
  onRemove,
}: SortablePhaseCardProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.phase_id });
  const isDark = useIsDark();

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("tp-plan-phase-card relative rounded-xl border p-3", isDragging && "opacity-70")}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-md p-1 text-negative/90 hover:bg-negative/10"
        aria-label="Remove phase"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 cursor-grab rounded-md p-1 text-tp-muted hover:bg-[var(--hover-tint-bg)]"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Layers
              className="h-[18px] w-[18px] shrink-0"
              style={{ color: item.phase.subcompetences[0]?.color ?? "var(--color-accent)" }}
            />
            <div className="truncate text-sm font-semibold text-tp-primary">{item.phase.name}</div>
            {item.phase.duration_weeks ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-tp-secondary">
                {item.phase.duration_weeks}w
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.phase.subcompetences.map((s) => (
              <span
                key={s.id}
                className="subcompetence-chip px-2 py-0.5 text-xs"
                style={subcompetenceChipStyle(s.color, isDark)}
              >
                {s.name}
              </span>
            ))}
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-tp-muted">
            <span>{item.phase.blocks.length} blocks</span>
            <span>{item.phase.blocks.length} gates</span>
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-expanded={expanded}
              aria-controls={`phase-details-${item.phase_id}`}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-[var(--hover-tint-bg)]"
            >
              {expanded ? "Collapse" : "Expand"}
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200 ease-out",
                  expanded && "rotate-90"
                )}
              />
            </button>
          </div>

          <div
            id={`phase-details-${item.phase_id}`}
            className={cn(
              "mt-3 grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
              expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-3 border-t border-border/60 pt-3">
                <TrainingPlanEditorPhaseBlocks item={item} />

                {/* Gates are shown inline under each block now. */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

