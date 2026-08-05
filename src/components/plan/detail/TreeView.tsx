"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTransition } from "react";
import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { createBlock } from "@/actions/blocks";
import { createPhase } from "@/actions/phases";
import { AddGateButton } from "@/components/plan/detail/AddGateButton";
import { AddInline } from "@/components/plan/detail/AddInline";
import {
  DragHandle,
  SortableItem,
  planCollisionDetection,
  useSortableSensors,
} from "@/components/plan/detail/Sortable";
import { ReorderStatus } from "@/components/plan/detail/ReorderStatus";
import { RAIL, usePlanReorder } from "@/components/plan/detail/usePlanReorder";
import { Tag } from "@/components/ui/Tag";
import { CheckIcon, CrossIcon, GateIcon, PlusIcon } from "@/components/ui/icons";
import { layoutTree, TREE, type TreePhaseLayout } from "@/lib/layout/tree-layout";
import type { BlockVM, GateVM, PhaseVM, PlanVM } from "@/lib/plan-view-model";

/** Design artboard: detail-v2 "Tree / branching". */
export function TreeView({ plan }: { plan: PlanVM }) {
  const [pending, startTransition] = useTransition();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(plan.phases.filter((phase) => phase.status === "current").map((phase) => phase.id)),
  );

  const sensors = useSortableSensors();
  const { activeId, phaseOrder, blocksByPhase, orderedPhases, isPhase, handlers, pending: reorderPending, error: reorderError, dismissError } = usePlanReorder(plan, {
    // A phase has to be open before anything can be dropped into it.
    onEnterPhase: (phaseId) => setExpandedIds((current) => (current.has(phaseId) ? current : new Set(current).add(phaseId))),
  });

  const blockById = useMemo(() => new Map(plan.blocks.map((block) => [block.id, block])), [plan.blocks]);
  const phaseById = useMemo(() => new Map(plan.phases.map((phase) => [phase.id, phase])), [plan.phases]);

  // Lay out from the local order so the columns follow the drag rather than
  // snapping back to whatever the server last sent.
  const layouts = useMemo(() => {
    const phases = orderedPhases.map((phase) => ({
      ...phase,
      blocks: (blocksByPhase[phase.id] ?? [])
        .map((id) => blockById.get(id))
        .filter((block): block is BlockVM => Boolean(block)),
    }));
    return layoutTree({ ...plan, phases }, expandedIds);
  }, [plan, orderedPhases, blocksByPhase, blockById, expandedIds]);

  const activeBlock = activeId && !isPhase(activeId) ? blockById.get(activeId) : null;
  const activePhase = activeId && isPhase(activeId) ? phaseById.get(activeId) : null;

  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [fit, setFit] = useState(false);

  // Fit scales the canvas down to the viewport rather than reflowing it, so the
  // pillar-and-fan shape survives at any block count.
  const recomputeFit = useCallback(() => {
    if (!fit || !viewportRef.current || !canvasRef.current) return setScale(1);
    const available = viewportRef.current.clientWidth;
    const needed = canvasRef.current.scrollWidth;
    setScale(needed > 0 ? Math.min(1, available / needed) : 1);
  }, [fit]);

  useEffect(() => {
    recomputeFit();
    if (!fit) return;
    const observer = new ResizeObserver(recomputeFit);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [fit, recomputeFit, layouts]);

  const toggle = (phaseId: string) =>
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });

  return (
    <div>
      <ReorderStatus pending={reorderPending} error={reorderError} onDismiss={dismissError} />

      <div className="tp-row" style={{ justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div className="tp-col">
          <div className="tp-eyebrow">Branching Roadmap</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Tree view · phases → blocks → gates
          </div>
        </div>
        <div className="tp-row tp-gap-2">
          <button
            type="button"
            className="tp-btn tp-btn-ghost tp-btn-sm"
            aria-pressed={fit}
            onClick={() => setFit(true)}
          >
            Fit
          </button>
          <button
            type="button"
            className="tp-btn tp-btn-ghost tp-btn-sm"
            aria-pressed={!fit}
            onClick={() => {
              setFit(false);
              setScale(1);
            }}
          >
            100%
          </button>
        </div>
      </div>

      <DndContext
        id={`tree-${plan.id}`}
        sensors={sensors}
        collisionDetection={planCollisionDetection}
        modifiers={[restrictToWindowEdges]}
        {...handlers}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press space to pick up. Use the arrow keys to move along the row or into a neighbouring phase. Press space to drop, escape to cancel.",
          },
        }}
      >
        <div ref={viewportRef} style={{ overflowX: fit ? "hidden" : "auto", paddingBottom: 12 }}>
          <div
            ref={canvasRef}
            style={{
              display: "flex",
              gap: TREE.PHASE_GAP,
              alignItems: "flex-start",
              padding: "8px 4px 24px",
              width: "max-content",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <SortableContext items={phaseOrder} strategy={horizontalListSortingStrategy}>
              {layouts.map((layout) => (
                <SortableItem key={layout.phase.id} id={layout.phase.id} data={{ type: "phase" }}>
                  <TreePhase
                    layout={layout}
                    planId={plan.id}
                    blockIds={blocksByPhase[layout.phase.id] ?? []}
                    onToggle={() => toggle(layout.phase.id)}
                  />
                </SortableItem>
              ))}
            </SortableContext>

            <div style={{ paddingTop: 4 }}>
              <div style={{ width: 150 }}>
                <AddInline
                  label="Add Phase"
                  placeholder="Phase name"
                  disabled={pending}
                  onSubmit={(title) =>
                    startTransition(async () => {
                      await createPhase({ planId: plan.id, title, orderIndex: plan.phases.length + 1 });
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeBlock ? <TreeDragPreview title={activeBlock.title} subtitle={activeBlock.verbLevel} /> : null}
          {activePhase ? <TreeDragPreview title={activePhase.title} subtitle={`P${activePhase.index}`} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/** Follows the pointer across phases; the real node stays faded in place. */
function TreeDragPreview({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      className="tp-card"
      style={{
        width: TREE.BLOCK_W,
        padding: 12,
        boxShadow: "var(--shadow-lg)",
        borderLeft: "3px solid var(--accent)",
        cursor: "grabbing",
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
      <div className="tp-tiny tp-mut tp-mt-1">{subtitle}</div>
    </div>
  );
}

function TreePhase({
  layout,
  planId,
  blockIds,
  onToggle,
}: {
  layout: TreePhaseLayout;
  planId: string;
  blockIds: string[];
  onToggle: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { phase, expanded, width, columns, connectors } = layout;

  // Its own droppable, so a phase with no blocks is still a target.
  const { setNodeRef, isOver } = useDroppable({ id: `${RAIL}${phase.id}` });

  return (
    <div className="tp-col" style={{ position: "relative" }}>
      <PhasePillar
        phase={phase}
        width={width}
        expanded={expanded}
        onToggle={onToggle}
        handle={<DragHandle label={`phase ${phase.title}`} />}
      />

      {expanded ? (
        <>
          {/* Skipped entirely when there is nothing to connect — a zero-width
              SVG is invalid and renders as a stray box in some browsers. */}
          {connectors.length > 0 ? (
            <svg width={width} height={TREE.CONNECTOR_H} style={{ marginTop: -2, display: "block" }} aria-hidden="true">
              {connectors.map((d, i) => (
                <path key={i} d={d} stroke="rgba(28,31,51,0.14)" strokeWidth="1.5" fill="none" />
              ))}
            </svg>
          ) : null}

          <div
            ref={setNodeRef}
            className="tp-row"
            style={{
              gap: TREE.GAP,
              alignItems: "flex-start",
              ...(isOver
                ? { background: "var(--accent-soft)", borderRadius: 12, outline: "1.5px dashed var(--accent)" }
                : {}),
            }}
          >
            <SortableContext items={blockIds} strategy={horizontalListSortingStrategy}>
              {columns.map((column, i) =>
                column.block ? (
                  <SortableItem
                    key={column.block.id}
                    id={column.block.id}
                    data={{ type: "block", phaseId: phase.id }}
                  >
                    <div className="tp-col tp-quiet-host" style={{ width: TREE.BLOCK_W, gap: 10 }}>
                      <BlockNode block={column.block} handle={<DragHandle label={`block ${column.block.title}`} />} />
                      {column.block.gate ? (
                        <GateNode gate={column.block.gate} />
                      ) : (
                        <AddGateButton planId={planId} blockId={column.block.id} />
                      )}
                    </div>
                  </SortableItem>
                ) : (
                  <div key={`add-${i}`} className="tp-col" style={{ width: TREE.BLOCK_W, gap: 10, paddingTop: 30 }}>
                    <AddInline
                      label="Add Block"
                      placeholder="Block title"
                      disabled={pending}
                      onSubmit={(title) =>
                        startTransition(async () => {
                          await createBlock({
                            planId,
                            phaseId: phase.id,
                            title,
                            description: "",
                            verbLevel: "Apply",
                            competenceType: "Development",
                            hours: 8,
                            orderIndex: phase.blockCount + 1,
                          });
                        })
                      }
                    />
                  </div>
                ),
              )}
            </SortableContext>
          </div>
        </>
      ) : null}
    </div>
  );
}

const PILLAR_TONES: Record<PhaseVM["status"], { bg: string; border: string; ink: string }> = {
  complete: { bg: "var(--pos-soft)", border: "rgba(0,168,120,0.3)", ink: "var(--pos)" },
  current: { bg: "var(--accent-soft)", border: "var(--accent)", ink: "var(--ink)" },
  locked: { bg: "rgba(28,31,51,0.04)", border: "var(--border-strong)", ink: "var(--ink-2)" },
};

function PhasePillar({
  phase,
  width,
  expanded,
  onToggle,
  handle,
}: {
  phase: PhaseVM;
  width: number;
  expanded: boolean;
  onToggle: () => void;
  handle?: React.ReactNode;
}) {
  const tone = PILLAR_TONES[phase.status];
  const statusWord = phase.status === "complete" ? "Complete" : phase.status === "current" ? "Current" : "Locked";

  return (
    <div
      className="tp-quiet-host"
      style={{
        width,
        borderRadius: 14,
        background: tone.bg,
        border: `1.5px solid ${tone.border}`,
        color: tone.ink,
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
        padding: "12px 12px 12px 16px",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          flex: 1,
          minWidth: 0,
          background: "none",
          border: "none",
          padding: 0,
          color: "inherit",
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
        }}
      >
      <div className="tp-tiny tp-mono" style={{ textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7 }}>
        P{phase.index} · {statusWord}
      </div>
      <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "baseline", marginTop: 2, gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", minWidth: 0, overflowWrap: "anywhere" }}>
          {phase.title}
        </div>
        {phase.blockCount > 0 ? (
          <div className="tp-tiny tp-mono" style={{ opacity: 0.7, flexShrink: 0 }}>
            {phase.doneCount}/{phase.blockCount}
          </div>
        ) : null}
      </div>
      </button>
      {handle}
    </div>
  );
}

function BlockNode({ block, handle }: { block: BlockVM; handle?: React.ReactNode }) {
  const active = block.status === "current";
  return (
    <div
      className="tp-card"
      style={{
        padding: 12,
        borderLeft: `3px solid ${active ? "var(--accent)" : "transparent"}`,
        boxShadow: active ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
    >
      <div className="tp-row" style={{ justifyContent: "space-between", gap: 6 }}>
        <Tag type={block.competenceType} short className="" />
        {handle}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6, lineHeight: 1.25 }}>{block.title}</div>
      <div className="tp-mt-2">
        <span className="tp-pill tp-pill-mono" style={{ fontSize: 9.5, padding: "3px 7px" }}>
          {block.verbLevel}
        </span>
      </div>
    </div>
  );
}

function GateNode({ gate }: { gate: GateVM }) {
  const passed = gate.status === "passed";
  const failed = gate.status === "failed";

  return (
    <div
      title={gate.scopeLabel}
      style={{
        borderRadius: 10,
        padding: "8px 10px",
        background: passed ? "var(--pos-soft)" : failed ? "var(--neg-soft)" : "rgba(28,31,51,0.04)",
        border: `1px dashed ${passed ? "var(--pos)" : failed ? "var(--neg)" : "var(--border-strong)"}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: passed ? "var(--pos)" : failed ? "var(--neg)" : "var(--ink-2)",
      }}
    >
      {passed ? <CheckIcon size={11} /> : failed ? <CrossIcon size={10} /> : <GateIcon size={11} />}
      <span style={{ fontSize: 11, fontWeight: 700 }}>{gate.label}</span>
    </div>
  );
}
