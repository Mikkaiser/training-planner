/**
 * Geometry for the route (subway map) view.
 *
 * The design hand-places nine stations in a 760x380 box along quadratic
 * segments. This generalises that: stations snake left-to-right then
 * right-to-left, the box grows in height rather than squeezing horizontally,
 * and the wobble that gives the line its character is a deterministic function
 * of the index — never Math.random(), which would desync server and client
 * rendering and make every screenshot different.
 *
 * Pure — no React, no DOM.
 */
import type { BlockVM, PhaseStatus, PlanVM } from "@/lib/plan-view-model";
import type { GateStatus } from "@/lib/types";

export const SUBWAY = {
  PAD_X: 60,
  PAD_TOP: 78,
  PAD_BOTTOM: 56,
  ROW_H: 132,
  /** Horizontal pitch. Never shrinks, so labels stay legible at any count. */
  STEP: 86,
  MAX_PER_ROW: 9,
  WOBBLE: 22,
  /** How far a row-change loop bulges sideways. */
  TURN: 52,
} as const;

export type StationState = "done" | "current" | "next" | "upcoming" | "goal";

export type Station = {
  key: string;
  x: number;
  y: number;
  /** Pre-wrapped, at most two lines. */
  lines: string[];
  level: string | null;
  state: StationState;
  /** Below the line on upper rows, above it on lower ones. */
  labelBelow: boolean;
  blockId: string | null;
};

export type GateTick = { key: string; x: number; y: number; label: string; status: GateStatus };
export type RouteSegment = { key: string; d: string; status: PhaseStatus };
export type PhaseLabel = { key: string; x: number; y: number; text: string; status: PhaseStatus };

export type SubwayLayout = {
  width: number;
  height: number;
  stations: Station[];
  gates: GateTick[];
  segments: RouteSegment[];
  phaseLabels: PhaseLabel[];
};

/** Two lines max, broken near 14 characters, ellipsised beyond. */
export function wrapLabel(text: string, limit = 14): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= limit) line = `${line} ${word}`;
    else {
      lines.push(line);
      line = word;
      if (lines.length === 2) break;
    }
  }
  if (line && lines.length < 2) lines.push(line);

  if (lines.length === 2 && lines[1].length > limit) {
    lines[1] = `${lines[1].slice(0, limit - 1)}…`;
  }
  return lines.length > 0 ? lines : [text];
}

function stationState(block: BlockVM): StationState {
  return block.status;
}

