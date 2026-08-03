/**
 * Builders for the shapes the view-model consumes.
 *
 * These mirror what src/lib/plan-data.ts returns from the database, so a test
 * describes a plan the way the app actually sees one. Ids are deterministic
 * (b1, b2, …) so failures name something you can find.
 */
import type {
  BlockWithExercises,
  CompetenceType,
  Exercise,
  Gate,
  GateStatus,
  Phase,
  PlanWithPhases,
  VerbLevel,
} from "@/lib/types";

const ISO = "2026-01-01T00:00:00.000Z";

export type BlockSpec = {
  id?: string;
  title?: string;
  verbLevel?: VerbLevel;
  competenceType?: CompetenceType;
  /** Omit for a block with no gate row at all. */
  gate?: GateStatus | null;
  exercises?: number;
  orderIndex?: number;
  createdAt?: string;
};

export type PhaseSpec = {
  id?: string;
  title?: string;
  orderIndex?: number;
  blocks?: BlockSpec[];
};

export type PlanSpec = {
  id?: string;
  title?: string;
  studentName?: string;
  phases?: PhaseSpec[];
};

export function makeExercise(blockId: string, index: number): Exercise {
  return {
    id: `${blockId}-e${index}`,
    block_id: blockId,
    file_name: `brief-${index}.pdf`,
    storage_key: `plans/p/blocks/${blockId}/${blockId}-e${index}/brief-${index}.pdf`,
    content_type: "application/pdf",
    size_bytes: 1024 * index,
    status: "ready",
    uploaded_by: null,
    created_at: ISO,
    uploaded_at: ISO,
  };
}

export function makePlan(spec: PlanSpec = {}): PlanWithPhases {
  const planId = spec.id ?? "plan-1";
  const gates: Gate[] = [];
  let blockCounter = 0;

  const phases = (spec.phases ?? []).map((phaseSpec, phaseIndex): Phase & { blocks: BlockWithExercises[] } => {
    const phaseId = phaseSpec.id ?? `ph${phaseIndex + 1}`;

    const blocks = (phaseSpec.blocks ?? []).map((blockSpec, blockIndex): BlockWithExercises => {
      blockCounter += 1;
      const blockId = blockSpec.id ?? `b${blockCounter}`;

      // undefined means "a pending gate", the app's default. Explicit null
      // means the row is genuinely absent, which the view-model must survive.
      if (blockSpec.gate !== null) {
        gates.push({
          id: `g${blockCounter}`,
          plan_id: planId,
          after_block_id: blockId,
          status: blockSpec.gate ?? "pending",
          hours_threshold: 8,
          created_at: ISO,
        });
      }

      return {
        id: blockId,
        phase_id: phaseId,
        title: blockSpec.title ?? `Block ${blockCounter}`,
        description: "",
        verb_level: blockSpec.verbLevel ?? "Apply",
        competence_type: blockSpec.competenceType ?? "Development",
        hours: 8,
        order_index: blockSpec.orderIndex ?? blockIndex + 1,
        created_at: blockSpec.createdAt ?? ISO,
        exercises: Array.from({ length: blockSpec.exercises ?? 0 }, (_, i) => makeExercise(blockId, i + 1)),
      };
    });

    return {
      id: phaseId,
      plan_id: planId,
      title: phaseSpec.title ?? `Phase ${phaseIndex + 1}`,
      order_index: phaseSpec.orderIndex ?? phaseIndex + 1,
      created_at: ISO,
      blocks,
    };
  });

  return {
    id: planId,
    title: spec.title ?? "Road to Lyon 2027",
    student_name: spec.studentName ?? "Eli Vasseur",
    instructor_id: "user-1",
    created_at: ISO,
    phases,
    gates,
  };
}

/** The roadmap from the design's ROADMAP constant, used as a known-good case. */
export function makeDesignPlan(): PlanWithPhases {
  return makePlan({
    phases: [
      {
        title: "Foundation",
        blocks: [
          { title: "Programming Fundamentals", verbLevel: "Create", gate: "passed" },
          { title: "Algorithmic Thinking", verbLevel: "Adapt", gate: "passed" },
          { title: "HTML/CSS Foundations", verbLevel: "Create", gate: "passed" },
          { title: "Working with Issues", competenceType: "Transversal", verbLevel: "Apply", gate: "passed" },
        ],
      },
      {
        title: "Intermediate",
        blocks: [
          { title: "Relational Modeling", competenceType: "Analysis & Design", gate: "passed" },
          { title: "Test-Driven Development", competenceType: "Testing", gate: "passed" },
          { title: "API Design & REST", gate: "pending", exercises: 3 },
          { title: "Async Communication", verbLevel: "Reproduce", gate: "pending" },
        ],
      },
      { title: "Advanced", blocks: [] },
    ],
  });
}
