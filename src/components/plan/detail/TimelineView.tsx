"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { createBlock, reorderBlocks } from "@/actions/blocks";
import { createPhase, reorderPhases } from "@/actions/phases";
import { AddGateButton } from "@/components/plan/detail/AddGateButton";
import { AddInline } from "@/components/plan/detail/AddInline";
import { BlockCard } from "@/components/plan/detail/BlockCard";
import { CompactBlockRow } from "@/components/plan/detail/CompactBlockRow";
import { DragHandle, SortableItem, useSortableSensors } from "@/components/plan/detail/Sortable";
import { GateMarker } from "@/components/plan/detail/GateMarker";
import { PhaseHeader } from "@/components/plan/detail/PhaseHeader";
import { isSameOrder, moveItem } from "@/lib/reorder";
import type { BlockVM, PhaseVM, PlanVM } from "@/lib/plan-view-model";

/** The design's quick-add pills on an empty roadmap. */
const PHASE_SUGGESTIONS = ["Foundation", "Intermediate", "Advanced"] as const;

/** Prefix for the droppable that backs a phase's block list. */
const RAIL = "rail:";

type BlocksByPhase = Record<string, string[]>;

const buildBlocksByPhase = (phases: PhaseVM[]): BlocksByPhase =>
  Object.fromEntries(phases.map((phase) => [phase.id, phase.blocks.map((block) => block.id)]));