export function layoutSubway(plan: PlanVM): SubwayLayout {
  const count = plan.blocks.length + 1; // + the goal terminus
  const rows = Math.max(1, Math.ceil(count / SUBWAY.MAX_PER_ROW));
  // Balanced rather than ragged: 10 stations become 5+5, not 9+1.
  const perRow = Math.max(1, Math.ceil(count / rows));

  const place = (i: number) => {
    const row = Math.floor(i / perRow);
    const column = i % perRow;
    // Boustrophedon: odd rows run right-to-left so the line never jumps back.
    const xIndex = row % 2 === 0 ? column : perRow - 1 - column;
    return {
      row,
      x: SUBWAY.PAD_X + xIndex * SUBWAY.STEP,
      y: SUBWAY.PAD_TOP + row * SUBWAY.ROW_H + SUBWAY.WOBBLE * Math.sin(i * 0.9),
    };
  };

  const stations: Station[] = plan.blocks.map((block, i) => {
    const { x, y, row } = place(i);
    return {
      key: block.id,
      x,
      y,
      lines: wrapLabel(block.title),
      level: block.verbLevel,
      state: stationState(block),
      labelBelow: row % 2 === 0,
      blockId: block.id,
    };
  });

  const goalPlacement = place(plan.blocks.length);
  stations.push({
    key: "goal",
    x: goalPlacement.x,
    y: goalPlacement.y,
    lines: wrapLabel(plan.title),
    level: null,
    state: "goal",
    labelBelow: goalPlacement.row % 2 === 0,
    blockId: null,
  });

  // Segment between consecutive stations. A same-row hop is the mock's
  // quadratic; a row change loops outward with a cubic so the line does not
  // slice back across the row it just finished.
  const segmentPath = (a: Station, b: Station, sameRow: boolean): string => {
    if (sameRow) {
      const cx = (a.x + b.x) / 2;
      return `Q ${cx} ${a.y}, ${b.x} ${b.y}`;
    }
    const direction = a.x >= b.x ? 1 : -1;
    const turnX = a.x + direction * SUBWAY.TURN;
    return `C ${turnX} ${a.y}, ${turnX} ${b.y}, ${b.x} ${b.y}`;
  };

  const rowOf = (i: number) => Math.floor(i / perRow);

  // One path per phase, sliced by the phase's block range and overlapping by a
  // station so the line stays visually continuous across a colour change.
  const segments: RouteSegment[] = [];
  for (const phase of plan.phases) {
    if (phase.firstBlockIndex === null || phase.lastBlockIndex === null) continue;

    const from = phase.firstBlockIndex - 1;
    const to = Math.min(phase.lastBlockIndex, stations.length - 1);
    const start = Math.max(0, from - 1);

    let d = `M ${stations[start].x} ${stations[start].y}`;
    for (let i = start + 1; i <= to; i += 1) {
      d += ` ${segmentPath(stations[i - 1], stations[i], rowOf(i - 1) === rowOf(i))}`;
    }
    if (to > start) segments.push({ key: phase.id, d, status: phase.status });
  }

  const gates: GateTick[] = [];
  plan.blocks.forEach((block, i) => {
    // A gate is passed *after* its block, so it belongs on the segment leaving
    // that station — between station i and i+1, never before it. The goal
    // terminus guarantees there is always a following station.
    const a = stations[i];
    const b = stations[i + 1];
    if (!block.gate || !a || !b) return;
    const sameRow = rowOf(i) === rowOf(i + 1);

    if (sameRow) {
      // Exact midpoint of the quadratic. The straight-line midpoint the mock
      // uses drifts off the curve once the wobble is in play.
      gates.push({
        key: block.gate.id,
        x: (a.x + b.x) / 2,
        y: 0.75 * a.y + 0.25 * b.y,
        label: `G${block.gate.index}`,
        status: block.gate.status,
      });
    } else {
      const direction = a.x >= b.x ? 1 : -1;
      const turnX = a.x + direction * SUBWAY.TURN;
      // Cubic midpoint: (P0 + 3C1 + 3C2 + P1) / 8.
      gates.push({
        key: block.gate.id,
        x: (a.x + 3 * turnX + 3 * turnX + b.x) / 8,
        y: (a.y + 3 * a.y + 3 * b.y + b.y) / 8,
        label: `G${block.gate.index}`,
        status: block.gate.status,
      });
    }
  });

  const width = 2 * SUBWAY.PAD_X + Math.max(1, perRow - 1) * SUBWAY.STEP;

  const phaseLabels: PhaseLabel[] = plan.phases
    .filter((phase) => phase.firstBlockIndex !== null)
    .map((phase) => {
      const station = stations[(phase.firstBlockIndex ?? 1) - 1];
      return {
        key: phase.id,
        // Clamped so a label on an edge station cannot run outside the box.
        x: Math.min(Math.max(station.x, SUBWAY.PAD_X), width - SUBWAY.PAD_X),
        y: Math.max(20, station.y - 58),
        text: `P${phase.index} · ${phase.title}`,
        status: phase.status,
      };
    });

  return {
    width,
    height: SUBWAY.PAD_TOP + rows * SUBWAY.ROW_H + SUBWAY.PAD_BOTTOM,
    stations,
    gates,
    segments,
    phaseLabels,
  };
}
