"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface InlineEditProps {
  value: string;
  onSubmit: (next: string) => void;
  /** Rendered as the resting state; the input inherits these styles. */
  style?: CSSProperties;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Click-to-edit text. Replaces the window.prompt() editing the scaffold used —
 * the design edits everything in place, and a native prompt cannot be styled,
 * cannot be cancelled with Escape predictably, and blocks the whole tab.
 *
 * Enter commits, Escape reverts, blur commits (so clicking away does not
 * silently discard a rename).
 */
export function InlineEdit({ value, onSubmit, style, ariaLabel, placeholder, disabled }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the draft in step when a server action revalidates with a new value.
  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === value) {
      setDraft(value);
      return;
    }
    onSubmit(next);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={disabled}
        aria-label={`${ariaLabel}: ${value}. Click to rename.`}
        style={{
          ...style,
          background: "transparent",
          border: "none",
          borderRadius: 6,
          padding: 0,
          margin: 0,
          font: "inherit",
          color: "inherit",
          textAlign: "left",
          cursor: disabled ? "default" : "text",
          letterSpacing: "inherit",
        }}
      >
        {value || <span className="tp-mut">{placeholder}</span>}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(value);
          setEditing(false);
        }
      }}
      style={{
        ...style,
        font: "inherit",
        color: "inherit",
        letterSpacing: "inherit",
        width: "100%",
        background: "var(--surface)",
        border: "1.5px solid var(--accent)",
        boxShadow: "0 0 0 4px var(--accent-soft)",
        borderRadius: 6,
        padding: "2px 6px",
        margin: "-2px -6px",
        outline: "none",
      }}
    />
  );
}
