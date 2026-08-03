"use client";

import { useState, useTransition } from "react";
import { createBlock } from "@/actions/blocks";
import { createPhase } from "@/actions/phases";
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
      {plan.phases.map((phase) => (
        <div key={phase.id} style={{ marginTop: 14 }}>
          <PhaseHeader
            phase={phase}
            planId={plan.id}
            expanded={Boolean(expanded[phase.id])}
            onToggle={() => setExpanded((state) => ({ ...state, [phase.id]: !state[phase.id] }))}
          />
          {expanded[phase.id] ? <PhaseRail phase={phase} planId={plan.id} /> : null}
        </div>
      ))}

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
    <div style={{ position: "relative", paddingLeft: 38 }}>
      {/* The rail fades out toward the future, as in the design. It is purely
          decorative, so it is hidden from assistive tech. */}
      {phase.blocks.length > 0 ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 14,
            top: 8,
            bottom: 60,
            width: 2,
            background: "linear-gradient(180deg, var(--accent) 0%, rgba(219,253,107,0.2) 100%)",
          }}
        />
      ) : null}

      {phase.blocks.map((block) => (
        <div key={block.id}>
          <TimelineNode state={block.status}>
            {block.status === "done" ? (
              <CompactBlockRow block={block} planId={planId} />
            ) : (
              <BlockCard
                block={block}
                planId={planId}
                phaseLabel={phaseLabel}
                active={block.status === "current"}
              />
            )}
          </TimelineNode>

          {block.gate ? (
            // Gate dots stay hollow in the design regardless of the block
            // before them — the filled dots mark blocks, not checkpoints.
            <TimelineNode state="upcoming" small>
              <GateMarker gate={block.gate} planId={planId} />
            </TimelineNode>
          ) : null}
        </div>
      ))}

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
          left: -32,
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
