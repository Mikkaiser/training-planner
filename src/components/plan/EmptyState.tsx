"use client";

import { useTransition } from "react";
import { createPhase } from "@/actions/phases";
import { AddInline } from "@/components/plan/detail/AddInline";

const PHASE_SUGGESTIONS = ["Foundation", "Intermediate", "Advanced"] as const;

/**
 * Design artboard: empty-1 "Empty roadmap" — where a just-created plan lands.
 * The heading is 22px here, not the 48px the scaffold used; at 48px it read as
 * an error page rather than an invitation.
 */
export function EmptyState({ planId }: { planId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="tp-col"
      style={{ alignItems: "center", gap: 18, maxWidth: 480, margin: "40px auto 0", textAlign: "center" }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "var(--accent-soft)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div style={{ width: 28, height: 28, border: "2.5px dashed var(--accent)", borderRadius: 8 }} />
      </div>

      <div className="tp-col" style={{ gap: 6 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>A blank roadmap, a clear horizon.</div>
        <div className="tp-mut" style={{ fontSize: 14, lineHeight: 1.55 }}>
          Start by adding the first phase — Foundation is the usual one. From there, every block, gate, and exercise
          grows from where you click.
        </div>
      </div>

      <div style={{ width: "100%", marginTop: 8 }}>
        <AddInline
          large
          label="Add Phase"
          placeholder="Phase name, e.g. Foundation"
          disabled={pending}
          suggestions={PHASE_SUGGESTIONS}
          onSubmit={(title) =>
            startTransition(async () => {
              await createPhase({ planId, title, orderIndex: 1 });
            })
          }
        />
      </div>
    </div>
  );
}
