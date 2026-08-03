/**
 * The tree and route diagrams are hand-laid at fixed coordinates in the design
 * mock. These generalise it, so the interesting cases are the ones the mock
 * never had: no blocks, one block, and far more than fit on a screen.
 */
import { describe, expect, it } from "vitest";
import { layoutSubway, wrapLabel } from "@/lib/layout/subway-layout";
import { TREE, layoutTree } from "@/lib/layout/tree-layout";
import { buildPlanVM } from "@/lib/plan-view-model";
import { makeDesignPlan, makePlan } from "./factories";

const expandAll = (vm: ReturnType<typeof buildPlanVM>) => new Set(vm.phases.map((phase) => phase.id));

describe("layoutTree", () => {
  it("gives a collapsed phase the minimum pillar and no connectors", () => {
    const vm = buildPlanVM(makeDesignPlan());
    const [foundation] = layoutTree(vm, new Set());
    expect(foundation.expanded).toBe(false);
    expect(foundation.width).toBe(TREE.PILLAR_MIN);
    expect(foundation.connectors).toHaveLength(0);
    expect(foundation.columns).toHaveLength(0);
  });

  it("sizes an expanded pillar to its blocks plus the add stub", () => {
    const vm = buildPlanVM(makeDesignPlan());
    const layouts = layoutTree(vm, expandAll(vm));
    const intermediate = layouts[1];
    // Four blocks plus the trailing Add stub.
    expect(intermediate.columns).toHaveLength(5);
    expect(intermediate.columns.at(-1)?.block).toBeNull();
    expect(intermediate.width).toBe(5 * TREE.COL - TREE.GAP);
  });

  it("draws one connector per column, all leaving the pillar's centre", () => {
    const vm = buildPlanVM(makeDesignPlan());
    const intermediate = layoutTree(vm, expandAll(vm))[1];
    expect(intermediate.connectors).toHaveLength(intermediate.columns.length);

    const centre = intermediate.width / 2;
    for (const path of intermediate.connectors) {
      expect(path.startsWith(`M ${centre} 0`)).toBe(true);
      expect(path).toContain(`${TREE.CONNECTOR_H}`);
    }
  });

  it("lands each connector on its column's centre", () => {
    const vm = buildPlanVM(makeDesignPlan());
    const intermediate = layoutTree(vm, expandAll(vm))[1];
    intermediate.columns.forEach((column, i) => {
      expect(intermediate.connectors[i].endsWith(`${column.x} ${TREE.CONNECTOR_H}`)).toBe(true);
    });
  });

  it("still yields a usable pillar for a phase with no blocks", () => {
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: [] }] }));
    const [only] = layoutTree(vm, expandAll(vm));
    // Just the Add stub; never a zero-width pillar.
    expect(only.columns).toHaveLength(1);
    expect(only.width).toBe(TREE.PILLAR_MIN);
  });

  it("degenerates cleanly at one block", () => {
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: [{}] }] }));
    const [only] = layoutTree(vm, expandAll(vm));
    expect(only.columns).toHaveLength(2);
    expect(only.width).toBeGreaterThanOrEqual(TREE.PILLAR_MIN);
  });

  it("grows rather than overlapping at thirty blocks", () => {
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: Array.from({ length: 30 }, () => ({})) }] }));
    const [only] = layoutTree(vm, expandAll(vm));
    expect(only.columns).toHaveLength(31);

    const xs = only.columns.map((column) => column.x);
    for (let i = 1; i < xs.length; i += 1) {
      expect(xs[i] - xs[i - 1]).toBe(TREE.COL);
    }
    expect(only.width).toBe(31 * TREE.COL - TREE.GAP);
  });
});

describe("wrapLabel", () => {
  it("leaves a short label on one line", () => {
    expect(wrapLabel("TDD")).toEqual(["TDD"]);
  });

  it("breaks a long label onto two lines", () => {
    expect(wrapLabel("Programming Fundamentals")).toEqual(["Programming", "Fundamentals"]);
  });

  it("never returns more than two lines", () => {
    expect(wrapLabel("One Two Three Four Five Six Seven").length).toBeLessThanOrEqual(2);
  });

  it("ellipsises an over-long second line rather than letting it run", () => {
    const lines = wrapLabel("Alpha Supercalifragilisticexpialidocious");
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });

  it("returns the original text when there is nothing to break on", () => {
    expect(wrapLabel("Unbreakableword")).toEqual(["Unbreakableword"]);
  });
});

