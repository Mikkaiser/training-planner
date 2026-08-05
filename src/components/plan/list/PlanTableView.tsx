import Link from "next/link";
import type { CSSProperties } from "react";
import { PlanActions } from "@/components/plan/list/PlanActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChevronIcon, PlusIcon } from "@/components/ui/icons";
import { planDetailRoute } from "@/lib/routes";
import type { InstructorStats } from "@/lib/plan-data";
import type { PlanSummaryVM } from "@/lib/plan-view-model";
import { getInitials } from "@/lib/utils";

const td: CSSProperties = {
  padding: "16px 14px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "middle",
};
const tdLeft: CSSProperties = { ...td, paddingLeft: 24 };
const th: CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: 10.5,
  fontFamily: "var(--font-mono), monospace",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-2)",
  fontWeight: 600,
  borderBottom: "1px solid var(--border)",
};

/** Design artboard: list-v2 "Dense table". */
export function PlanTableView({ plans, stats }: { plans: PlanSummaryVM[]; stats: InstructorStats }) {
  const active = plans.filter((plan) => !plan.isDraft);
  const drafts = plans.filter((plan) => plan.isDraft);

  return (
    <>
      <StatStrip stats={stats} />

      <div className="tp-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="tp-table-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...th, paddingLeft: 24 }}>Competitor</th>
              <th style={th}>Phase</th>
              <th style={th}>Current block · level</th>
              <th style={th}>Overall</th>
              <th style={th}>Gate status</th>
              <th style={th} aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {active.map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
              {drafts.map((plan) => (
                <DraftRow key={plan.id} plan={plan} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatStrip({ stats }: { stats: InstructorStats }) {
  const cards = [
    { key: String(stats.activeCompetitors), label: "Active competitors" },
    { key: String(stats.blocksCompleted30d), label: "Blocks completed (30 d)" },
    {
      key: stats.gatesDecided === 0 ? "—" : `${stats.gatesPassedFirstTry}/${stats.gatesDecided}`,
      label: "Gates passed first try",
    },
    { key: String(stats.inRemediation), label: "In remediation", tone: stats.inRemediation > 0 ? "neg" : undefined },
  ];

  return (
    <div className="tp-stat-strip">
      {cards.map((card) => (
        <div key={card.label} className="tp-card" style={{ padding: "14px 18px" }}>
          <div className="tp-eyebrow">{card.label}</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: card.tone === "neg" ? "var(--neg)" : "var(--ink)",
              marginTop: 4,
            }}
          >
            {card.key}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlanRow({ plan }: { plan: PlanSummaryVM }) {
  return (
    <tr className="tp-row-linked">
      <td style={tdLeft}>
        <Link href={planDetailRoute(plan.id)} className="tp-row tp-gap-3">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#e6ecd2,#c2d499)",
              display: "grid",
              placeItems: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink)",
              flexShrink: 0,
            }}
          >
            {getInitials(plan.studentName)}
          </div>
          {/* The table already scrolls, so names read on one line rather than
              wrapping into two inside a column that has room beside it. */}
          <div className="tp-col" style={{ gap: 2, lineHeight: 1.25, whiteSpace: "nowrap" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{plan.studentName}</div>
            <div className="tp-tiny tp-mut">{plan.title}</div>
          </div>
        </Link>
      </td>
      <td style={td}>
        <div className="tp-col" style={{ gap: 4 }}>
          <div className="tp-row tp-gap-2 tp-tiny" style={{ alignItems: "baseline" }}>
            <span className="tp-mono" style={{ fontSize: 11, color: "var(--ink-2)" }}>
              P{plan.phaseIndex}
            </span>
            <span style={{ fontWeight: 600 }}>{plan.currentPhaseName}</span>
          </div>
          <div className="tp-tiny tp-mut">
            {plan.blocksDone}/{plan.blocksTotal} blocks
          </div>
        </div>
      </td>
      <td style={td}>
        <div className="tp-col" style={{ gap: 4, minWidth: 160 }}>
          <div
            className="tp-sm"
            style={{
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 200,
            }}
          >
            {plan.currentBlockTitle ?? "All blocks complete"}
          </div>
          {plan.verbLevel ? (
            <span className="tp-pill tp-pill-mono" style={{ alignSelf: "flex-start" }}>
              {plan.verbLevel}
            </span>
          ) : null}
        </div>
      </td>
      <td style={td}>
        <div className="tp-row tp-gap-3">
          <div className="tp-bar" style={{ flex: 1, minWidth: 100 }}>
            <i style={{ width: `${plan.progress}%` }} />
          </div>
          <div className="tp-tiny tp-mono tp-mut" style={{ width: 32, textAlign: "right" }}>
            {plan.progress}%
          </div>
        </div>
      </td>
      <td style={td}>
        <div className="tp-col" style={{ gap: 4 }}>
          <div className="tp-tiny tp-mut tp-mono">{plan.gateLabel ?? "—"}</div>
          {plan.gateStatus ? <StatusBadge status={plan.gateStatus} /> : null}
        </div>
      </td>
      <td style={{ ...td, textAlign: "right", paddingRight: 24 }}>
        <div className="tp-row tp-gap-2" style={{ justifyContent: "flex-end", alignItems: "center" }}>
          <PlanActions plan={plan} />
          <Link href={planDetailRoute(plan.id)} className="tp-mut" aria-label={`Open ${plan.studentName}'s plan`}>
            <ChevronIcon size={12} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

/**
 * No tp-row-linked here: the inline tint would beat the hover rule anyway, and
 * a draft row already signals itself with that tint and an explicit "Open →".
 */
function DraftRow({ plan }: { plan: PlanSummaryVM }) {
  return (
    <tr style={{ background: "rgba(219, 253, 107, 0.06)" }}>
      <td style={tdLeft}>
        <Link href={planDetailRoute(plan.id)} className="tp-row tp-gap-3">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1.5px dashed var(--accent)",
              display: "grid",
              placeItems: "center",
              color: "var(--ink-2)",
              flexShrink: 0,
            }}
          >
            <PlusIcon size={12} />
          </div>
          <div className="tp-col" style={{ gap: 2, whiteSpace: "nowrap" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{plan.studentName}</div>
            <div className="tp-tiny tp-mut">{plan.title}</div>
          </div>
        </Link>
      </td>
      <td style={td} colSpan={4}>
        <span className="tp-tiny tp-mut">Empty plan — no phases yet</span>
      </td>
      <td style={{ ...td, textAlign: "right", paddingRight: 24 }}>
        <Link
          href={planDetailRoute(plan.id)}
          className="tp-tiny tp-mono"
          style={{
            color: "var(--accent-ink)",
            background: "var(--accent-soft)",
            padding: "4px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
          }}
        >
          Open →
        </Link>
      </td>
    </tr>
  );
}
