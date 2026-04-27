"use client";

import type { GateAttempt } from "@/lib/plan-detail/types";

type Props = {
  attempts: GateAttempt[];
  threshold: number;
  width?: number;
  height?: number;
};

function yForScore(score: number, height: number, pad: number) {
  const t = score / 100;
  return pad + (1 - t) * (height - pad * 2);
}

export function GateScoreSparkline({
  attempts,
  threshold,
  width = 120,
  height = 26,
}: Props): React.JSX.Element | null {
  if (attempts.length < 2) return null;

  // Source attempts are newest-first in `usePlanDetail`; flip to oldest-first for plotting.
  const ordered = [...attempts].reverse();
  const n = ordered.length;
  const pad = 2;

  const points = ordered
    .map((a, idx) => {
      const x = pad + (idx / Math.max(1, n - 1)) * (width - pad * 2);
      const y = yForScore(a.score, height, pad);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const thresholdY = yForScore(threshold, height, pad);

  return (
    <svg
      className="plan-sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <line
        x1={pad}
        x2={width - pad}
        y1={thresholdY}
        y2={thresholdY}
        className="plan-sparkline__threshold"
      />
      <polyline points={points} fill="none" className="plan-sparkline__line" />
      {ordered.map((a, idx) => {
        const x = pad + (idx / Math.max(1, n - 1)) * (width - pad * 2);
        const y = yForScore(a.score, height, pad);
        const cls = a.passed ? "plan-sparkline__dot plan-sparkline__dot--pass" : "plan-sparkline__dot plan-sparkline__dot--fail";
        return <circle key={a.id} cx={x} cy={y} r={2.2} className={cls} />;
      })}
    </svg>
  );
}

