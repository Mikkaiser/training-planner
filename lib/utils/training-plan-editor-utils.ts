import type { PlanPhaseRef } from "@/lib/training-plans/types";

export function recomputeOffsets(list: PlanPhaseRef[]): PlanPhaseRef[] {
  let acc = 0;
  return list.map((r, idx) => {
    const out: PlanPhaseRef = {
      ...r,
      order_index: idx + 1,
      start_offset_weeks: acc,
    };
    acc += 0;
    return out;
  });
}

export function weekLabel(r: PlanPhaseRef): string {
  void r;
  return "Weeks —";
}

