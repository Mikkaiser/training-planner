"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteScheme, updateScheme } from "@/actions/assessments";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { Modal } from "@/components/ui/Modal";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";

export type SchemeActionsTarget = {
  id: string;
  skill: string;
  testProject: string;
  runCount: number;
};

/**
 * Rename or remove a marking scheme from the library.
 *
 * Deleting was already possible but only from inside a scheme, and renaming was
 * not possible at all — a scheme took its title from the workbook, so a typo in
 * the file was permanent unless the whole thing was re-imported and every run
 * against it lost.
 */
export function SchemeActions({ scheme }: { scheme: SchemeActionsTarget }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const runs =
    scheme.runCount === 0
      ? "No marking runs have been made against it"
      : `That also deletes ${scheme.runCount} marking run${scheme.runCount === 1 ? "" : "s"} and every mark in ${scheme.runCount === 1 ? "it" : "them"}`;

  return (
    <div className="tp-row tp-gap-2 tp-card-actions" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="tp-btn tp-btn-ghost tp-btn-sm"
        style={{ padding: "5px 7px", color: "var(--ink-2)" }}
        aria-label={`Edit ${scheme.testProject}`}
        title="Edit"
        disabled={pending}
        onClick={() => setEditing(true)}
      >
        <PencilIcon size={12} />
      </button>

      <ConfirmButton
        className="tp-btn tp-btn-ghost tp-btn-sm"
        style={{ padding: "5px 7px", color: "var(--ink-2)" }}
        label="Delete"
        ariaLabel={`Delete ${scheme.testProject}`}
        title={`Delete "${scheme.testProject}"?`}
        body={`This removes the scheme and its criteria. ${runs}. It cannot be undone.`}
        confirmLabel="Delete scheme"
        disabled={pending}
        onConfirm={() =>
          startTransition(async () => {
            await deleteScheme(scheme.id);
            router.refresh();
          })
        }
      >
        <TrashIcon size={12} />
      </ConfirmButton>

      <EditSchemeModal
        scheme={scheme}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function EditSchemeModal({
  scheme,
  open,
  onClose,
  onSaved,
}: {
  scheme: SchemeActionsTarget;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [skill, setSkill] = useState(scheme.skill);
  const [testProject, setTestProject] = useState(scheme.testProject);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setSkill(scheme.skill);
      setTestProject(scheme.testProject);
      setError(null);
    }
  }, [open, scheme.skill, scheme.testProject]);

  const submit = () => {
    setError(null);
    if (!skill.trim() || !testProject.trim()) {
      setError("A scheme needs both a skill and a test project.");
      return;
    }

    startTransition(async () => {
      try {
        await updateScheme({ schemeId: scheme.id, skill, testProject });
        onSaved();
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Could not save that.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} ariaLabel={`Edit ${scheme.testProject}`} width={440}>
      <div className="tp-modal-pad">
        <div className="tp-eyebrow">Edit scheme</div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
          Skill and test project
        </div>
        <p className="tp-tiny tp-mut" style={{ marginTop: 6, marginBottom: 0, lineHeight: 1.5 }}>
          Only the titles. Criteria and aspects come from the workbook — to change those, import a
          corrected file, which creates a new scheme and leaves existing runs intact.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="tp-col tp-gap-2 tp-mt-4">
            <span className="tp-eyebrow">Skill</span>
            <input
              className="tp-input"
              value={skill}
              onChange={(event) => setSkill(event.target.value)}
              maxLength={200}
              autoFocus
              style={{ padding: "11px 14px" }}
            />
          </label>

          <label className="tp-col tp-gap-2 tp-mt-3">
            <span className="tp-eyebrow">Test project</span>
            <input
              className="tp-input"
              value={testProject}
              onChange={(event) => setTestProject(event.target.value)}
              maxLength={200}
              style={{ padding: "11px 14px" }}
            />
          </label>

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
