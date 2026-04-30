"use client";

import { useTransition } from "react";
import { Check, Flag, X } from "lucide-react";
import { updateGateStatus } from "@/actions/blocks";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Gate } from "@/lib/types";

interface GateMarkerProps {
  gate: Gate;
  index: number;
  planId: string;
}

export function GateMarker({ gate, index, planId }: GateMarkerProps) {
  const [pending, startTransition] = useTransition();

  const setStatus = (status: "passed" | "failed") => {
    startTransition(async () => {
      await updateGateStatus({ gateId: gate.id, planId, status });
    });
  };

  return (
    <article className="tp-gate">
      <div className={`tp-gate-icon ${gate.status === "passed" ? "passed" : gate.status === "failed" ? "failed" : ""}`}>
        {gate.status === "passed" ? <Check size={16} /> : gate.status === "failed" ? <X size={16} /> : <Flag size={16} />}
      </div>

      <div style={{ display: "grid", gap: "4px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <strong style={{ fontSize: "22px" }}>Gate {index + 1}</strong>
          <StatusBadge status={gate.status} />
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--ink-2)" }}>
          Cumulative · Hours threshold {gate.hours_threshold}
        </p>
      </div>

      {gate.status === "pending" ? (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="positive" size="sm" disabled={pending} onClick={() => setStatus("passed")}>
            Mark Passed
          </Button>
          <Button variant="negative" size="sm" disabled={pending} onClick={() => setStatus("failed")}>
            Mark Failed
          </Button>
        </div>
      ) : null}
    </article>
  );
}
