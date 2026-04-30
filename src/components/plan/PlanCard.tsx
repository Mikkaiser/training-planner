import Link from "next/link";
import { Goal } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { planDetailRoute } from "@/lib/routes";
import type { PlanWithPhases } from "@/lib/types";
import { getCurrentBlock, getPlanProgress } from "@/lib/utils";

interface PlanCardProps {
  plan: PlanWithPhases;
}

export function PlanCard({ plan }: PlanCardProps) {
  const progress = getPlanProgress(plan);
  const phaseCount = plan.phases.length;
  const blockCount = plan.phases.flatMap((phase) => phase.blocks).length;
  const currentBlock = getCurrentBlock(plan);
  const currentGate = currentBlock ? plan.gates.find((gate) => gate.after_block_id === currentBlock.id) : null;

  return (
    <Link href={planDetailRoute(plan.id)} className="tp-card" style={{ padding: "22px", display: "grid", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "35px", letterSpacing: "-0.02em", lineHeight: 1 }}>{plan.student_name}</h3>
          <p className="tp-mono" style={{ margin: "8px 0 0", color: "var(--ink-2)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {plan.title}
          </p>
        </div>
        <span className="tp-mono" style={{ fontSize: "11px", color: "var(--ink-2)", padding: "4px 8px", borderRadius: "6px", background: "rgba(28,31,51,0.04)" }}>
          {phaseCount.toString().padStart(2, "0")}/03
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span className="tp-pill">Phase {Math.max(phaseCount, 1)} · {phaseCount > 0 ? "Active" : "Foundation"}</span>
        <span style={{ fontSize: "12px", color: "var(--ink-2)" }}>{blockCount}/{Math.max(blockCount, 1)} blocks</span>
      </div>

      <ProgressBar value={progress} />

      <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <div>
          <div className="tp-mono" style={{ color: "var(--ink-2)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.08em" }}>
            Current Block
          </div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>{currentBlock?.title ?? "Not started"}</div>
        </div>
        {currentBlock ? <span className="tp-pill tp-pill-mono">{currentBlock.verb_level}</span> : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink-2)", fontSize: "13px" }}>
          <Goal size={14} />
          Gate {plan.gates.length}
        </div>
        <StatusBadge status={currentGate?.status ?? "pending"} />
      </div>
    </Link>
  );
}
