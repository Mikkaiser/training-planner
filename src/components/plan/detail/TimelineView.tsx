"use client";

import { useState, useTransition } from "react";
import { createBlock, reorderBlocks } from "@/actions/blocks";
import { createPhase, reorderPhases } from "@/actions/phases";
import { DragHandle, SortableItem, SortableList } from "@/components/plan/detail/Sortable";
import { AddGateButton } from "@/components/plan/detail/AddGateButton";
import { AddInline } from "@/components/plan/detail/AddInline";
import { BlockCard } from "@/components/plan/detail/BlockCard";
import { CompactBlockRow } from "@/components/plan/detail/CompactBlockRow";
import { GateMarker } from "@/components/plan/detail/GateMarker";
import { PhaseHeader } from "@/components/plan/detail/PhaseHeader";
import type { BlockVM, PhaseVM, PlanVM } from "@/lib/plan-view-model";

/** The design's quick-add pills on an empty roadmap. */
const PHASE_SUGGESTIONS = ["Foundation", "Intermediate", "Advanced"] as const;

/** Design artboard: detail-v1 "Vertical timeline (spec)". */
export function TimelineView({ plan }: { plan: PlanVM }) {
  const [pending, startTransition] = useTransition();
  // The current phase opens by default; the rest collapse, as in the design.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(plan.phases.map((phase) => [phase.id, phase.status === "current"])),
  );

  const addPhase = (title: string) =>
    startTransition(async () => {
      await createPhase({ planId: plan.id, title, orderIndex: plan.phases.length + 1 });
    });

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <SortableList
        label="phases"
        contextId={`phases-${plan.id}`}
        ids={plan.phases.map((phase) => phase.id)}
        onReorder={(orderedIds) =>
          startTransition(async () => {
            await reorderPhases({ planId: plan.id, orderedIds });
          })
        }
      >
        {plan.phases.map((phase) => (
          <SortableItem key={phase.id} id={phase.id}>
            <div style={{ marginTop: 14 }}>
              <PhaseHeader
                phase={phase}
                planId={plan.id}
                expanded={Boolean(expanded[phase.id])}
                onToggle={() => setExpanded((state) => ({ ...state, [phase.id]: !state[phase.id] }))}
                handle={<DragHandle label={`phase ${phase.title}`} />}
              />
              {expanded[phase.id] ? <PhaseRail phase={phase} planId={plan.id} /> : null}
            </div>
          </SortableItem>
        ))}
      </SortableList>

      <div className="tp-mt-4">
        <AddInline
          large
          label="Add Phase"
          placeholder="Phase name, e.g. Foundation"
          disabled={pending}
          suggestions={PHASE_SUGGESTIONS}
          onSubmit={addPhase}
        />
      </div>
    </div>
  );
}

function PhaseRail({ phase, planId }: { phase: PhaseVM; planId: string }) {
  const [pending, startTransition] = useTransition();
  const phaseLabel = `Phase ${phase.index} · ${phase.title}`;

  const addBlock = (title: string) =>
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
    });

  return (
    <div className="tp-timeline-rail">
      {/* The rail fades out toward the future, as in the design. It is purely
          decorative, so it is hidden from assistive tech. */}
      {phase.blocks.length > 0 ? (
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

      <SortableList
        label={`blocks in ${phase.title}`}
        contextId={`blocks-${phase.id}`}
        ids={phase.blocks.map((block) => block.id)}
        onReorder={(orderedIds) =>
          startTransition(async () => {
            await reorderBlocks({ planId, phaseId: phase.id, orderedIds });
          })
        }
      >
        {phase.blocks.map((block) => (
          <SortableItem key={block.id} id={block.id}>
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
      </SortableList>

      <TimelineNode state="upcoming">
        <AddInline
          label="Add Block"
          placeholder="Block title, e.g. API Design & REST"
          disabled={pending}
          onSubmit={addBlock}
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
