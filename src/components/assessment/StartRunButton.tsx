"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRun } from "@/actions/assessments";
import { Modal } from "@/components/ui/Modal";
import { CrossIcon, PlusIcon } from "@/components/ui/icons";
import { assessmentRunRoute } from "@/lib/routes";

export type CompetitorOption = { id: string; studentName: string; title: string };

export function StartRunButton({ schemeId, competitors }: { schemeId: string; competitors: CompetitorOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const run = await createRun({ schemeId, planId: planId || null, label });
        setOpen(false);
        setPlanId("");
        setLabel("");
        router.push(assessmentRunRoute(run.id));
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Could not start that run.");
      }
    });
  };

  return (
    <>
      <button type="button" className="tp-btn tp-btn-primary" onClick={() => setOpen(true)}>
        <PlusIcon size={12} /> Start marking
      </button>

      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Start a marking run" width={460}>
        <div className="tp-modal-pad">
          <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div className="tp-col" style={{ gap: 4 }}>
              <div className="tp-eyebrow">New marking run</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Who are you marking?</div>
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

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className="tp-col tp-gap-2 tp-mt-4">
              <span className="tp-eyebrow">Competitor</span>
              <select
                className="tp-input"
                value={planId}
                onChange={(event) => setPlanId(event.target.value)}
                style={{ padding: "11px 14px" }}
              >
                {/* Optional: a scheme can be trialled before anyone sits it. */}
                <option value="">No competitor — practice run</option>
                {competitors.map((competitor) => (
                  <option key={competitor.id} value={competitor.id}>
                    {competitor.studentName} — {competitor.title}
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
        </div>
      </Modal>
    </>
  );
}
