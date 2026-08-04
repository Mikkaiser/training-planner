"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRun } from "@/actions/assessments";
import { Modal } from "@/components/ui/Modal";
import { CrossIcon, PlusIcon } from "@/components/ui/icons";
import { assessmentRunRoute, APP_ROUTES } from "@/lib/routes";

export type SchemeOption = { id: string; testProject: string; totalMax: number };

/**
 * Starts a marking run from a competitor's roadmap.
 *
 * The mirror of StartRunButton: there the scheme is fixed and you pick the
 * competitor; here the competitor is fixed and you pick the test project. Two
 * small components rather than one with a mode, because the fixed side changes
 * what the question even is.
 */
export function MarkTestProjectButton({ planId, schemes }: { planId: string; schemes: SchemeOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [schemeId, setSchemeId] = useState(schemes[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (!schemeId) {
      setError("Pick a test project first.");
      return;
    }

    startTransition(async () => {
      try {
        const run = await createRun({ schemeId, planId, label });
        setOpen(false);
        router.push(assessmentRunRoute(run.id));
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Could not start that run.");
      }
    });
  };

  return (
    <>
      <button type="button" className="tp-btn tp-btn-ghost tp-btn-sm" onClick={() => setOpen(true)}>
        <PlusIcon size={11} /> Mark a test project
      </button>

      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Mark a test project" width={460}>
        <div className="tp-modal-pad">
          <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div className="tp-col" style={{ gap: 4 }}>
              <div className="tp-eyebrow">New marking run</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Which test project?</div>
            </div>
            <button
              type="button"
              className="tp-btn tp-btn-ghost tp-btn-sm"
              style={{ padding: "4px 8px", borderColor: "transparent", color: "var(--ink-2)" }}
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <CrossIcon size={12} />
            </button>
          </div>

          {schemes.length === 0 ? (
            <div className="tp-mt-4">
              <p className="tp-mut tp-sm" style={{ marginTop: 0 }}>
                No marking schemes yet. Upload one and it will show up here.
              </p>
              <Link href={APP_ROUTES.assessments} className="tp-btn tp-btn-primary">
                Go to Assessments
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <label className="tp-col tp-gap-2 tp-mt-4">
                <span className="tp-eyebrow">Test project</span>
                <select
                  className="tp-input"
                  value={schemeId}
                  onChange={(event) => setSchemeId(event.target.value)}
                  style={{ padding: "11px 14px" }}
                >
                  {schemes.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.testProject} ({scheme.totalMax} marks)
                    </option>
                  ))}
                </select>
              </label>

              <label className="tp-col tp-gap-2 tp-mt-3">
                <span className="tp-eyebrow">Label (optional)</span>
                <input
                  className="tp-input"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="e.g. First attempt"
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
                <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="tp-btn tp-btn-primary" disabled={pending}>
                  {pending ? "Starting…" : "Start marking"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
