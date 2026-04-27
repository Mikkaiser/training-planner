import {
  latestAttemptKey,
  type GateAttempt,
  type PlanDetail,
} from "@/lib/plan-detail/types";

export function getLatestAttempt(
  detail: PlanDetail,
  gateId: string,
  competitorId: string
): GateAttempt | undefined {
  return detail.latestAttemptByGateAndCompetitor.get(
    latestAttemptKey(gateId, competitorId)
  );
}

/** Count of block-gates in the plan that this competitor has passed. */
export function blocksCompletedForCompetitor(
  detail: PlanDetail,
  competitorId: string
): number {
  let n = 0;
  for (const phase of detail.phases) {
    for (const block of phase.blocks) {
      const latest = getLatestAttempt(detail, block.gate.id, competitorId);
      if (latest?.passed) n += 1;
    }
  }
  return n;
}

/** Total blocks (topics) in the plan. */
export function totalBlocks(detail: PlanDetail): number {
  return detail.orderedBlockIds.length;
}

export function progressPercentForCompetitor(
  detail: PlanDetail,
  competitorId: string
): number {
  const denom = totalBlocks(detail);
  if (denom === 0) return 0;

  const done = blocksCompletedForCompetitor(detail, competitorId);
  if (done > 0) {
    return Math.round((done / denom) * 100);
  }

  // Fall back to the competitor's current_topic_id position within the ordered blocks
  // so the UI still shows meaningful progress before the first attempt exists.
  const progress = detail.progressByCompetitor.get(competitorId);
  if (!progress || !progress.current_topic_id) return 0;
  const idx = detail.orderedBlockIds.indexOf(progress.current_topic_id);
  if (idx < 0) return 0;
  return Math.round((idx / denom) * 100);
}

/**
 * Average of per-competitor "blocks passed in this phase / blocks in phase"
 * across all competitors. Returns 0–100.
 */
export function phaseAveragePercent(
  detail: PlanDetail,
  phaseId: string
): number {
  const phase = detail.phases.find((p) => p.id === phaseId);
  if (!phase) return 0;
  if (detail.competitors.length === 0) return 0;

  if (phase.blocks.length === 0 || detail.competitors.length === 0) {
    if (phase.blocks.length === 0) return 0;
    // Fallback using current-topic position inside the phase.
    let total = 0;
    for (const c of detail.competitors) {
      const prog = detail.progressByCompetitor.get(c.id);
      if (!prog?.current_topic_id) continue;
      const idx = phase.blocks.findIndex((b) => b.id === prog.current_topic_id);
      if (idx >= 0) total += idx / phase.blocks.length;
      else if (
        // Past this phase entirely (current topic is in a later phase).
        detail.orderedBlockIds.indexOf(prog.current_topic_id) >
        detail.orderedBlockIds.indexOf(phase.blocks[phase.blocks.length - 1].id)
      ) {
        total += 1;
      }
    }
    return Math.round((total / detail.competitors.length) * 100);
  }

  let sum = 0;
  for (const c of detail.competitors) {
    let passed = 0;
    for (const b of phase.blocks) {
      const latest = getLatestAttempt(detail, b.gate.id, c.id);
      if (latest?.passed) passed += 1;
    }
    sum += passed / phase.blocks.length;
  }
  return Math.round((sum / detail.competitors.length) * 100);
}

export type CompetitorBlockState =
  | { kind: "completed"; lastAttempt: GateAttempt }
  | { kind: "in_progress" }
  | { kind: "not_reached" };

/**
 * For each competitor+block, decide whether the competitor has passed the
 * block's gate, is currently on it, or has not reached it yet. A block is
 * considered "completed" when its own gate has a passing attempt for this
 * competitor and the block is behind their current block.
 */
export function competitorBlockState(
  detail: PlanDetail,
  competitorId: string,
  blockId: string
): CompetitorBlockState {
  const progress = detail.progressByCompetitor.get(competitorId);
  if (!progress) return { kind: "not_reached" };

  const current = progress.current_topic_id;
  if (current === blockId) return { kind: "in_progress" };

  const orderIdx = detail.orderedBlockIds.indexOf(blockId);
  const currentIdx = current
    ? detail.orderedBlockIds.indexOf(current)
    : -1;

  if (currentIdx < 0) {
    // No current block tracked — treat everything as not reached.
    return { kind: "not_reached" };
  }

  if (orderIdx < currentIdx) {
    const block = detail.blocksById.get(blockId);
    if (!block) return { kind: "not_reached" };
    const latest = getLatestAttempt(detail, block.gate.id, competitorId);
    if (latest?.passed) return { kind: "completed", lastAttempt: latest };
    return { kind: "not_reached" };
  }

  return { kind: "not_reached" };
}

