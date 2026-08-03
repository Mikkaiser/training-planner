"use client";

import { useTransition } from "react";
import { updatePlan } from "@/actions/plans";
import { InlineEdit } from "@/components/ui/InlineEdit";

interface PlanIdentityProps {
  planId: string;
  studentName: string;
  title: string;
}

/**
 * The competitor's name and the plan title, editable in place.
 *
 * Both were plain text until now, so a typo made at creation was permanent —
 * the only fix was deleting the plan and rebuilding its roadmap. The design
 * draws these as static labels; making them click-to-edit keeps that look while
 * matching how every other name in the roadmap already behaves.
 */
export function PlanIdentity({ planId, studentName, title }: PlanIdentityProps) {
  const [pending, startTransition] = useTransition();

  const save = (next: { studentName?: string; title?: string }) =>
    startTransition(async () => {
      await updatePlan({
        planId,
        studentName: next.studentName ?? studentName,
        title: next.title ?? title,
      });
    });

  return (
    <div className="tp-col" style={{ lineHeight: 1.2, minWidth: 0 }}>
      <InlineEdit
        value={studentName}
        ariaLabel="Competitor name"
        disabled={pending}
        onSubmit={(value) => save({ studentName: value })}
        style={{ fontSize: 14, fontWeight: 700 }}
      />
      <InlineEdit
        value={title}
        ariaLabel="Plan title"
        disabled={pending}
        onSubmit={(value) => save({ title: value })}
        style={{ fontSize: 11, color: "var(--ink-2)" }}
      />
    </div>
  );
}
