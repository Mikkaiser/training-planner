"use client";

import * as React from "react";
import { Layers } from "lucide-react";
import { DndContext, closestCenter, type SensorDescriptor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { AnimatePresence, motion } from "framer-motion";

import { SortablePreviewPhase } from "@/components/training-plans/training-plan-editor-sortable-preview-phase";
import { weekLabel } from "@/lib/utils/training-plan-editor-utils";
import type { PlanPhaseRef } from "@/lib/training-plans/types";

export interface TrainingPlanEditorPreviewVerticalProps {
  phaseRefs: PlanPhaseRef[];
  sensors: SensorDescriptor<Record<string, unknown>>[];
  onReorder: (activeId: string, overId: string) => void;
}

export function TrainingPlanEditorPreviewVertical({
  phaseRefs,
  sensors,
  onReorder,
}: TrainingPlanEditorPreviewVerticalProps): React.JSX.Element {
  return (
    <div className="h-full overflow-y-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
        }}
      >
        <SortableContext items={phaseRefs.map((p) => p.phase_id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {phaseRefs.map((r, idx) => {
                const accent = r.phase.subcompetences[0]?.color ?? "var(--color-accent)";
                return (
                  <motion.div
                    key={r.phase_id}
                    layout
                    layoutId={`phase-${r.phase_id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <SortablePreviewPhase id={r.phase_id}>
                      <div className="tp-phase-block flex cursor-grab gap-3 p-4 active:cursor-grabbing">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-full w-[3px] rounded-full" style={{ background: accent }} />
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-[var(--color-surface)] text-xs font-semibold text-tp-primary">
                            {idx + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-tp-primary">
                            <Layers size={18} style={{ color: accent }} />
                            <span className="truncate">{r.phase.name}</span>
                          </div>
                          <div className="mt-1 text-xs text-tp-muted">{weekLabel(r)}</div>
                        </div>
                      </div>
                    </SortablePreviewPhase>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

