"use client";

import * as React from "react";
import { Layers } from "lucide-react";
import { DndContext, closestCenter, type SensorDescriptor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { PhasePickerPopover } from "@/components/training-plans/phase-picker-popover";
import { SortablePhaseCard } from "@/components/training-plans/training-plan-editor-sortable-phase-card";
import type { PlanColorKey } from "@/lib/constants/plan-colors";
import type { Phase, PlanPhaseRef, Subcompetence } from "@/lib/training-plans/types";

export interface TrainingPlanEditorPhasesProps {
  expanded: Record<string, boolean>;
  existingDisabled: Set<string>;
  phases: Phase[];
  phaseRefs: PlanPhaseRef[];
  profileId: string | null;
  sensors: SensorDescriptor<Record<string, unknown>>[];
  subcompetences: Subcompetence[];
  planColor: PlanColorKey;
  onAddExistingPhase: (phase: Phase) => void;
  onUpdatePhase: (phase: Phase) => void;
  onRemovePhase: (phaseId: string) => void;
  onReorder: (activeId: string, overId: string) => void;
  onToggleExpanded: (phaseId: string) => void;
}

export function TrainingPlanEditorPhases({
  expanded,
  existingDisabled,
  phases,
  phaseRefs,
  profileId,
  sensors,
  subcompetences,
  planColor,
  onAddExistingPhase,
  onUpdatePhase,
  onRemovePhase,
  onReorder,
  onToggleExpanded,
}: TrainingPlanEditorPhasesProps): React.JSX.Element {
  return (
    <div className="tp-plan-phases">
      <div className="tp-plan-phases-header">
        <div className="tp-plan-phases-title">
          <Layers className="h-4 w-4 text-[var(--color-accent)]" />
          Phases
        </div>
        {profileId ? (
          <PhasePickerPopover
            existingPhases={phases}
            existingDisabledIds={existingDisabled}
            subcompetences={subcompetences}
            createdBy={profileId}
            planPhaseCount={phaseRefs.length}
            planColor={planColor}
            onAddExisting={onAddExistingPhase}
            onCreated={async (phase) => {
              await onAddExistingPhase(phase);
            }}
            triggerClassName="tp-add-phase-btn"
          />
        ) : null}
      </div>

      {phaseRefs.length === 0 ? (
        <div className="tp-plan-phases-empty">
          No phases yet. Use <span className="text-tp-primary">Add Phase</span> to build your
          roadmap.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
          }}
        >
          <SortableContext items={phaseRefs.map((p) => p.phase_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {phaseRefs.map((p) => (
                <SortablePhaseCard
                  key={p.phase_id}
                  item={p}
                  expanded={Boolean(expanded[p.phase_id])}
                  subcompetences={subcompetences}
                  planColor={planColor}
                  onUpdated={onUpdatePhase}
                  onToggleExpanded={() => onToggleExpanded(p.phase_id)}
                  onRemove={() => onRemovePhase(p.phase_id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

