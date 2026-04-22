"use client";

import * as React from "react";
import { Shield, ShieldCheck } from "lucide-react";

import { getSubcompetenceIcon } from "@/lib/training-plans/icons";
import type { PlanPhaseRef } from "@/lib/training-plans/types";
import { cn } from "@/lib/utils";

export interface TrainingPlanEditorPhaseBlocksProps {
  item: PlanPhaseRef;
}

export function TrainingPlanEditorPhaseBlocks({
  item,
}: TrainingPlanEditorPhaseBlocksProps): React.JSX.Element {
  if (!item.phase.blocks.length) return <></>;

  return (
    <div>
      <div className="text-xs font-semibold text-tp-primary">Blocks</div>
      <div className="mt-2 space-y-1.5">
        {item.phase.blocks
          .slice()
          .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
          .map((b, bi, arr) => {
            const sc = item.phase.subcompetences.find((s) => s.id === b.subcompetence_id);
            const { Icon, colorLight, colorDark } = getSubcompetenceIcon(sc);
            const isPhaseGate = bi === arr.length - 1 && b.gate.gate_type === "phase_gate";
            const GateIcon = isPhaseGate ? ShieldCheck : Shield;
            return (
              <div key={`${item.phase_id}-blk-${b.id ?? b.order_index}`}>
                <div className="flex items-center gap-2 text-xs text-tp-secondary">
                  <Icon size={16} className="shrink-0 dark:hidden" style={{ color: colorLight }} />
                  <Icon
                    size={16}
                    className="hidden shrink-0 dark:block"
                    style={{ color: colorDark }}
                  />
                  <span className="truncate">{b.name}</span>
                </div>

                <div className="mt-1 flex items-center justify-between gap-3 pl-6 text-[11px] text-tp-muted">
                  <span className="flex min-w-0 items-center gap-2">
                    <GateIcon
                      size={14}
                      className="shrink-0"
                      style={{
                        color: isPhaseGate ? "var(--color-positive)" : "var(--color-accent)",
                      }}
                    />
                    <span className="truncate">{b.gate.name}</span>
                  </span>
                  {typeof b.gate.pass_threshold === "number" ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-tp-primary",
                        isPhaseGate
                          ? "border-[var(--color-positive-border)] bg-[var(--color-positive-bg)]"
                          : "border-[var(--color-border-hover)] bg-[var(--color-accent-muted)]"
                      )}
                    >
                      {b.gate.pass_threshold}%
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