describe("layoutSubway", () => {
  it("adds a goal terminus after the last block", () => {
    const vm = buildPlanVM(makeDesignPlan());
    const layout = layoutSubway(vm);
    expect(layout.stations).toHaveLength(vm.blocks.length + 1);
    expect(layout.stations.at(-1)?.state).toBe("goal");
    expect(layout.stations.at(-1)?.blockId).toBeNull();
  });

  it("places each gate on the segment leaving its own block, not before it", () => {
    // Gate 7 follows block 7; an earlier version put it between 6 and 7.
    const vm = buildPlanVM(makeDesignPlan());
    const layout = layoutSubway(vm);
    const seventh = layout.stations[6];
    const eighth = layout.stations[7];
    const gate7 = layout.gates.find((gate) => gate.label === "G7");

    expect(gate7).toBeDefined();
    const low = Math.min(seventh.x, eighth.x);
    const high = Math.max(seventh.x, eighth.x);
    expect(gate7!.x).toBeGreaterThanOrEqual(low);
    expect(gate7!.x).toBeLessThanOrEqual(high);
  });

  it("gives every block a gate tick, including the first", () => {
    const vm = buildPlanVM(makeDesignPlan());
    const layout = layoutSubway(vm);
    expect(layout.gates.map((gate) => gate.label)).toEqual(["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"]);
  });

  it("colours segments by phase status and skips empty phases", () => {
    const vm = buildPlanVM(makeDesignPlan());
    const layout = layoutSubway(vm);
    // Foundation and Intermediate have blocks; Advanced does not.
    expect(layout.segments).toHaveLength(2);
    expect(layout.segments.map((segment) => segment.status)).toEqual(["complete", "current"]);
  });

  it("is deterministic, so server and client render the same map", () => {
    // The wobble must be a function of the index — Math.random would desync
    // hydration and make every screenshot different.
    const vm = buildPlanVM(makeDesignPlan());
    expect(JSON.stringify(layoutSubway(vm))).toBe(JSON.stringify(layoutSubway(vm)));
  });

  it("keeps the box a sane size and stations apart at thirty blocks", () => {
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: Array.from({ length: 30 }, () => ({})) }] }));
    const layout = layoutSubway(vm);

    expect(layout.stations).toHaveLength(31);
    // Wraps into rows instead of growing endlessly sideways.
    expect(layout.width).toBeLessThan(1000);
    expect(layout.height).toBeGreaterThan(400);

    for (const station of layout.stations) {
      expect(station.x).toBeGreaterThanOrEqual(0);
      expect(station.x).toBeLessThanOrEqual(layout.width);
      expect(station.y).toBeGreaterThanOrEqual(0);
      expect(station.y).toBeLessThanOrEqual(layout.height);
    }
  });

  it("handles a single block without a malformed curve", () => {
    const vm = buildPlanVM(makePlan({ phases: [{ blocks: [{}] }] }));
    const layout = layoutSubway(vm);
    expect(layout.stations).toHaveLength(2);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
    for (const segment of layout.segments) expect(segment.d).not.toContain("NaN");
  });

  it("produces no NaN coordinates for a plan with no blocks", () => {
    const layout = layoutSubway(buildPlanVM(makePlan({ phases: [{ blocks: [] }] })));
    expect(layout.stations).toHaveLength(1);
    expect(Number.isFinite(layout.width)).toBe(true);
    expect(Number.isFinite(layout.height)).toBe(true);
  });

  it("clamps phase labels inside the drawing", () => {
    const vm = buildPlanVM(makeDesignPlan());
    const layout = layoutSubway(vm);
    for (const label of layout.phaseLabels) {
      expect(label.x).toBeGreaterThanOrEqual(0);
      expect(label.x).toBeLessThanOrEqual(layout.width);
      expect(label.y).toBeGreaterThanOrEqual(0);
    }
  });
});
