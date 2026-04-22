import type { PlanPhaseRef } from "@/lib/training-plans/types";

export function recomputeOffsets(list: PlanPhaseRef[]): PlanPhaseRef[] {
  let acc = 0;
  return list.map((r, idx) => {
    const out: PlanPhaseRef = {
      ...r,
      order_index: idx + 1,
      start_offset_weeks: acc,
    };
    acc += r.phase.duration_weeks ?? 0;
    return out;
  });
}

export function weekLabel(r: PlanPhaseRef): string {
  const start = r.start_offset_weeks + 1;
  const dur = r.phase.duration_weeks ?? 0;
  const end = r.start_offset_weeks + dur;
  if (!dur) return "Weeks —";
  return `Week ${start}-${end}`;
}

