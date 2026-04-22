"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";

type PlanCardMetaProps = {
  startDate: string | null;
  creatorName: string | null;
};

function initialsFrom(name: string | null | undefined): string {
  const src = (name ?? "").trim();
  if (!src) return "?";
  const parts = src.split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

export function PlanCardMeta({
  startDate,
  creatorName,
}: PlanCardMetaProps): React.JSX.Element {
  const startLabel = useMemo(() => {
    if (!startDate) return "—";
    try {
      return format(parseISO(startDate), "dd MMM yyyy");
    } catch {
      return "—";
    }
  }, [startDate]);

  return (
    <div className="plan-card-meta">
      <span className="inline-flex items-center gap-1.5 text-[12px] text-tp-muted">
        <CalendarDays size={14} />
        Start: {startLabel}
      </span>
      <span className="inline-flex items-center gap-2 text-[12px] text-tp-muted">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-tp-secondary"
          aria-hidden
        >
          {initialsFrom(creatorName)}
        </span>
        <span className="truncate">{creatorName?.trim() ? creatorName : "You"}</span>
      </span>
    </div>
  );
}

