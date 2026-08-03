"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Announced to assistive tech; the visible header lives in children, since
   *  each of the design's panels has its own header composition. */
  ariaLabel: string;
  width?: number;
  children: React.ReactNode;
}

/**
 * Backdrop values come from the design's overlaid artboards: a 32% ink scrim
 * with a 6px blur over the dimmed page beneath.
 */
export function Modal({ open, onClose, ariaLabel, width = 520, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // Without this the page behind keeps scrolling under the overlay.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,31,51,0.32)",
        backdropFilter: "blur(6px)",
        zIndex: 90,
        display: "grid",
        placeItems: "center",
        padding: 20,
        overflowY: "auto",
      }}
      onMouseDown={(event) => {
        // mousedown on the backdrop only — a drag that starts inside the panel
        // and ends outside should not close it.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className="tp-card"
        style={{
          width: "100%",
          maxWidth: width,
          boxShadow: "var(--shadow-lg)",
          outline: "none",
          margin: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
