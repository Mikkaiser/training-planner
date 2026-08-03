/**
 * The single derivation shared by every view.
 *
 * All five presentations (card grid, table, timeline, tree, subway) are
 * different readings of the same data, so the rules that turn rows into
 * "phase 2 is current", "gate 7 covers blocks 1-7" or "55% complete" are
 * written exactly once, here. A renderer that computes its own would
 * eventually disagree with the others on screen.
 *
 * This module imports only from @/lib/types — no database, no auth — so client
 * components can import these types without pulling the pg Pool into a browser
 * bundle. Everything it returns is JSON-primitive so it crosses the server to
 * client boundary unchanged.
 */
import type {
  BlockWithExercises,
  CompetenceType,
  Exercise,
  GateStatus,
  PlanWithPhases,
  VerbLevel,
} from "@/lib/types";

export type PhaseStatus = "complete" | "current" | "locked";
export type BlockStatus = "done" | "current" | "next" | "upcoming";

export type GateVM = {
  id: string;
  blockId: string;
  status: GateStatus;
  /** 1-based global block index, so the label reads "Gate 7" across the plan. */
  index: number;
  label: string;
  /** "Cumulative · Blocks 1 – 7", matching the design's gate marker. */
  scopeLabel: string;
};

export type BlockVM = {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  verbLevel: VerbLevel;
  competenceType: CompetenceType;
  /** 1-based across the whole plan — drives gate labels and subway stations. */
  index: number;
  /** 1-based within its phase. */
  indexInPhase: number;
  status: BlockStatus;
  gate: GateVM | null;
  exercises: Exercise[];
};

export type PhaseVM = {
  id: string;
  title: string;
  index: number;
  status: PhaseStatus;
  blocks: BlockVM[];
  blockCount: number;
  doneCount: number;
  /** "4/4 blocks · All gates passed" | "3/5 blocks · Gate 7 pending" | "Not started" */
  summary: string;
  firstBlockIndex: number | null;
  lastBlockIndex: number | null;
};

export type PlanVM = {
  id: string;
  title: string;
  studentName: string;
  createdAt: string;
  phases: PhaseVM[];
  blocks: BlockVM[];
  gates: GateVM[];
  /** 0-100, rounded. */
  progress: number;
  currentPhase: PhaseVM | null;
  currentBlock: BlockVM | null;
  totals: {
    phases: number;
    blocks: number;
    gatesPassed: number;
    gatesFailed: number;
    gatesPending: number;
    exercises: number;
  };
  /** No phases at all — the design shows a dedicated empty roadmap for this. */
  isEmpty: boolean;
};

const EN_DASH = "–";

export function gateScopeLabel(index: number): string {
  return index <= 1 ? "Cumulative · Block 1" : `Cumulative · Blocks 1 ${EN_DASH} ${index}`;
}

