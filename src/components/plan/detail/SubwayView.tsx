"use client";

import { useMemo } from "react";
import { AddGateButton } from "@/components/plan/detail/AddGateButton";
import { BlockCard } from "@/components/plan/detail/BlockCard";
import { GateMarker } from "@/components/plan/detail/GateMarker";
import { layoutSubway, type Station } from "@/lib/layout/subway-layout";
import type { PhaseStatus, PlanVM } from "@/lib/plan-view-model";

const PHASE_STROKE: Record<PhaseStatus, string> = {
  complete: "#cdd1bc",
  current: "var(--accent)",
  locked: "rgba(28,31,51,0.15)",
};

/** Design artboard: detail-v3 "Subway map (wildcard)". */
export function SubwayView({ plan }: { plan: PlanVM }) {
  const layout = useMemo(() => layoutSubway(plan), [plan]);
  const current = plan.currentBlock;
  const currentPhase = plan.currentPhase;

  return (
    <div>
      <div className="tp-row" style={{ justifyContent: "space-between", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
        <div className="tp-col">
          <div className="tp-eyebrow">Route view</div>
          {/* The design's hand-written "The line to Lyon" does not generalise —
              plan titles already read as destinations, so the title stands alone. */}
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{plan.title}</div>
        </div>
        <div className="tp-row tp-gap-3" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          {plan.phases.map((phase) => (
            <div key={phase.id} className="tp-row tp-gap-2">
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: PHASE_STROKE[phase.status],
                  border: "1.5px solid rgba(0,0,0,0.08)",
                }}
              />
              <span className="tp-tiny tp-mut">{phase.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tp-card tp-svg-scroll" style={{ padding: "20px 16px", position: "relative" }}>
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width="100%"
          // Below this the station labels stop being readable, so the map
          // scrolls sideways instead of shrinking any further.
          style={{ display: "block", minWidth: 620 }}
          role="img"
          aria-label={`Route map of ${plan.totals.blocks} blocks across ${plan.totals.phases} phases`}
        >
          {layout.segments.map((segment) => (
            <path
              key={segment.key}
              d={segment.d}
              stroke={PHASE_STROKE[segment.status]}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={segment.status === "locked" ? "2 6" : undefined}
            />
          ))}

          {layout.phaseLabels.map((label) => (
            <text
              key={label.key}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              fontSize="10.5"
              fontFamily="var(--font-mono), monospace"
              letterSpacing="1"
              fontWeight={label.status === "current" ? 700 : 500}
              fill={label.status === "current" ? "var(--ink)" : "var(--ink-3)"}
            >
              {label.text.toUpperCase()}
            </text>
          ))}

          {layout.gates.map((gate) => {
            const passed = gate.status === "passed";
            const failed = gate.status === "failed";
            const colour = passed ? "var(--pos)" : failed ? "var(--neg)" : "var(--ink-2)";
            return (
              <g key={gate.key} transform={`translate(${gate.x} ${gate.y})`}>
                <circle r="9" fill="white" stroke={colour} strokeWidth="1.5" />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="8"
                  fontFamily="var(--font-mono), monospace"
                  fontWeight="700"
                  fill={colour}
                >
                  {gate.label}
                </text>
              </g>
            );
          })}

          {layout.stations.map((station) => (
            <StationMark key={station.key} station={station} />
          ))}
        </svg>
      </div>

      {current ? (
        <div style={{ marginTop: 24, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
          <div className="tp-eyebrow" style={{ textAlign: "center", marginBottom: 10 }}>
            Now standing at — Station {current.index}
          </div>
          <BlockCard
            block={current}
            planId={plan.id}
            phaseLabel={currentPhase ? `Phase ${currentPhase.index} · ${currentPhase.title}` : ""}
            active
          />
          <div className="tp-mt-3">
            {current.gate ? (
              <GateMarker gate={current.gate} planId={plan.id} />
            ) : (
              <AddGateButton planId={plan.id} blockId={current.id} />
            )}
          </div>
        </div>
      ) : (
        <div className="tp-mt-4 tp-mut tp-sm" style={{ textAlign: "center" }}>
          {plan.blocks.length === 0 ? "No blocks on the route yet." : "Every gate on this route has been passed."}
        </div>
      )}
    </div>
  );
}

function StationMark({ station }: { station: Station }) {
  const isGoal = station.state === "goal";
  const isCurrent = station.state === "current";
  const isDone = station.state === "done";

  const radius = isGoal ? 14 : isCurrent ? 12 : 9;
  const fill = isGoal ? "var(--ink)" : isCurrent ? "var(--accent)" : "white";
  const stroke = isGoal || isCurrent ? "var(--ink)" : isDone ? "var(--pos)" : "var(--border-strong)";

  // Labels sit below the line on top rows and above it on lower rows so the
  // text never lands on the segment that follows.
  const labelStart = station.labelBelow ? radius + 16 : -(radius + 12 + (station.lines.length - 1) * 11);

  return (
    <g transform={`translate(${station.x} ${station.y})`}>
      {isCurrent ? <circle r={20} fill="var(--accent-soft)" /> : null}
      <circle r={radius} fill={fill} stroke={stroke} strokeWidth={isCurrent ? 3 : 2.5} />
      {isDone ? (
        <path d="M-3 0L-1 2L3 -2" stroke="var(--pos)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {isGoal ? (
        <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill="var(--accent)" fontWeight="700">
          ★
        </text>
      ) : null}

      {station.lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={labelStart + i * 11}
          textAnchor="middle"
          fontSize="10"
          fontWeight={isCurrent || isGoal ? 700 : 600}
          fill={isCurrent || isGoal ? "var(--ink)" : "var(--ink-2)"}
        >
          {line}
        </text>
      ))}

      {station.level ? (
        <text
          x={0}
          y={labelStart + station.lines.length * 11}
          textAnchor="middle"
          fontSize="8.5"
          fontFamily="var(--font-mono), monospace"
          letterSpacing="0.5"
          fontWeight="600"
          fill={isCurrent ? "var(--ink)" : "var(--ink-3)"}
        >
          {station.level.toUpperCase()}
        </text>
      ) : null}
    </g>
  );
}