/** Design artboard: detail-v1 "Vertical timeline (spec)". */
export function TimelineView({ plan }: { plan: PlanVM }) {
  const [pending, startTransition] = useTransition();
  const sensors = useSortableSensors();

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(plan.phases.map((phase) => [phase.id, phase.status === "current"])),
  );

  // Local copies so the board moves with the pointer instead of waiting for the
  // round trip. Re-seeded whenever the server sends something different, which
  // is also what reverts an optimistic move if the action fails.
  const serverPhaseOrder = useMemo(() => plan.phases.map((phase) => phase.id), [plan.phases]);
  const serverBlocks = useMemo(() => buildBlocksByPhase(plan.phases), [plan.phases]);

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

  const phaseById = useMemo(() => new Map(plan.phases.map((phase) => [phase.id, phase])), [plan.phases]);
  const blockById = useMemo(() => new Map(plan.blocks.map((block) => [block.id, block])), [plan.blocks]);

  const isPhase = (id: string) => phaseById.has(id);

  /** Which phase's list an id belongs to — a block, or a phase's rail. */
  const containerOf = (id: string): string | null => {
    if (id.startsWith(RAIL)) return id.slice(RAIL.length);
    if (isPhase(id)) return id;
    return Object.keys(blocksByPhase).find((phaseId) => blocksByPhase[phaseId].includes(id)) ?? null;
  };

  /**
   * Pointer-first, falling back to rectangles. closestCorners alone happily
   * picks a phase two screens away when the cursor is over empty space, which
   * makes a cross-phase drop land somewhere the user never pointed at.
   */
  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return closestCorners({ ...args, droppableContainers: args.droppableContainers });
    return rectIntersection(args);
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  /**
   * Moves the block between lists while the drag is still in flight, so the
   * destination opens a gap and the source closes one. Without this a
   * cross-phase drop is invisible until the pointer is released.
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (isPhase(activeIdStr)) return; // phases only reorder among themselves

    const from = containerOf(activeIdStr);
    const to = containerOf(overIdStr);
    if (!from || !to || from === to) return;

    // Dropping onto a collapsed phase would be invisible, so open it.
    if (!expanded[to]) setExpanded((state) => ({ ...state, [to]: true }));

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

  const handleDragEnd = (event: DragEndEvent) => {
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

    // Settle the within-list position; handleDragOver has already moved it
    // between lists if the phase changed.
    const list = blocksByPhase[target] ?? [];
    const next =
      container === target && list.includes(overIdStr)
        ? moveItem(list, list.indexOf(activeIdStr), list.indexOf(overIdStr))
        : list;

    const settled = { ...blocksByPhase, [target]: next };
    setBlocksByPhase(settled);

    // Submit every phase whose contents differ from the server's, so a
    // cross-phase move commits both halves in one transaction.
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

  const orderedPhases = phaseOrder.map((id) => phaseById.get(id)).filter((phase): phase is PhaseVM => Boolean(phase));
  const activeBlock = activeId && !isPhase(activeId) ? blockById.get(activeId) : null;
  const activePhase = activeId && isPhase(activeId) ? phaseById.get(activeId) : null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <DndContext
        id={`roadmap-${plan.id}`}
        sensors={sensors}
        collisionDetection={collisionDetection}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setBlocksByPhase(serverBlocks);
        }}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              "Press space to pick up. Use the arrow keys to move within a phase or into a neighbouring one. Press space to drop, escape to cancel.",
          },
        }}
      >
        <SortableContext items={phaseOrder} strategy={verticalListSortingStrategy}>
          {orderedPhases.map((phase) => (
            <SortableItem key={phase.id} id={phase.id} data={{ type: "phase" }}>
              <div style={{ marginTop: 14 }}>
                <PhaseHeader
                  phase={phase}
                  planId={plan.id}
                  expanded={Boolean(expanded[phase.id])}
                  onToggle={() => setExpanded((state) => ({ ...state, [phase.id]: !state[phase.id] }))}
                  handle={<DragHandle label={`phase ${phase.title}`} />}
                />
                {expanded[phase.id] ? (
                  <PhaseRail
                    phase={phase}
                    planId={plan.id}
                    blockIds={blocksByPhase[phase.id] ?? []}
                    blockById={blockById}
                    disabled={pending}
                  />
                ) : null}
              </div>
            </SortableItem>
          ))}
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeBlock ? <DragPreview title={activeBlock.title} subtitle={activeBlock.verbLevel} /> : null}
          {activePhase ? <DragPreview title={activePhase.title} subtitle={`P${activePhase.index}`} /> : null}
        </DragOverlay>
      </DndContext>

      <div className="tp-mt-4">
        <AddInline
          large
          label="Add Phase"
          placeholder="Phase name, e.g. Foundation"
          disabled={pending}
          suggestions={PHASE_SUGGESTIONS}
          onSubmit={(title) =>
            startTransition(async () => {
              await createPhase({ planId: plan.id, title, orderIndex: plan.phases.length + 1 });
            })
          }
        />
      </div>
    </div>
  );
}

/** Follows the pointer across phases; the real card stays faded in place. */
function DragPreview({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div
      className="tp-card"
      style={{
        padding: "12px 16px",
        boxShadow: "var(--shadow-lg)",
        borderLeft: "3px solid var(--accent)",
        cursor: "grabbing",
        maxWidth: 560,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      <div className="tp-tiny tp-mut">{subtitle}</div>
    </div>
  );
}

function PhaseRail({
  phase,
  planId,
  blockIds,
  blockById,
  disabled,
}: {
  phase: PhaseVM;
  planId: string;
  blockIds: string[];
  blockById: Map<string, BlockVM>;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const phaseLabel = `Phase ${phase.index} · ${phase.title}`;

  // A droppable of its own, so a block can be dropped into a phase that has no
  // blocks to aim at.
  const { setNodeRef, isOver } = useDroppable({ id: `${RAIL}${phase.id}` });

  const blocks = blockIds.map((id) => blockById.get(id)).filter((block): block is BlockVM => Boolean(block));

  return (
    <div
      ref={setNodeRef}
      className="tp-timeline-rail"
      style={
        isOver
          ? { background: "var(--accent-soft)", borderRadius: 12, outline: "1.5px dashed var(--accent)" }
          : undefined
      }
    >
      {blocks.length > 0 ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "var(--rail-line)",
            top: 8,
            bottom: 60,
            width: 2,
            background: "linear-gradient(180deg, var(--accent) 0%, rgba(219,253,107,0.2) 100%)",
          }}
        />
      ) : null}

      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        {blocks.map((block) => (
          <SortableItem key={block.id} id={block.id} data={{ type: "block", phaseId: phase.id }}>
            <TimelineNode state={block.status}>
              {block.status === "done" ? (
                <CompactBlockRow
                  block={block}
                  planId={planId}
                  handle={<DragHandle label={`block ${block.title}`} />}
                />
              ) : (
                <BlockCard
                  block={block}
                  planId={planId}
                  phaseLabel={phaseLabel}
                  active={block.status === "current"}
                  handle={<DragHandle label={`block ${block.title}`} />}
                />
              )}
            </TimelineNode>

            {/* Gate dots stay hollow in the design regardless of the block
                before them — the filled dots mark blocks, not checkpoints. */}
            <TimelineNode state="upcoming" small>
              {block.gate ? (
                <GateMarker gate={block.gate} planId={planId} />
              ) : (
                <AddGateButton planId={planId} blockId={block.id} />
              )}
            </TimelineNode>
          </SortableItem>
        ))}
      </SortableContext>

      {blocks.length === 0 ? (
        <div className="tp-tiny tp-mut" style={{ padding: "12px 0 8px" }}>
          No blocks yet — add one, or drag one in from another phase.
        </div>
      ) : null}

      <TimelineNode state="upcoming">
        <AddInline
          label="Add Block"
          placeholder="Block title, e.g. API Design & REST"
          disabled={disabled || pending}
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
                orderIndex: blocks.length + 1,
              });
            })
          }
        />
      </TimelineNode>
    </div>
  );
}

function TimelineNode({
  children,
  state,
  small,
}: {
  children: React.ReactNode;
  state: BlockVM["status"];
  small?: boolean;
}) {
  const done = state === "done";
  const current = state === "current";

  return (
    <div style={{ position: "relative", marginBottom: small ? 14 : 18 }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "var(--rail-dot)",
          top: small ? 14 : 22,
          width: small ? 12 : 14,
          height: small ? 12 : 14,
          borderRadius: "50%",
          background: done ? "var(--pos)" : current ? "var(--accent)" : "var(--surface)",
          border: `2px solid ${done ? "var(--pos)" : current ? "var(--accent)" : "var(--border-strong)"}`,
          boxShadow: current ? "0 0 0 4px var(--accent-soft)" : "none",
        }}
      />
      {children}
    </div>
  );
}
