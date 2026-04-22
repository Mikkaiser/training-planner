"use client";

import * as React from "react";
import { ChevronRight, Code2, Layers, Shield } from "lucide-react";
import { DndContext, closestCenter, type SensorDescriptor } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { AnimatePresence, motion } from "framer-motion";

import { SortablePreviewPhase } from "@/components/training-plans/training-plan-editor-sortable-preview-phase";
import { weekLabel } from "@/lib/utils/training-plan-editor-utils";
import { subcompetenceChipStyle } from "@/lib/constants/subcompetence-tokens";
import { useIsDark } from "@/lib/use-is-dark";
import type { PlanPhaseRef } from "@/lib/training-plans/types";

export interface TrainingPlanEditorPreviewHorizontalProps {
  phaseRefs: PlanPhaseRef[];
  sensors: SensorDescriptor<Record<string, unknown>>[];
  totalWeeks: number;
  onReorder: (activeId: string, overId: string) => void;
}

export function TrainingPlanEditorPreviewHorizontal({
  phaseRefs,
  sensors,
  totalWeeks,
  onReorder,
}: TrainingPlanEditorPreviewHorizontalProps): React.JSX.Element {
  const isDark = useIsDark();

  return (
    <div className="h-full w-full overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={({ active, over }) => {
          if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
        }}
      >
        <SortableContext items={phaseRefs.map((p) => p.phase_id)} strategy={horizontalListSortingStrategy}>
          <div className="flex min-h-[180px] w-full items-stretch gap-4">
            <AnimatePresence initial={false}>
              {phaseRefs.map((r, idx) => {
                const dur = r.phase.duration_weeks ?? 0;
                const frac = totalWeeks ? dur / totalWeeks : 1 / Math.max(phaseRefs.length, 1);
                const grow = Math.max(frac, 0.08);
                const accent = r.phase.subcompetences[0]?.color ?? "var(--color-accent)";
                const phaseGate =
                  r.phase.blocks[r.phase.blocks.length - 1]?.gate?.gate_type === "phase_gate"
                    ? r.phase.blocks[r.phase.blocks.length - 1].gate
                    : undefined;
                return (
                  <motion.div
                    key={r.phase_id}
                    layout
                    layoutId={`phase-${r.phase_id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="relative min-w-0"
                    style={{ flex: `${grow} 1 0`, minWidth: 0 }}
                  >
                    <SortablePreviewPhase id={r.phase_id}>
                      <div
                        className="tp-phase-block relative flex h-full min-h-[160px] w-full min-w-0 cursor-grab flex-col overflow-hidden p-3 active:cursor-grabbing"
                        style={{ borderLeft: `3px solid ${accent}` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-tp-primary">
                              <Layers size={14} className="shrink-0" style={{ color: accent }} />
                              <span className="truncate">{r.phase.name}</span>
                            </div>
                            <div className="mt-0.5 truncate text-xs text-tp-muted">{weekLabel(r)}</div>
                          </div>
                          {phaseGate ? (
                            <div
                              className="max-w-[50%] shrink-0 truncate rounded-full border border-[var(--color-accent)]/55 bg-[var(--color-accent)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)] backdrop-blur-sm"
                              title={phaseGate.name}
                            >
                              PG
                              {typeof phaseGate.pass_threshold === "number"
                                ? ` ${phaseGate.pass_threshold}%`
                                : ""}
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {r.phase.subcompetences.slice(0, 4).map((s) => (
                            <span
                              key={s.id}
                              className="subcompetence-chip max-w-full truncate px-2 py-0.5 text-[11px]"
                              style={subcompetenceChipStyle(s.color, isDark)}
                              title={s.name}
                            >
                              {s.name}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-tp-muted">
                          <span className="inline-flex items-center gap-1">
                            <Code2 size={14} />
                            {r.phase.blocks.length} blocks
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Shield size={14} />
                            {r.phase.blocks.length} gates
                          </span>
                        </div>

                        {phaseGate ? (
                          <div className="pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-[var(--color-accent)]" />
                        ) : null}
                      </div>
                    </SortablePreviewPhase>

                    {idx < phaseRefs.length - 1 ? (
                      <div className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 md:block">
                        <ChevronRight className="h-4 w-4 text-[var(--color-accent)]/80" />
                      </div>
                    ) : null}
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

