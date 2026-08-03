/**
 * Geometry for the tree view.
 *
 * The design mock hand-places a 700px pillar and connectors at
 * `M 350 0 C 350 20, X 20, X 40`. Those constants are derived here instead of
 * copied: 350 is the pillar's centre, 20 is half the connector band, and the
 * column pitch is the block width plus the gutter. Same drawing at the mock's
 * four blocks, and it still holds at nought or thirty.
 *
 * Pure — no React, no DOM — so the layout can be checked without a browser.
 */
import type { BlockVM, PhaseVM, PlanVM } from "@/lib/plan-view-model";

export const TREE = {
  BLOCK_W: 150,
  GAP: 15,
  /** Column pitch: block width plus gutter. */
  COL: 165,
  CONNECTOR_H: 40,
  /** The mock uses 130, which fits "Foundation" but clips real phase names
   *  once the n/m counter sits beside them. */
  PILLAR_MIN: 168,
  PHASE_GAP: 80,
} as const;

export type TreeColumn = {
  /** Centre of the column, used as the connector's landing point. */
  x: number;
  /** null marks the trailing "Add Block" stub, which is part of the layout. */
  block: BlockVM | null;
};

export type TreePhaseLayout = {
  phase: PhaseVM;
  expanded: boolean;
  width: number;
  columns: TreeColumn[];
  /** One SVG path per column, fanning from the pillar's centre. */
  connectors: string[];
};

export function layoutTree(plan: PlanVM, expandedIds: ReadonlySet<string>): TreePhaseLayout[] {
  return plan.phases.map((phase) => {
    const expanded = expandedIds.has(phase.id);

    if (!expanded) {
      return { phase, expanded, width: TREE.PILLAR_MIN, columns: [], connectors: [] };
    }

    // The trailing null is the Add stub; counting it here is what keeps the
    // pillar wide enough to sit over everything beneath it.
    const entries: (BlockVM | null)[] = [...phase.blocks, null];
    const width = Math.max(TREE.PILLAR_MIN, entries.length * TREE.COL - TREE.GAP);
    const centre = width / 2;

    const columns = entries.map((block, i) => ({
      x: i * TREE.COL + TREE.BLOCK_W / 2,
      block,
    }));

    const connectors = columns.map(
      (column) =>
        `M ${centre} 0 C ${centre} ${TREE.CONNECTOR_H / 2}, ${column.x} ${TREE.CONNECTOR_H / 2}, ${column.x} ${TREE.CONNECTOR_H}`,
    );

    return { phase, expanded, width, columns, connectors };
  });
}
