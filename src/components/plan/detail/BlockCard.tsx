"use client";

import { useState, useTransition } from "react";
import { deleteBlock, updateBlock } from "@/actions/blocks";
import { deleteExercise } from "@/actions/exercises";
import { ExerciseUploadPanel } from "@/components/plan/detail/ExerciseUploadPanel";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { SelectPill } from "@/components/ui/SelectPill";
import { competenceTagClass } from "@/components/ui/Tag";
import { DownloadIcon, ExternalLinkIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { fileKind } from "@/lib/exercise-files";
import type { BlockVM } from "@/lib/plan-view-model";
import { COMPETENCE_TYPES, VERB_LEVELS, type CompetenceType, type VerbLevel } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

interface BlockCardProps {
  block: BlockVM;
  planId: string;
  phaseLabel: string;
  /** The design gives only the current block the accent left border. */
  active?: boolean;
  /** Drag grip, supplied by the sortable wrapper. */
  handle?: React.ReactNode;
}

/** Design artboard: the expanded block card inside the current phase. */
export function BlockCard({ block, planId, phaseLabel, active = false, handle }: BlockCardProps) {
  const [pending, startTransition] = useTransition();
  const [uploadOpen, setUploadOpen] = useState(false);

  const save = (changes: Partial<{ title: string; verbLevel: VerbLevel; competenceType: CompetenceType }>) => {
    startTransition(async () => {
      await updateBlock({
        planId,
        blockId: block.id,
        title: changes.title ?? block.title,
        description: block.description,
        verbLevel: changes.verbLevel ?? block.verbLevel,
        competenceType: changes.competenceType ?? block.competenceType,
        // hours is deliberately omitted — the design never shows it, and the
        // action preserves the stored value when it is absent.
      });
    });
  };

  return (
    <div className={`tp-card ${active ? "tp-card-active" : ""} tp-reveal-host`} style={{ padding: 18 }}>
      <div className="tp-row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div className="tp-col" style={{ gap: 6, minWidth: 0, flex: 1 }}>
          <div className="tp-row tp-gap-2" style={{ flexWrap: "wrap" }}>
            <SelectPill
              variant="tag"
              className={competenceTagClass(block.competenceType)}
              value={block.competenceType}
              options={COMPETENCE_TYPES}
              ariaLabel={`Competence for ${block.title}`}
              disabled={pending}
              onChange={(competenceType) => save({ competenceType })}
            />
          </div>
          <InlineEdit
            value={block.title}
            ariaLabel="Block title"
            disabled={pending}
            onSubmit={(title) => save({ title })}
            style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}
          />
        </div>

        <div className="tp-row tp-gap-2" style={{ flexShrink: 0 }}>
          <SelectPill
            value={block.verbLevel}
            options={VERB_LEVELS}
            ariaLabel={`Verb level for ${block.title}`}
            disabled={pending}
            onChange={(verbLevel) => save({ verbLevel })}
          />
          {handle}
        </div>
      </div>

      {block.exercises.length > 0 ? (
        <div className="tp-mt-3 tp-col tp-gap-2">
          <div className="tp-eyebrow">Exercises</div>
          {block.exercises.map((exercise) => (
            <div key={exercise.id} className="tp-file">
              <div className="tp-file-icon">{exercise.kind === "link" ? "URL" : fileKind(exercise.file_name)}</div>
              <div className="tp-col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12.5,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {exercise.file_name}
                </div>
                <div
                  className="tp-tiny tp-mut"
                  style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {exercise.kind === "link" ? exercise.url : formatBytes(exercise.size_bytes)}
                </div>
              </div>
              {/* Both stay visible. Hiding the remove button behind a hover
                  made it undiscoverable — the file looked permanent. */}
              {exercise.kind === "link" && exercise.url ? (
                <a
                  href={exercise.url}
                  target="_blank"
                  // noreferrer as well as noopener: without it the destination
                  // learns which plan the link was opened from.
                  rel="noopener noreferrer"
                  className="tp-btn tp-btn-ghost tp-btn-sm"
                  style={{ padding: "4px 8px", borderColor: "transparent", color: "var(--ink-2)" }}
                  aria-label={`Open ${exercise.file_name}`}
                  title="Open in a new tab"
                >
                  <ExternalLinkIcon size={12} />
                </a>
              ) : (
                <a
                  href={`/api/exercises/${exercise.id}/download`}
                  className="tp-btn tp-btn-ghost tp-btn-sm"
                  style={{ padding: "4px 8px", borderColor: "transparent", color: "var(--ink-2)" }}
                  aria-label={`Download ${exercise.file_name}`}
                  title="Download"
                >
                  <DownloadIcon size={12} />
                </a>
              )}
              <ConfirmButton
                className="tp-btn tp-btn-ghost tp-btn-sm"
                style={{ padding: "4px 8px", borderColor: "transparent", color: "var(--ink-2)" }}
                label="Remove"
                ariaLabel={`Remove ${exercise.file_name}`}
                title={`Remove "${exercise.file_name}"?`}
                body={
                  exercise.kind === "link"
                    ? "This removes the link from the block. Whatever it points at is untouched."
                    : "This deletes the file from storage as well as the block. It cannot be undone."
                }
                confirmLabel={exercise.kind === "link" ? "Remove link" : "Remove file"}
                disabled={pending}
                onConfirm={() =>
                  startTransition(async () => {
                    await deleteExercise({ planId, exerciseId: exercise.id });
                  })
                }
              >
                <TrashIcon size={12} />
              </ConfirmButton>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="tp-mt-3 tp-tiny tp-mut"
          style={{
            padding: "10px 12px",
            background: "var(--surface-2)",
            borderRadius: 8,
            border: "1px dashed var(--border-strong)",
          }}
        >
          No exercises yet
        </div>
      )}

      <div className="tp-mt-3 tp-row tp-gap-2">
        <button type="button" className="tp-ghost" style={{ padding: 10 }} onClick={() => setUploadOpen(true)}>
          <PlusIcon size={11} /> Add Exercise
        </button>
        <ConfirmButton
          className="tp-btn tp-btn-ghost tp-btn-sm tp-reveal"
          style={{ flexShrink: 0 }}
          disabled={pending}
          label="Remove"
          ariaLabel={`Remove block ${block.title}`}
          title={`Remove "${block.title}"?`}
          body={
            block.exercises.length > 0
              ? `This deletes the block, its gate and ${block.exercises.length} attached file${
                  block.exercises.length === 1 ? "" : "s"
                }. It cannot be undone.`
              : "This deletes the block and its gate. It cannot be undone."
          }
          confirmLabel="Remove block"
          onConfirm={() =>
            startTransition(async () => {
              await deleteBlock(planId, block.id);
            })
          }
        />
      </div>

      <ExerciseUploadPanel
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        planId={planId}
        phaseLabel={phaseLabel}
        block={block}
      />
    </div>
  );
}
