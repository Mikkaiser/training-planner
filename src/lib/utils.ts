import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Block, Gate, GateStatus, PlanWithPhases } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function getPlanProgress(plan: PlanWithPhases): number {
  const blocks = plan.phases.flatMap((phase) => phase.blocks);
  if (blocks.length === 0) return 0;

  const gatesByBlock = new Map(plan.gates.map((gate) => [gate.after_block_id, gate]));
  const passedCount = blocks.reduce((count, block) => {
    const status = gatesByBlock.get(block.id)?.status;
    return status === "passed" ? count + 1 : count;
  }, 0);

  return Math.round((passedCount / blocks.length) * 100);
}

export function getCurrentBlock(plan: PlanWithPhases): Block | null {
  for (const phase of plan.phases) {
    for (const block of phase.blocks) {
      const gate = plan.gates.find((item) => item.after_block_id === block.id);
      if (!gate || gate.status === "pending") return block;
    }
  }

  const allBlocks = plan.phases.flatMap((phase) => phase.blocks);
  return allBlocks.at(-1) ?? null;
}

export function getGateStatus(gate?: Gate): GateStatus {
  return gate?.status ?? "pending";
}
