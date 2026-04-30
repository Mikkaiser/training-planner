"use client";

import { GhostButton } from "@/components/ui/GhostButton";

interface EmptyStateProps {
  onAddPhase: (title: string) => void;
}

export function EmptyState({ onAddPhase }: EmptyStateProps) {
  return (
    <section style={{ padding: "90px 16px", textAlign: "center" }}>
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          margin: "0 auto 20px",
          background: "var(--accent-soft)",
          border: "1.5px dashed var(--accent)",
        }}
      />
      <h2 style={{ margin: 0, fontSize: "48px", letterSpacing: "-0.025em" }}>A blank roadmap, a clear horizon.</h2>
      <p style={{ margin: "12px auto 30px", maxWidth: "520px", color: "var(--ink-2)", lineHeight: 1.55 }}>
        Start by adding the first phase - Foundation is the usual one. From there, every block, gate, and exercise
        grows from where you click.
      </p>
      <div style={{ maxWidth: "430px", margin: "0 auto" }}>
        <GhostButton large onClick={() => onAddPhase("Foundation")}>
          Add Phase
        </GhostButton>
      </div>
      <div style={{ marginTop: "24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ color: "var(--ink-2)", fontSize: "12px" }}>Quick add:</span>
        <button className="tp-pill tp-pill-mono" onClick={() => onAddPhase("Foundation")}>
          Foundation
        </button>
        <button className="tp-pill tp-pill-mono" onClick={() => onAddPhase("Intermediate")}>
          Intermediate
        </button>
        <button className="tp-pill tp-pill-mono" onClick={() => onAddPhase("Advanced")}>
          Advanced
        </button>
      </div>
    </section>
  );
}
