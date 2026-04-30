interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div className="tp-bar" style={{ flex: 1 }}>
        <i style={{ width: `${safeValue}%` }} />
      </div>
      <span className="tp-mono" style={{ color: "var(--ink-2)", fontSize: "11px" }}>
        {safeValue}%
      </span>
    </div>
  );
}
