"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPlan } from "@/actions/plans";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { planDetailRoute } from "@/lib/routes";

interface PlanCreateModalProps {
  open: boolean;
  onClose: () => void;
}

export function PlanCreateModal({ open, onClose }: PlanCreateModalProps) {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [title, setTitle] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);

    if (!studentName.trim() || !title.trim() || !isConfirmed) {
      setError("Fill both fields and confirm to continue.");
      return;
    }

    startTransition(async () => {
      try {
        const data = await createPlan({
          studentName: studentName.trim(),
          title: title.trim(),
        });

        setStudentName("");
        setTitle("");
        setIsConfirmed(false);
        onClose();
        router.push(planDetailRoute(data.id));
        router.refresh();
      } catch (submitError: unknown) {
        setError(submitError instanceof Error ? submitError.message : "Could not create plan.");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="New Training Plan">
      <p style={{ marginTop: 0, color: "var(--ink-2)", fontSize: "14px" }}>
        Just two things to get started - you will build the rest inline.
      </p>

      <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
        <label className="tp-mono" style={{ fontSize: "11px", color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 600 }}>
          Student Name
        </label>
        <input className="tp-input" value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="e.g. Hana Berg" />
      </div>

      <div style={{ display: "grid", gap: "10px", marginTop: "14px" }}>
        <label className="tp-mono" style={{ fontSize: "11px", color: "var(--ink-2)", textTransform: "uppercase", fontWeight: 600 }}>
          Plan Title
        </label>
        <input className="tp-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Road to Lyon 2027" />
      </div>

      <label style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--ink-2)", fontSize: "12px" }}>
        <input type="checkbox" checked={isConfirmed} onChange={(event) => setIsConfirmed(event.target.checked)} />
        to confirm
      </label>

      {error ? <p style={{ color: "var(--neg)", marginTop: "10px", marginBottom: 0, fontSize: "12px" }}>{error}</p> : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? "Creating..." : "Create Plan"}
        </Button>
      </div>
    </Modal>
  );
}
