"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/components/ui/icons";

interface SelectPillProps<T extends string> {
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  /** Matches the design's verb-level pill, which opens a mono uppercase menu. */
  variant?: "pill" | "tag";
  className?: string;
}

/**
 * The design draws the verb level as a pill with a chevron and shows the open
 * menu listing every level. This is that control: a real listbox rather than a
 * native <select>, because a native select cannot carry the pill styling.
 */
export function SelectPill<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled,
  variant = "pill",
  className,
}: SelectPillProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const triggerClass = variant === "pill" ? "tp-pill tp-pill-mono" : "tp-tag";

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        className={`${triggerClass} ${className ?? ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        style={{ cursor: disabled ? "default" : "pointer", gap: 4 }}
      >
        {value}
        {/* Only the verb pill carries a chevron in the design; the competence
            tag is drawn plain, so the tag variant stays plain here too. */}
        {variant === "pill" ? (
          <span style={{ opacity: 0.5, display: "inline-flex" }}>
            <ChevronIcon size={8} className={open ? "tp-chev open" : "tp-chev"} />
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="tp-card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 6px)",
            padding: 4,
            minWidth: 132,
            fontSize: 11,
            fontFamily: "var(--font-mono), monospace",
            boxShadow: "var(--shadow-lg)",
            zIndex: 20,
          }}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              onClick={() => {
                setOpen(false);
                if (option !== value) onChange(option);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: option === value ? "var(--accent-soft)" : "transparent",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 600,
                font: "inherit",
                color: "var(--ink)",
                whiteSpace: "nowrap",
              }}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
