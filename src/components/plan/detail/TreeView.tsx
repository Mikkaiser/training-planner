"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTransition } from "react";
import { createBlock } from "@/actions/blocks";
import { createPhase } from "@/actions/phases";
import { AddInline } from "@/components/plan/detail/AddInline";
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

  const layouts = useMemo(() => layoutTree(plan, expandedIds), [plan, expandedIds]);

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
      <div className="tp-row" style={{ justifyContent: "space-between", marginBottom: 18, gap: 12 }}>
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
          {layouts.map((layout) => (
            <TreePhase key={layout.phase.id} layout={layout} planId={plan.id} onToggle={() => toggle(layout.phase.id)} />
          ))}

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
    </div>
  );
}

function TreePhase({
  layout,
  planId,
  onToggle,
}: {
  layout: TreePhaseLayout;
  planId: string;
  onToggle: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { phase, expanded, width, columns, connectors } = layout;

  return (
    <div className="tp-col" style={{ position: "relative" }}>
      <PhasePillar phase={phase} width={width} expanded={expanded} onToggle={onToggle} />

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

          <div className="tp-row" style={{ gap: TREE.GAP, alignItems: "flex-start" }}>
            {columns.map((column, i) =>
              column.block ? (
                <div key={column.block.id} className="tp-col" style={{ width: TREE.BLOCK_W, gap: 10 }}>
                  <BlockNode block={column.block} />
                  {column.block.gate ? <GateNode gate={column.block.gate} /> : null}
                </div>
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
}: {
  phase: PhaseVM;
  width: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tone = PILLAR_TONES[phase.status];
  const statusWord = phase.status === "complete" ? "Complete" : phase.status === "current" ? "Current" : "Locked";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      style={{
        width,
        borderRadius: 14,
        padding: "12px 16px",
        background: tone.bg,
        border: `1.5px solid ${tone.border}`,
        color: tone.ink,
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
  );
}

function BlockNode({ block }: { block: BlockVM }) {
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
      <Tag type={block.competenceType} short className="tp-tag-xs" />
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