export function buildPlanVM(plan: PlanWithPhases): PlanVM {
  const gateByBlockId = new Map(plan.gates.map((gate) => [gate.after_block_id, gate]));

  // Flatten first: a block's identity in every view is its position across the
  // whole plan, not its position inside a phase.
  const flat: { block: BlockWithExercises; phaseId: string; indexInPhase: number }[] = [];
  for (const phase of plan.phases) {
    phase.blocks.forEach((block, indexInPhase) => {
      flat.push({ block, phaseId: phase.id, indexInPhase: indexInPhase + 1 });
    });
  }

  const isDone = (blockId: string) => gateByBlockId.get(blockId)?.status === "passed";

  // "Current" is the first block whose gate has not been passed. Everything
  // before it is necessarily done, which is what makes the phase rules below
  // consistent without a second pass.
  const currentFlatIndex = flat.findIndex((entry) => !isDone(entry.block.id));

  const blocks: BlockVM[] = flat.map((entry, i) => {
    const gateRow = gateByBlockId.get(entry.block.id);
    const index = i + 1;

    const status: BlockStatus =
      currentFlatIndex === -1 || i < currentFlatIndex
        ? "done"
        : i === currentFlatIndex
          ? "current"
          : i === currentFlatIndex + 1
            ? "next"
            : "upcoming";

    return {
      id: entry.block.id,
      phaseId: entry.phaseId,
      title: entry.block.title,
      description: entry.block.description,
      verbLevel: entry.block.verb_level,
      competenceType: entry.block.competence_type,
      index,
      indexInPhase: entry.indexInPhase,
      status,
      gate: gateRow
        ? {
            id: gateRow.id,
            blockId: entry.block.id,
            status: gateRow.status,
            index,
            label: `Gate ${index}`,
            scopeLabel: gateScopeLabel(index),
          }
        : null,
      exercises: entry.block.exercises,
    };
  });

  const blocksByPhase = new Map<string, BlockVM[]>();
  for (const block of blocks) {
    const list = blocksByPhase.get(block.phaseId);
    if (list) list.push(block);
    else blocksByPhase.set(block.phaseId, [block]);
  }

  const currentBlock = blocks.find((block) => block.status === "current") ?? null;

  // The current phase is wherever the next piece of work lives: the phase
  // holding the current block, or — if every block is done — the first empty
  // phase, since that is where the instructor would add the next one.
  let currentPhaseIndex = plan.phases.findIndex((phase) => phase.id === currentBlock?.phaseId);
  if (currentPhaseIndex === -1) {
    currentPhaseIndex = plan.phases.findIndex((phase) => (blocksByPhase.get(phase.id) ?? []).length === 0);
  }
  if (currentPhaseIndex === -1) currentPhaseIndex = plan.phases.length - 1;

  const phases: PhaseVM[] = plan.phases.map((phase, i) => {
    const phaseBlocks = blocksByPhase.get(phase.id) ?? [];
    const doneCount = phaseBlocks.filter((block) => block.status === "done").length;
    const blockCount = phaseBlocks.length;

    const status: PhaseStatus = i < currentPhaseIndex ? "complete" : i === currentPhaseIndex ? "current" : "locked";

    let summary: string;
    if (blockCount === 0) {
      summary = "Not started";
    } else if (doneCount === blockCount) {
      summary = `${blockCount}/${blockCount} blocks · All gates passed`;
    } else {
      const nextGate = phaseBlocks.find((block) => block.status === "current")?.gate;
      const tail = nextGate ? ` · ${nextGate.label} ${nextGate.status}` : "";
      summary = `${doneCount}/${blockCount} blocks${tail}`;
    }

    return {
      id: phase.id,
      title: phase.title,
      index: i + 1,
      status,
      blocks: phaseBlocks,
      blockCount,
      doneCount,
      summary,
      firstBlockIndex: phaseBlocks[0]?.index ?? null,
      lastBlockIndex: phaseBlocks.at(-1)?.index ?? null,
    };
  });

  const gates = blocks.map((block) => block.gate).filter((gate): gate is GateVM => gate !== null);
  const passed = gates.filter((gate) => gate.status === "passed").length;

  return {
    id: plan.id,
    title: plan.title,
    studentName: plan.student_name,
    createdAt: plan.created_at,
    phases,
    blocks,
    gates,
    // Denominator is blocks, not gates: a block without a gate row still
    // represents outstanding work, so it must not flatter the percentage.
    progress: blocks.length === 0 ? 0 : Math.round((passed / blocks.length) * 100),
    currentPhase: phases[currentPhaseIndex] ?? null,
    currentBlock,
    totals: {
      phases: phases.length,
      blocks: blocks.length,
      gatesPassed: passed,
      gatesFailed: gates.filter((gate) => gate.status === "failed").length,
      gatesPending: gates.filter((gate) => gate.status === "pending").length,
      exercises: blocks.reduce((sum, block) => sum + block.exercises.length, 0),
    },
    isEmpty: plan.phases.length === 0,
  };
}

/** The subset the list card and table row need, in the design's own terms. */
export type PlanSummaryVM = {
  id: string;
  studentName: string;
  title: string;
  /** Current phase position and total, rendered as "02/03". */
  phaseIndex: number;
  phaseTotal: number;
  currentPhaseName: string | null;
  /** Blocks done vs total *within the current phase*, as the design shows. */
  blocksDone: number;
  blocksTotal: number;
  progress: number;
  currentBlockTitle: string | null;
  verbLevel: VerbLevel | null;
  gateLabel: string | null;
  gateStatus: GateStatus | null;
  /** No phases yet: the design gives these their own dashed card. */
  isDraft: boolean;
  totals: PlanVM["totals"];
};

export function buildPlanSummary(plan: PlanWithPhases): PlanSummaryVM {
  const vm = buildPlanVM(plan);
  const phase = vm.currentPhase;

  return {
    id: vm.id,
    studentName: vm.studentName,
    title: vm.title,
    phaseIndex: phase?.index ?? 0,
    phaseTotal: vm.phases.length,
    currentPhaseName: phase?.title ?? null,
    blocksDone: phase?.doneCount ?? 0,
    blocksTotal: phase?.blockCount ?? 0,
    progress: vm.progress,
    currentBlockTitle: vm.currentBlock?.title ?? null,
    verbLevel: vm.currentBlock?.verbLevel ?? null,
    gateLabel: vm.currentBlock?.gate?.label ?? null,
    gateStatus: vm.currentBlock?.gate?.status ?? null,
    isDraft: vm.isEmpty,
    totals: vm.totals,
  };
}
