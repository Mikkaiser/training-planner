/**
 * The view-model is the one place plan semantics are decided, and all five
 * views read it — so a wrong rule here is wrong on every screen at once. These
 * tests pin the rules that were actually gotten wrong at some point: gate
 * numbering, the blocks fraction, and which phase counts as current.
 */
import { describe, expect, it } from "vitest";
import { buildPlanSummary, buildPlanVM, compareByOrder, gateScopeLabel } from "@/lib/plan-view-model";
import { makeDesignPlan, makePlan } from "./factories";

describe("gateScopeLabel", () => {
  it("uses the singular for the first gate", () => {
    expect(gateScopeLabel(1)).toBe("Cumulative · Block 1");
  });

  it("spans from block one with an en dash, as the design does", () => {
    expect(gateScopeLabel(7)).toBe("Cumulative · Blocks 1 – 7");
  });
});

describe("buildPlanVM · block indexing", () => {
  it("numbers blocks across the whole plan, not within each phase", () => {
    const vm = buildPlanVM(makeDesignPlan());
    // "API Design & REST" is the third block of phase two but the seventh of
    // the plan; the scaffold numbered it 3 and labelled its gate "Gate 3".
    const apiBlock = vm.blocks.find((block) => block.title === "API Design & REST");
    expect(apiBlock?.index).toBe(7);
    expect(apiBlock?.indexInPhase).toBe(3);
    expect(apiBlock?.gate?.label).toBe("Gate 7");
    expect(apiBlock?.gate?.scopeLabel).toBe("Cumulative · Blocks 1 – 7");
  });

  it("numbers blocks in the order it is handed them", () => {
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: [{ id: "first" }, { id: "second" }] }] }));
    expect(vm.blocks.map((block) => block.id)).toEqual(["first", "second"]);
    expect(vm.blocks.map((block) => block.index)).toEqual([1, 2]);
  });
});

describe("compareByOrder", () => {
  // createBlock derives order_index from the current length, so deleting an
  // item and adding another reuses a number. Without a tiebreak, two renders of
  // identical data could disagree on order, shuffling gate labels and moving
  // stations on the route map between reloads.
  const row = (id: string, order_index: number, created_at: string) => ({ id, order_index, created_at });

  it("orders by order_index first", () => {
    expect(compareByOrder(row("a", 1, "2026-01-01"), row("b", 2, "2026-01-01"))).toBeLessThan(0);
  });

  it("falls back to creation time when order_index collides", () => {
    const older = row("z", 1, "2026-01-01T00:00:00.000Z");
    const newer = row("a", 1, "2026-02-01T00:00:00.000Z");
    expect(compareByOrder(older, newer)).toBeLessThan(0);
    expect(compareByOrder(newer, older)).toBeGreaterThan(0);
  });

  it("falls back to id when order_index and creation time both collide", () => {
    const a = row("aaa", 1, "2026-01-01T00:00:00.000Z");
    const b = row("bbb", 1, "2026-01-01T00:00:00.000Z");
    expect(compareByOrder(a, b)).toBeLessThan(0);
    expect(compareByOrder(b, a)).toBeGreaterThan(0);
  });

  it("is a total order, so sorting is stable across runs", () => {
    const rows = [
      row("c", 1, "2026-01-02T00:00:00.000Z"),
      row("a", 1, "2026-01-01T00:00:00.000Z"),
      row("b", 1, "2026-01-01T00:00:00.000Z"),
      row("d", 0, "2026-01-09T00:00:00.000Z"),
    ];
    const once = [...rows].sort(compareByOrder).map((r) => r.id);
    const twice = [...rows].reverse().sort(compareByOrder).map((r) => r.id);
    expect(once).toEqual(["d", "a", "b", "c"]);
    expect(twice).toEqual(once);
  });
});

describe("buildPlanVM · block status", () => {
  it("marks the first unpassed block current and everything before it done", () => {
    const vm = buildPlanVM(makeDesignPlan());
    expect(vm.blocks.slice(0, 6).every((block) => block.status === "done")).toBe(true);
    expect(vm.blocks[6].status).toBe("current");
    expect(vm.blocks[7].status).toBe("next");
  });

  it("treats a failed gate as not done, so the block stays current", () => {
    const vm = buildPlanVM(
      makePlan({ phases: [{ blocks: [{ gate: "passed" }, { gate: "failed" }, { gate: "pending" }] }] }),
    );
    expect(vm.blocks.map((block) => block.status)).toEqual(["done", "current", "next"]);
  });

  it("treats a block with no gate row as outstanding rather than complete", () => {
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: [{ gate: "passed" }, { gate: null }] }] }));
    expect(vm.blocks[1].gate).toBeNull();
    expect(vm.blocks[1].status).toBe("current");
    expect(vm.progress).toBe(50);
  });

  it("leaves no current block once every gate has passed", () => {
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: [{ gate: "passed" }, { gate: "passed" }] }] }));
    expect(vm.currentBlock).toBeNull();
    expect(vm.blocks.every((block) => block.status === "done")).toBe(true);
    expect(vm.progress).toBe(100);
  });
});