export type CompetitorBlockPresentation = {
  label: string | null;
  color: "positive" | "negative" | "accent" | "muted";
  showProgress: boolean;
  progressPercent?: number;
  kind?: "active" | "passed" | "advanced" | "other";
};

/**
 * UI-level enrichment of `competitorBlockState`. Returns a human-readable
 * label, a semantic color key (matches the `[data-color]` variants on
 * `.plan-block-detail__competitor-pill` in globals.css), and optional
 * progress metadata for "currently here" rows with a latest attempt score.
 */
export function getCompetitorBlockPresentation(
  detail: PlanDetail,
  competitorId: string,
  blockId: string,
): CompetitorBlockPresentation {
  const block = detail.blocksById.get(blockId);
  const progress = detail.progressByCompetitor.get(competitorId);
  const state = competitorBlockState(detail, competitorId, blockId);

  const latest =
    block?.gate ? getLatestAttempt(detail, block.gate.id, competitorId) : undefined;

  if (state.kind === "completed" && latest?.passed) {
    return {
      label: `Passed · Gate ${block?.global_index ?? ""}`.trim(),
      color: "positive",
      showProgress: false,
      kind: "passed",
    };
  }
  if (state.kind === "in_progress") {
    return {
      label: "Active",
      color: "accent",
      showProgress: latest != null,
      progressPercent: latest?.score,
      kind: "active",
    };
  }

  const thisIdx = detail.orderedBlockIds.indexOf(blockId);
  const curIdx = progress?.current_topic_id
    ? detail.orderedBlockIds.indexOf(progress.current_topic_id)
    : -1;

  if (curIdx >= 0 && thisIdx > curIdx) {
    const away = thisIdx - curIdx;
    return {
      label: away === 1 ? "Next block" : `${away} blocks ahead`,
      color: "muted",
      showProgress: false,
      kind: "other",
    };
  }
  if (curIdx >= 0 && thisIdx < curIdx) {
    return {
      label: "Advanced",
      color: "muted",
      showProgress: false,
      kind: "advanced",
    };
  }
  return { label: null, color: "muted", showProgress: false, kind: "other" };
}

export type CompetitorGateState =
  | { kind: "passed"; attempt: GateAttempt }
  | { kind: "failed"; attempt: GateAttempt }
  | { kind: "attempted"; attempt: GateAttempt }
  | { kind: "none" };

export function competitorGateState(
  detail: PlanDetail,
  competitorId: string,
  gateId: string
): CompetitorGateState {
  const latest = getLatestAttempt(detail, gateId, competitorId);
  if (!latest) return { kind: "none" };
  if (latest.passed) return { kind: "passed", attempt: latest };
  // If more than one attempt exists, last one failed → "failed"
  // otherwise we call it "attempted" (pending retry).
  const all = detail.attemptsByGate.get(gateId) ?? [];
  const countForCompetitor = all.filter(
    (a) => a.competitor_id === competitorId
  ).length;
  if (countForCompetitor > 1) return { kind: "failed", attempt: latest };
  return { kind: "attempted", attempt: latest };
}

export function initialsFromName(name: string | null | undefined): string {
  const src = (name ?? "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

/**
 * Returns the next block id for a competitor after they pass the given
 * block-gate. The rule: advance from the competitor's current_topic_id to
 * the next block in plan order. If already at the last block, returns null.
 */
export function nextBlockIdAfterPass(
  detail: PlanDetail,
  competitorId: string
): { nextBlockId: string | null; nextPhaseId: string | null } {
  const progress = detail.progressByCompetitor.get(competitorId);
  if (!progress?.current_topic_id) {
    return { nextBlockId: null, nextPhaseId: null };
  }
  const idx = detail.orderedBlockIds.indexOf(progress.current_topic_id);
  if (idx < 0 || idx >= detail.orderedBlockIds.length - 1) {
    return { nextBlockId: null, nextPhaseId: null };
  }
  const nextId = detail.orderedBlockIds[idx + 1];
  const block = detail.blocksById.get(nextId);
  return { nextBlockId: nextId, nextPhaseId: block?.phase_id ?? null };
}
