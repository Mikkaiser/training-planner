"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "@/components/ui/icons";

interface AddInlineProps {
  label: string;
  placeholder: string;
  onSubmit: (value: string) => void;
  large?: boolean;
  disabled?: boolean;
  /** Shown under the input, e.g. the design's Foundation/Intermediate pills. */
  suggestions?: readonly string[];
}

/**
 * The design's dashed "+ Add …" button, which expands into a single field
 * in place rather than opening a dialog or a window.prompt.
 */
export function AddInline({ label, placeholder, onSubmit, large, disabled, suggestions }: AddInlineProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    onSubmit(next);
    setValue("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        className={large ? "tp-ghost tp-ghost-lg" : "tp-ghost"}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <PlusIcon size={large ? 13 : 11} /> {label}
      </button>
    );
  }

  return (
    <div
      className="tp-card"
      style={{ padding: large ? 16 : 12, borderColor: "var(--accent)", boxShadow: "0 0 0 4px var(--accent-soft)" }}
    >
      <div className="tp-row tp-gap-2">
        <input
          ref={inputRef}
          className="tp-input"
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit(value);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setValue("");
              setOpen(false);
            }
          }}
          style={{ padding: "9px 12px", fontSize: 14 }}
        />
        <button type="button" className="tp-btn tp-btn-primary" onClick={() => submit(value)} disabled={!value.trim()}>
          Add
        </button>
        <button
          type="button"
          className="tp-btn tp-btn-ghost"
          onClick={() => {
            setValue("");
            setOpen(false);
          }}
        >
          Cancel
        </button>
      </div>

      {suggestions && suggestions.length > 0 ? (
        <div className="tp-row tp-gap-2 tp-mt-3" style={{ flexWrap: "wrap" }}>
          <span className="tp-tiny tp-mut">Quick add:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="tp-mono tp-tiny"
              onClick={() => submit(suggestion)}
              style={{
                background: "white",
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "3px 10px",
                cursor: "pointer",
                color: "var(--ink)",
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
