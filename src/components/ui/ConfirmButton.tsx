"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface ConfirmButtonProps {
  label: string;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  children?: React.ReactNode;
}

/**
 * A destructive action behind an in-page confirmation. Replaces window.confirm,
 * which cannot be styled, freezes the tab, and on some browsers can be
 * suppressed entirely — meaning the delete would go through unconfirmed.
 */
export function ConfirmButton({
  label,
  title,
  body,
  confirmLabel,
  onConfirm,
  disabled,
  className = "tp-btn tp-btn-ghost tp-btn-sm",
  style,
  ariaLabel,
  children,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        onClick={() => setOpen(true)}
      >
        {children ?? label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} ariaLabel={title} width={420}>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</div>
          <p className="tp-mut tp-sm" style={{ marginTop: 8, marginBottom: 0, lineHeight: 1.55 }}>
            {body}
          </p>
          <div className="tp-row tp-gap-2 tp-mt-4" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="tp-btn tp-btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="tp-btn tp-btn-neg"
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
