"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTeam } from "@/actions/teams";
import { Modal } from "@/components/ui/Modal";
import { PlusIcon } from "@/components/ui/icons";
import { APP_ROUTES } from "@/lib/routes";

export function NewTeamButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (!name.trim()) {
      setError("Give the team a name.");
      return;
    }

    startTransition(async () => {
      try {
        await createTeam({ name });
        setOpen(false);
        setName("");
        router.push(APP_ROUTES.team);
        router.refresh();
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Could not make that team.");
      }
    });
  };

  return (
    <>
      <button type="button" className="tp-btn tp-btn-ghost tp-btn-sm" onClick={() => setOpen(true)}>
        <PlusIcon size={11} /> New team
      </button>

      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="Make a team" width={440}>
        <div className="tp-modal-pad">
          <div className="tp-eyebrow">New team</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
            What is it called?
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label className="tp-col tp-gap-2 tp-mt-4">
              <span className="tp-eyebrow">Team name</span>
              <input
                className="tp-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. EmiratesSkills squad"
                maxLength={120}
                autoFocus
                style={{ padding: "11px 14px" }}
              />
            </label>

            <p className="tp-tiny tp-mut tp-mt-3" style={{ margin: 0, lineHeight: 1.5 }}>
              Plans made while this team is active belong to it. Your own plans stay where they are.
            </p>

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
                {pending ? "Making…" : "Make team"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
