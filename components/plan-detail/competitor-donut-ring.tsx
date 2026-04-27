"use client";

import { useEffect, useMemo, useState } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

export type DonutRingCompetitor = {
  id: string;
  name: string;
  color: string;
};

export type DonutRingSegmentState =
  | { kind: "passed"; scoreLabel: string }
  | { kind: "failed"; scoreLabel: string }
  | { kind: "none" };

type Props = {
  competitors: DonutRingCompetitor[];
  segments: DonutRingSegmentState[];
  activeCompetitorIds?: string[];
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
  gapDegrees?: number;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function donutLabelForState(state: DonutRingSegmentState) {
  if (state.kind === "passed") return `Passed (${state.scoreLabel})`;
  if (state.kind === "failed") return `Failed (${state.scoreLabel})`;
  return "No attempts yet";
}

export function CompetitorDonutRing({
  competitors,
  segments,
  activeCompetitorIds,
  centerLabel,
  size = 32,
  strokeWidth = 4,
  gapDegrees = 2.5,
  className,
}: Props): React.JSX.Element {
  const n = Math.max(1, competitors.length);
  const safeSegments = useMemo(() => {
    const list: DonutRingSegmentState[] = [];
    for (let i = 0; i < n; i += 1) list.push(segments[i] ?? { kind: "none" });
    return list;
  }, [segments, n]);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const perDeg = c / 360;
  const gap = clamp(gapDegrees, 0, 8) * perDeg;
  const segLen = Math.max(0, c / n - gap);

  const [flashAll, setFlashAll] = useState(false);
  const allPassed = safeSegments.every((s) => s.kind === "passed");
  const allPassedKey = safeSegments.map((s) => s.kind).join("|");

  useEffect(() => {
    if (!allPassed) return;
    setFlashAll(true);
    const t = window.setTimeout(() => setFlashAll(false), 200);
    return () => window.clearTimeout(t);
  }, [allPassed, allPassedKey]);

  const active = new Set(activeCompetitorIds ?? []);

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        className={cn("plan-donut-ring__trigger", className)}
        aria-label="Competitor gate status"
      >
        <span
          className={cn("plan-donut-ring", flashAll ? "plan-donut-ring--flash" : null)}
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="plan-donut-ring__svg"
            aria-hidden
          >
            <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              {competitors.slice(0, n).map((comp, idx) => {
                const state = safeSegments[idx] ?? { kind: "none" };
                const dash = `${segLen} ${Math.max(0, c - segLen)}`;
                const dashOffset = -idx * (c / n);

                const opacity =
                  state.kind === "passed" ? 1 : state.kind === "failed" ? 0.25 : 0.08;
                const stroke =
                  state.kind === "none" ? "var(--color-border-subtle)" : comp.color;

                const isActive = active.has(comp.id);

                return (
                  <circle
                    key={comp.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={dash}
                    strokeDashoffset={dashOffset}
                    className={cn(
                      "plan-donut-ring__seg",
                      isActive ? "plan-donut-ring__seg--active" : null
                    )}
                    style={{
                      opacity,
                      // Animation: state transitions should ease visually.
                      transition:
                        "opacity 400ms ease, stroke 400ms ease, filter 400ms ease, stroke-dasharray 400ms ease",
                    }}
                  />
                );
              })}
            </g>
          </svg>

          <span className="plan-donut-ring__center">{centerLabel}</span>
        </span>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner sideOffset={8} align="center">
          <PopoverPrimitive.Popup className="plan-donut-ring__tooltip glass-strong">
            <div className="plan-donut-ring__tooltip-title">Gate status</div>
            <ul className="plan-donut-ring__tooltip-list">
              {competitors.slice(0, n).map((comp, idx) => {
                const state = safeSegments[idx] ?? { kind: "none" };
                return (
                  <li key={comp.id} className="plan-donut-ring__tooltip-item">
                    <span
                      className="plan-donut-ring__swatch"
                      style={{ background: comp.color }}
                      aria-hidden
                    />
                    <span className="plan-donut-ring__tooltip-name">{comp.name}</span>
                    <span className="plan-donut-ring__tooltip-state">
                      {donutLabelForState(state)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

