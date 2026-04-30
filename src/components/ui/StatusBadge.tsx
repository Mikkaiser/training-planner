import type { GateStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: GateStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn("tp-status", status === "passed" && "tp-status-passed", status === "failed" && "tp-status-failed", status === "pending" && "tp-status-pending")}>
      {status[0].toUpperCase()}
      {status.slice(1)}
    </span>
  );
}
