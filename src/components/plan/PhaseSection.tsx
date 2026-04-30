"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { createBlock } from "@/actions/blocks";
import { updatePhase } from "@/actions/phases";
import { BlockCard } from "@/components/plan/BlockCard";
import { GateMarker } from "@/components/plan/GateMarker";
import { Button } from "@/components/ui/Button";
import { GhostButton } from "@/components/ui/GhostButton";
import type { Gate, Phase } from "@/lib/types";

interface PhaseSectionProps {
  phase: Phase & {
    blocks: import("@/lib/types").Block[];
  };
  planId: string;
  gates: Gate[];
  phaseIndex: number;
}

export function PhaseSection({ phase, planId, gates, phaseIndex }: PhaseSectionProps) {
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();

  const sortedBlocks = useMemo(
    () => [...phase.blocks].sort((a, b) => a.order_index - b.order_index),
    [phase.blocks],
  );

  const handleRename = () => {
    const title = window.prompt("Phase title", phase.title);
    if (!title) return;

    startTransition(async () => {
      await updatePhase({ phaseId: phase.id, planId, title });
    });
  };

  const handleAddBlock = () => {
    const title = window.prompt("Block title", "New block");
    if (!title) return;

    startTransition(async () => {
      await createBlock({
        planId,
        phaseId: phase.id,
        title,
        description: "Describe what the competitor should practice in this block.",
        verbLevel: "Apply",
        competenceType: "Development",
        hours: 8,
        orderIndex: sortedBlocks.length + 1,
      });
    });
  };

  return (
    <section style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="tp-mono" style={{ fontSize: "11px", color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            P{phaseIndex + 1}
          </span>
          <h3 style={{ margin: 0, fontSize: "34px", letterSpacing: "-0.02em" }}>{phase.title}</h3>
          {phaseIndex === 1 ? <span className="tp-pill">Current Phase</span> : null}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="ghost" size="sm" onClick={handleRename} disabled={pending}>
            Rename
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen((value) => !value)}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </Button>
        </div>
      </div>

      <p style={{ marginTop: 0, marginBottom: "12px", color: "var(--ink-2)", fontSize: "13px" }}>
        {sortedBlocks.length}/{Math.max(sortedBlocks.length, 1)} blocks
      </p>

      {open ? (
        <div style={{ display: "grid", gap: "12px" }}>
          {sortedBlocks.map((block, index) => {
            const gate = gates.find((item) => item.after_block_id === block.id);
            return (
              <div key={block.id} style={{ display: "grid", gap: "10px" }}>
                <BlockCard block={block} planId={planId} active={phaseIndex === 1 && index === sortedBlocks.length - 1} />
                {gate ? <GateMarker gate={gate} index={index} planId={planId} /> : null}
              </div>
            );
          })}
          <GhostButton onClick={handleAddBlock}>Add Block</GhostButton>
        </div>
      ) : null}
    </section>
  );
}
