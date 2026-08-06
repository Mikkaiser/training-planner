"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inviteMember, type InviteResult } from "@/actions/teams";
import { Modal } from "@/components/ui/Modal";
import { PlusIcon } from "@/components/ui/icons";

/**
 * Invites a trainer by email.
 *
 * The link is shown on screen after every invitation, whether or not the email
 * went out. Delivery fails for reasons this app cannot see, and an invitation
 * that exists but cannot be passed on by hand is one that silently did not
 * happen.
 */
export function InviteButton({ teamId }: { teamId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setEmail("");
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        setResult(await inviteMember({ teamId, email }));
        router.refresh();
      } catch (inviteError) {
        setError(inviteError instanceof Error ? inviteError.message : "Could not send that invitation.");
      }
    });
  };

  return (
    <>
      <button type="button" className="tp-btn tp-btn-primary tp-btn-sm" onClick={() => setOpen(true)}>
        <PlusIcon size={11} /> Invite a trainer
      </button>

      <Modal open={open} onClose={close} ariaLabel="Invite a trainer" width={460}>
        <div className="tp-modal-pad">
          <div className="tp-eyebrow">New member</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
            Invite a trainer
          </div>

          {result ? (
            <div className="tp-mt-4">
              <p className="tp-sm" style={{ marginTop: 0, lineHeight: 1.6 }}>
                {result.emailSent
                  ? `Invitation sent to ${email}.`
                  : `Invitation created, but the email did not go out.`}
              </p>
              {result.emailError ? (
                <p className="tp-tiny" style={{ color: "var(--neg)", marginTop: 0 }}>
                  {result.emailError}
                </p>
              ) : null}

              <div className="tp-eyebrow tp-mt-3">Or send this link yourself</div>
              <div className="tp-row tp-gap-2 tp-mt-2">
                <input className="tp-input" readOnly value={result.acceptUrl} style={{ flex: 1, padding: "9px 12px", fontSize: 12 }} />
                <button
                  type="button"
                  className="tp-btn tp-btn-ghost"
                  onClick={() => {
                    void navigator.clipboard.writeText(result.acceptUrl).then(() => setCopied(true));
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="tp-tiny tp-mut tp-mt-2" style={{ margin: 0 }}>
                The link expires in 7 days and works once.
              </p>

              <div className="tp-row tp-gap-2 tp-mt-4" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="tp-btn tp-btn-primary" onClick={close}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <label className="tp-col tp-gap-2 tp-mt-4">
                <span className="tp-eyebrow">Their email</span>
                <input
                  className="tp-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="trainer@example.com"
                  maxLength={254}
                  autoFocus
                  style={{ padding: "11px 14px" }}
                />
              </label>

              <p className="tp-tiny tp-mut tp-mt-3" style={{ margin: 0, lineHeight: 1.5 }}>
                They will see and edit every plan in this team. Their own plans stay private to them.
              </p>

              {error ? (
                <p className="tp-tiny tp-mt-3" style={{ color: "var(--neg)", margin: 0 }}>
                  {error}
                </p>
              ) : null}

              <div className="tp-row tp-gap-2 tp-mt-4" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="tp-btn tp-btn-ghost" onClick={close}>
                  Cancel
                </button>
                <button type="submit" className="tp-btn tp-btn-primary" disabled={pending || !email.trim()}>
                  {pending ? "Inviting…" : "Send invitation"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
