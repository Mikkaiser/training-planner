"use client";

import { useEffect, useState, useTransition } from "react";
import { updateExercise } from "@/actions/exercises";
import { Modal } from "@/components/ui/Modal";
import { PencilIcon } from "@/components/ui/icons";
import { MAX_LABEL_LENGTH, MAX_URL_LENGTH, normaliseExerciseUrl } from "@/lib/exercise-files";
import type { Exercise } from "@/lib/types";

/**
 * Corrects an exercise's label, and where a link points.
 *
 * Both were fixed at the moment of attaching: a mistyped label or a URL that
 * later moved meant deleting the exercise and adding it again, which for a file
 * meant uploading the whole thing a second time.
 */
export function EditExerciseButton({
  planId,
  exercise,
  disabled,
}: {
  planId: string;
  exercise: Exercise;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="tp-btn tp-btn-ghost tp-btn-sm"
        style={{ padding: "4px 8px", borderColor: "transparent", color: "var(--ink-2)" }}
        aria-label={`Edit ${exercise.file_name}`}
        title="Edit"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <PencilIcon size={12} />
      </button>

      <EditExerciseModal
        planId={planId}
        exercise={exercise}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function EditExerciseModal({
  planId,
  exercise,
  open,
  onClose,
}: {
  planId: string;
  exercise: Exercise;
  open: boolean;
  onClose: () => void;
}) {
  const isLink = exercise.kind === "link";
  const [label, setLabel] = useState(exercise.file_name);
  const [url, setUrl] = useState(exercise.url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Reopening after a cancel should show what is stored, not what was typed
  // and abandoned last time.
  useEffect(() => {
    if (open) {
      setLabel(exercise.file_name);
      setUrl(exercise.url ?? "");
      setError(null);
    }
  }, [open, exercise.file_name, exercise.url]);

  const submit = () => {
    setError(null);

    if (!label.trim()) {
      setError("An exercise needs a label.");
      return;
    }

    if (isLink) {
      // Checked here as well as on the server so a bad URL is caught before a
      // round trip; the server repeats it because this check is skippable.
      const checked = normaliseExerciseUrl(url);
      if (!checked.ok) {
        setError(checked.reason);
        return;
      }
    }

    startTransition(async () => {
      try {
        await updateExercise({
          planId,
          exerciseId: exercise.id,
          label,
          url: isLink ? url : undefined,
        });
        onClose();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Could not save that.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} ariaLabel={`Edit ${exercise.file_name}`} width={460}>
      <div className="tp-modal-pad">
        <div className="tp-eyebrow">{isLink ? "Edit link" : "Edit file"}</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
          {isLink ? "Label and destination" : "Label"}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="tp-col tp-gap-2 tp-mt-4">
            <span className="tp-eyebrow">Label</span>
            <input
              className="tp-input"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={MAX_LABEL_LENGTH}
              autoFocus
              style={{ padding: "11px 14px" }}
            />
          </label>

          {isLink ? (
            <label className="tp-col tp-gap-2 tp-mt-3">
              <span className="tp-eyebrow">Link</span>
              <input
                className="tp-input"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                maxLength={MAX_URL_LENGTH}
                style={{ padding: "11px 14px" }}
              />
            </label>
          ) : (
            <p className="tp-tiny tp-mut tp-mt-3" style={{ margin: 0, lineHeight: 1.5 }}>
              An uploaded file has no address to edit — it is served from this block. To swap the
              document itself, remove this one and upload the new version.
            </p>
          )}

          {/* Reuse and cloning make independent rows, so this is not a
              surprise waiting to happen on somebody else's roadmap. */}
          <p className="tp-tiny tp-mut tp-mt-3" style={{ margin: 0, lineHeight: 1.5 }}>
            Only this block&rsquo;s copy changes.
          </p>

          {error ? (
            <p className="tp-tiny tp-mt-3" style={{ color: "var(--neg)", margin: 0 }}>
              {error}
            </p>
          ) : null}

          <div className="tp-row tp-gap-2 tp-mt-4" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="tp-btn tp-btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
