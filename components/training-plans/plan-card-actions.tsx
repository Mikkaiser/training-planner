"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type PlanCardActionsProps = {
  planId: string;
  deleting: boolean;
  onDelete: () => void;
  chipStyle: {
    background: string;
    borderColor: string;
    color: string;
  };
};

export function PlanCardActions({
  planId,
  deleting,
  onDelete,
  chipStyle,
}: PlanCardActionsProps): React.JSX.Element {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <div className="plan-card-actions">
      <button
        type="button"
        onClick={() => router.push(`/plans/${planId}`)}
        className="plan-action-btn"
        style={chipStyle}
      >
        <Eye size={14} />
        View
      </button>
      <button
        type="button"
        onClick={() => router.push(`/plans/${planId}/edit`)}
        className="plan-action-btn"
        style={chipStyle}
      >
        <Pencil size={14} />
        Edit
      </button>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={deleting}
          className={cn("plan-action-btn plan-action-delete", deleting && "opacity-60")}
        >
          <Trash2 size={14} />
          Delete
        </button>
      ) : (
        <div className="plan-action-confirm">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              onDelete();
            }}
            className="plan-action-btn plan-action-confirm-yes"
            disabled={deleting}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="plan-action-btn plan-action-confirm-no"
            disabled={deleting}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

