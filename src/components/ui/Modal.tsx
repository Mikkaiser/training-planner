"use client";

import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,31,51,0.25)",
        backdropFilter: "blur(4px)",
        zIndex: 90,
        display: "grid",
        placeItems: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="tp-card"
        style={{ width: "100%", maxWidth: "560px", padding: "24px", borderRadius: "16px", boxShadow: "var(--shadow-lg)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontSize: "34px", letterSpacing: "-0.025em", lineHeight: 1.05 }}>{title}</h2>
          <button className="tp-btn tp-btn-ghost tp-btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
