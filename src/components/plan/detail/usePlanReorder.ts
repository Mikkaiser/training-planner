"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import { reorderBlocks } from "@/actions/blocks";
import { reorderPhases } from "@/actions/phases";
import { isSameOrder, moveItem } from "@/lib/reorder";
import type { PhaseVM, PlanVM } from "@/lib/plan-view-model";

/** Prefix for the droppable that backs a phase's block list. */
export const RAIL = "rail:";

export type BlocksByPhase = Record<string, string[]>;

const buildBlocksByPhase = (phases: PhaseVM[]): BlocksByPhase =>
  Object.fromEntries(phases.map((phase) => [phase.id, phase.blocks.map((block) => block.id)]));

/**
 * The drag rules, shared by every view that offers reordering.
 *
 * All three views reorder the same two things, so the rules — which container
 * an id belongs to, what a cross-phase move means, which phases to submit —
 * live here once. A copy per view is how they would start to disagree.
 */
export function usePlanReorder(plan: PlanVM, options?: { onEnterPhase?: (phaseId: string) => void }) {
  const [pending, startTransition] = useTransition();

  const serverPhaseOrder = useMemo(() => plan.phases.map((phase) => phase.id), [plan.phases]);
  const serverBlocks = useMemo(() => buildBlocksByPhase(plan.phases), [plan.phases]);

  // Local copies so a drag moves things immediately rather than waiting for the
  // round trip. Re-seeded whenever the server sends something different, which
  // is also what reverts an optimistic move if the action fails.
  const [phaseOrder, setPhaseOrder] = useState(serverPhaseOrder);
  const [blocksByPhase, setBlocksByPhase] = useState(serverBlocks);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setPhaseOrder((current) => (isSameOrder(current, serverPhaseOrder) ? current : serverPhaseOrder));
  }, [serverPhaseOrder]);

  useEffect(() => {
    setBlocksByPhase((current) =>
      JSON.stringify(current) === JSON.stringify(serverBlocks) ? current : serverBlocks,
    );
  }, [serverBlocks]);

  const phaseIds = useMemo(() => new Set(plan.phases.map((phase) => phase.id)), [plan.phases]);
  const isPhase = (id: string) => phaseIds.has(id);

  /** Which phase's list an id belongs to — a block, or a phase's rail. */
  const containerOf = (id: string): string | null => {
    if (id.startsWith(RAIL)) return id.slice(RAIL.length);
    if (isPhase(id)) return id;
    return Object.keys(blocksByPhase).find((phaseId) => blocksByPhase[phaseId].includes(id)) ?? null;
  };

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const onDragCancel = () => {
    setActiveId(null);
    setBlocksByPhase(serverBlocks);
  };

  /**
   * Moves the block between lists mid-drag, so the destination opens a gap and
   * the source closes one. Without it a cross-phase drop is invisible until the
   * pointer is released.
   */
  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (isPhase(activeIdStr)) return; // phases only reorder among themselves

    const from = containerOf(activeIdStr);
    const to = containerOf(overIdStr);
    if (!from || !to || from === to) return;

    options?.onEnterPhase?.(to);

    setBlocksByPhase((current) => {
      const source = current[from] ?? [];
      const target = current[to] ?? [];
      if (!source.includes(activeIdStr)) return current;

      const insertAt = target.includes(overIdStr) ? target.indexOf(overIdStr) : target.length;

      return {
        ...current,
        [from]: source.filter((id) => id !== activeIdStr),
        [to]: [...target.slice(0, insertAt), activeIdStr, ...target.slice(insertAt)],
      };
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (isPhase(activeIdStr)) {
      if (activeIdStr === overIdStr || !isPhase(overIdStr)) return;
      const next = moveItem(phaseOrder, phaseOrder.indexOf(activeIdStr), phaseOrder.indexOf(overIdStr));
      if (isSameOrder(next, phaseOrder)) return;

      setPhaseOrder(next);
      startTransition(async () => {
        await reorderPhases({ planId: plan.id, orderedIds: next });
      });
      return;
    }

    const container = containerOf(activeIdStr);
    const target = containerOf(overIdStr);
    if (!container || !target) return;

    // Settle the within-list position; onDragOver has already moved it between
    // lists if the phase changed.
    const list = blocksByPhase[target] ?? [];
    const next =
      container === target && list.includes(overIdStr)
        ? moveItem(list, list.indexOf(activeIdStr), list.indexOf(overIdStr))
        : list;

    const settled = { ...blocksByPhase, [target]: next };
    setBlocksByPhase(settled);

    // Submit every phase that differs from the server's, so both halves of a
    // cross-phase move commit in one transaction.
    const changed = Object.keys(settled).filter(
      (phaseId) => !isSameOrder(settled[phaseId] ?? [], serverBlocks[phaseId] ?? []),
    );
    if (changed.length === 0) return;

    startTransition(async () => {
      await reorderBlocks({
        planId: plan.id,
        phases: changed.map((phaseId) => ({ phaseId, orderedIds: settled[phaseId] ?? [] })),
      });
    });
  };

  const orderedPhases = phaseOrder
    .map((id) => plan.phases.find((phase) => phase.id === id))
    .filter((phase): phase is PhaseVM => Boolean(phase));

  return {
    pending,
    activeId,
    phaseOrder,
    blocksByPhase,
    orderedPhases,
    isPhase,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  };
}