describe("buildPlanVM · phase status and summary", () => {
  it("classifies phases around the current block", () => {
    const vm = buildPlanVM(makeDesignPlan());
    expect(vm.phases.map((phase) => phase.status)).toEqual(["complete", "current", "locked"]);
    expect(vm.currentPhase?.title).toBe("Intermediate");
  });

  it("summarises a finished phase as all gates passed", () => {
    const vm = buildPlanVM(makeDesignPlan());
    expect(vm.phases[0].summary).toBe("4/4 blocks · All gates passed");
  });

  it("counts only passed blocks in the current phase's fraction", () => {
    // The scaffold printed n/n here, which read as "everything done" on a
    // phase where two of four blocks were outstanding.
    const vm = buildPlanVM(makeDesignPlan());
    expect(vm.phases[1].doneCount).toBe(2);
    expect(vm.phases[1].blockCount).toBe(4);
    expect(vm.phases[1].summary).toBe("2/4 blocks · Gate 7 pending");
  });

  it("describes an empty phase as not started", () => {
    const vm = buildPlanVM(makeDesignPlan());
    expect(vm.phases[2].summary).toBe("Not started");
    expect(vm.phases[2].blockCount).toBe(0);
  });

  it("makes the first empty phase current when all blocks are done", () => {
    const vm = buildPlanVM(
      makePlan({ phases: [{ title: "One", blocks: [{ gate: "passed" }] }, { title: "Two", blocks: [] }] }),
    );
    expect(vm.currentPhase?.title).toBe("Two");
    expect(vm.phases.map((phase) => phase.status)).toEqual(["complete", "current"]);
  });

  it("records the block range each phase spans, for the route map's segments", () => {
    const vm = buildPlanVM(makeDesignPlan());
    expect(vm.phases[0].firstBlockIndex).toBe(1);
    expect(vm.phases[0].lastBlockIndex).toBe(4);
    expect(vm.phases[1].firstBlockIndex).toBe(5);
    expect(vm.phases[1].lastBlockIndex).toBe(8);
    expect(vm.phases[2].firstBlockIndex).toBeNull();
  });
});

describe("buildPlanVM · progress", () => {
  it("divides passed gates by total blocks, not by gates", () => {
    // A block without a gate row still represents outstanding work; dividing by
    // gates would let it flatter the percentage.
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: [{ gate: "passed" }, { gate: null }, { gate: null }] }] }));
    expect(vm.progress).toBe(33);
  });

  it("is zero for a plan with no blocks rather than NaN", () => {
    expect(buildPlanVM(makePlan({ phases: [{ blocks: [] }] })).progress).toBe(0);
    expect(buildPlanVM(makePlan()).progress).toBe(0);
  });

  it("rounds to a whole percent", () => {
    const vm = buildPlanVM(
      makePlan({ phases: [{ blocks: [{ gate: "passed" }, { gate: "pending" }, { gate: "pending" }] }] }),
    );
    expect(vm.progress).toBe(33);
  });
});

describe("buildPlanVM · totals and empties", () => {
  it("counts gates by outcome and exercises across the plan", () => {
    const vm = buildPlanVM(makeDesignPlan());
    expect(vm.totals).toMatchObject({
      phases: 3,
      blocks: 8,
      gatesPassed: 6,
      gatesPending: 2,
      gatesFailed: 0,
      exercises: 3,
    });
  });

  it("flags a plan with no phases as empty", () => {
    expect(buildPlanVM(makePlan()).isEmpty).toBe(true);
    expect(buildPlanVM(makeDesignPlan()).isEmpty).toBe(false);
  });

  it("does not treat a plan with an empty phase as empty", () => {
    expect(buildPlanVM(makePlan({ phases: [{ blocks: [] }] })).isEmpty).toBe(false);
  });
});

describe("buildPlanSummary", () => {
  it("reports the current phase's position and the design's card fields", () => {
    const summary = buildPlanSummary(makeDesignPlan());
    expect(summary).toMatchObject({
      phaseIndex: 2,
      phaseTotal: 3,
      currentPhaseName: "Intermediate",
      blocksDone: 2,
      blocksTotal: 4,
      currentBlockTitle: "API Design & REST",
      verbLevel: "Apply",
      gateLabel: "Gate 7",
      gateStatus: "pending",
      isDraft: false,
    });
  });

  it("marks a plan with no phases as a draft with nothing to show", () => {
    const summary = buildPlanSummary(makePlan());
    expect(summary.isDraft).toBe(true);
    expect(summary.currentBlockTitle).toBeNull();
    expect(summary.gateLabel).toBeNull();
    expect(summary.phaseTotal).toBe(0);
  });

  it("agrees with the full view-model on progress", () => {
    // The card and the roadmap header must never disagree about the same plan.
    const plan = makeDesignPlan();
    expect(buildPlanSummary(plan).progress).toBe(buildPlanVM(plan).progress);
  });
});
