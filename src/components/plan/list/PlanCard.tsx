import Link from "next/link";
import { PlanActions } from "@/components/plan/list/PlanActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GateIcon, PlusIcon } from "@/components/ui/icons";
import { planDetailRoute } from "@/lib/routes";
import type { PlanSummaryVM } from "@/lib/plan-view-model";

const pad2 = (value: number) => value.toString().padStart(2, "0");

/**
 * Design artboard: list-v1 "Card grid".
 * Every number comes from the view-model — the previous version printed a
 * hardcoded "/03" phase total and a blocks fraction of n/n, which read as
 * "everything is done" on a plan where nothing was.
 */
export function PlanCard({ plan }: { plan: PlanSummaryVM }) {
  if (plan.isDraft) return <EmptyPlanCard plan={plan} />;

  return (
    <div className="tp-card tp-card-linked" style={{ padding: 22 }}>
      <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div className="tp-col" style={{ gap: 4, minWidth: 0 }}>
          <Link
            href={planDetailRoute(plan.id)}
            className="tp-card-link"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {plan.studentName}
          </Link>
          <div className="tp-eyebrow">{plan.title}</div>
        </div>
        <div className="tp-row tp-gap-2" style={{ alignItems: "center", flexShrink: 0 }}>
          <div
            className="tp-mono tp-tiny tp-mut"
            style={{ background: "rgba(28,31,51,0.04)", padding: "4px 8px", borderRadius: 6 }}
          >
            {pad2(plan.phaseIndex)}/{pad2(plan.phaseTotal)}
          </div>
          <PlanActions plan={plan} />
        </div>
      </div>

      <div className="tp-row tp-mt-4" style={{ gap: 8, alignItems: "baseline" }}>
        <span className="tp-pill">
          Phase {plan.phaseIndex} · {plan.currentPhaseName}
        </span>
        <span className="tp-tiny tp-mut">
          {plan.blocksDone}/{plan.blocksTotal} blocks
        </span>
      </div>

      <div className="tp-mt-3 tp-row tp-gap-3">
        <div className="tp-bar" style={{ flex: 1 }}>
          <i style={{ width: `${plan.progress}%` }} />
        </div>
        <span className="tp-tiny tp-mono tp-mut">{plan.progress}%</span>
      </div>

      <div
        className="tp-mt-4 tp-row"
        style={{
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          background: "var(--surface-2)",
          borderRadius: 12,
          border: "1px solid var(--border)",
        }}
      >
        <div className="tp-col" style={{ gap: 2, minWidth: 0 }}>
          <div className="tp-eyebrow">Current block</div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {plan.currentBlockTitle ?? "All blocks complete"}
          </div>
        </div>
        {plan.verbLevel ? <div className="tp-pill tp-pill-mono">{plan.verbLevel}</div> : null}
      </div>

      <div className="tp-mt-3 tp-row" style={{ justifyContent: "space-between" }}>
        <div className="tp-row tp-gap-2 tp-tiny tp-mut">
          <GateIcon size={14} />
          <span style={{ fontWeight: 600 }}>{plan.gateLabel ?? "No gates"}</span>
        </div>
        {plan.gateStatus ? <StatusBadge status={plan.gateStatus} /> : null}
      </div>
    </div>
  );
}

/** Design artboard: the dashed "brand new plan" card with no phases yet. */
function EmptyPlanCard({ plan }: { plan: PlanSummaryVM }) {
  return (
    <div
      className="tp-card tp-card-linked"
      style={{ padding: 22, display: "flex", flexDirection: "column" }}
    >
      <div className="tp-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div className="tp-col" style={{ gap: 4, minWidth: 0 }}>
          <Link
            href={planDetailRoute(plan.id)}
            className="tp-card-link"
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            {plan.studentName}
          </Link>
          <div className="tp-eyebrow">{plan.title}</div>
        </div>
        <PlanActions plan={plan} />
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 0",
          borderTop: "1px dashed var(--border-strong)",
          marginTop: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--accent-soft)",
            display: "grid",
            placeItems: "center",
            color: "var(--ink)",
          }}
        >
          <PlusIcon size={16} />
        </div>
        <div className="tp-tiny tp-mut" style={{ textAlign: "center", maxWidth: 200, lineHeight: 1.5 }}>
          Brand new plan.
          <br />
          Open to add the first phase.
        </div>
      </div>
    </div>
  );
}
